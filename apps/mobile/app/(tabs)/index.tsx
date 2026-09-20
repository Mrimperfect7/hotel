import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { api } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { formatINR, distanceLabel } from '@gsv/types';

type Hotel = {
  id: string; slug: string; name: string; coverImage: string | null;
  distanceMeters: number | null; rating: number; minPricePaise: number;
};

export default function Home() {
  const [featured, setFeatured] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ hotels: Hotel[] }>('/api/hotels?limit=10&sort=rating')
      .then((r) => setFeatured(r.hotels))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Guruvayoor · Kerala</Text>
        <Text style={styles.heroTitle}>Stay Near{'\n'}Guruvayoor Temple 🛕</Text>
        <Pressable style={styles.searchBox} onPress={() => router.push('/explore')}>
          <Text style={{ color: theme.subtext }}>🔍  Where do you want to stay?</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {['Under 500 m', '500m–1km', '1–2km', '2–5km'].map((b, i) => (
            <Pressable key={b} style={styles.bandChip} onPress={() => router.push({ pathname: '/explore', params: { band: ['u500', '500to1k', '1kto2k', '2kto5k'][i] } })}>
              <Text style={{ color: theme.temple, fontSize: 12, fontWeight: '600' }}>🛕 {b}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Top rated stays</Text>
      {loading ? (
        <ActivityIndicator color={theme.gold} />
      ) : (
        <FlatList
          data={featured}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/hotel/[slug]', params: { slug: item.slug } }} asChild>
              <Pressable style={styles.hotelCard}>
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage }} style={styles.hotelImage} />
                ) : (
                  <View style={[styles.hotelImage, { backgroundColor: theme.templeLight }]} />
                )}
                <View style={{ padding: 12 }}>
                  <Text style={styles.hotelName}>{item.name}</Text>
                  <Text style={styles.distance}>
                    🛕 {item.distanceMeters != null ? distanceLabel(item.distanceMeters) : '—'} from temple
                    {item.rating > 0 ? `  ·  ★ ${item.rating.toFixed(1)}` : ''}
                  </Text>
                  <Text style={styles.price}>{formatINR(item.minPricePaise)} <Text style={styles.perNight}>/ night</Text></Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  hero: { backgroundColor: theme.temple, borderRadius: 20, padding: 20 },
  heroKicker: { color: theme.goldLight, fontSize: 12, letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 6, lineHeight: 34 },
  searchBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 16 },
  bandChip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  hotelCard: { backgroundColor: '#fff', borderRadius: theme.radius, marginRight: 12, width: 240, overflow: 'hidden' },
  hotelImage: { width: '100%', height: 130 },
  hotelName: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  distance: { fontSize: 12, color: theme.kerala, marginTop: 2 },
  price: { fontSize: 15, fontWeight: 'bold', color: theme.temple, marginTop: 6 },
  perNight: { fontSize: 11, color: theme.subtext, fontWeight: 'normal' },
});
