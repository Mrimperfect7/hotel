import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { formatINR, distanceLabel } from '@gsv/types';

type Hotel = {
  id: string; slug: string; name: string; coverImage: string | null;
  distanceMeters: number | null; rating: number; minPricePaise: number;
  roomTypes: Array<{ name: string; ac: boolean }>;
};

const SORTS = [
  ['recommended', 'Recommended'], ['nearest', '🛕 Nearest'], ['price_asc', 'Price ↑'],
  ['price_desc', 'Price ↓'], ['rating', 'Top rated'],
] as const;

export default function Explore() {
  const params = useLocalSearchParams<{ band?: string; q?: string }>();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [q, setQ] = useState(params.q ?? '');
  const [band, setBand] = useState(params.band ?? '');
  const [sort, setSort] = useState('recommended');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (band) p.set('band', band);
    if (maxPrice) p.set('maxPrice', maxPrice);
    p.set('sort', sort);
    setLoading(true);
    api.get<{ hotels: Hotel[] }>(`/api/hotels?${p.toString()}`)
      .then((r) => setHotels(r.hotels))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, band, sort, maxPrice]);

  return (
    <View style={styles.screen}>
      <View style={{ padding: 16, gap: 10 }}>
        <TextInput style={styles.input} placeholder="Search hotel or area" value={q} onChangeText={setQ} placeholderTextColor={theme.subtext} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['', 'u500', '500to1k', '1kto2k', '2kto5k'].map((b) => (
            <Pressable key={b || 'any'} onPress={() => setBand(b)}
              style={[styles.chip, band === b && styles.chipOn]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: band === b ? '#fff' : theme.temple }}>
                {b === '' ? 'Any distance' : b === 'u500' ? '<500m' : b === '500to1k' ? '0.5–1km' : b === '1kto2k' ? '1–2km' : '2–5km'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORTS.map(([key, label]) => (
            <Pressable key={key} onPress={() => setSort(key)} style={[styles.chip, sort === key && styles.chipOn]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: sort === key ? '#fff' : theme.temple }}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput style={styles.input} placeholder="Max budget ₹ (e.g. 2500)" value={maxPrice} onChangeText={setMaxPrice} keyboardType="number-pad" placeholderTextColor={theme.subtext} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>
              🛕 No stays match. Try widening filters.
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/hotel/[slug]', params: { slug: item.slug } }} asChild>
              <Pressable style={styles.card}>
                {item.coverImage && <Image source={{ uri: item.coverImage }} style={styles.cover} />}
                <View style={{ padding: 12 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>
                    🛕 {item.distanceMeters != null ? distanceLabel(item.distanceMeters) : '—'}
                    {'  ·  '}{item.roomTypes.slice(0, 2).map((r) => r.name).join(', ')}
                  </Text>
                  <Text style={styles.price}>{formatINR(item.minPricePaise)}<Text style={styles.small}> / night</Text></Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: theme.text },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  chipOn: { backgroundColor: theme.temple },
  card: { backgroundColor: '#fff', borderRadius: theme.radius, overflow: 'hidden' },
  cover: { width: '100%', height: 150 },
  name: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  sub: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  price: { color: theme.temple, fontWeight: 'bold', fontSize: 16, marginTop: 6 },
  small: { fontSize: 11, color: theme.subtext, fontWeight: 'normal' },
});
