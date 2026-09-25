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
  screen: { flex: 1, backgroundColor: '#fcfaf6' },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    color: theme.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    fontWeight: '500'
  },
  chip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1, borderColor: '#eaeaea' },
  chipOn: { backgroundColor: theme.temple, borderColor: theme.temple },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    marginBottom: 8
  },
  cover: { width: '100%', height: 180 },
  name: { fontSize: 18, fontWeight: '900', color: theme.text, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: theme.subtext, marginTop: 4, fontWeight: '500' },
  price: { color: theme.temple, fontWeight: '900', fontSize: 18, marginTop: 10 },
  small: { fontSize: 13, color: theme.subtext, fontWeight: '500' },
});
