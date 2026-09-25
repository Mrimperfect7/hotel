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
  screen: { flex: 1, backgroundColor: '#fcfaf6' },
  hero: { 
    backgroundColor: theme.temple, 
    borderRadius: 24, 
    padding: 24, 
    paddingTop: 32,
    shadowColor: theme.temple,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'visible'
  },
  heroKicker: { color: theme.goldLight, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 8, lineHeight: 40, letterSpacing: -0.5 },
  searchBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bandChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: -0.5, marginTop: 10, marginBottom: 4 },
  hotelCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginRight: 16, 
    width: 260, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  hotelImage: { width: '100%', height: 160, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  hotelName: { fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
  distance: { fontSize: 13, color: theme.kerala, marginTop: 4, fontWeight: '600' },
  price: { fontSize: 18, fontWeight: '900', color: theme.temple, marginTop: 12 },
  perNight: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
});
