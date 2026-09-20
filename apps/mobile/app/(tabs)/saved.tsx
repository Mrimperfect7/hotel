import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { api, getToken } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { formatINR } from '@gsv/types';

type Fav = {
  hotelId: string; slug: string; name: string; minPricePaise: number;
  rating: number; distanceMeters: number | null; coverImage: string | null;
};

export default function Saved() {
  const [favs, setFavs] = useState<Fav[] | null>(null);
  const [authed, setAuthed] = useState(false);

  const load = useCallback(() => {
    (async () => {
      if (!(await getToken())) { setAuthed(false); return; }
      setAuthed(true);
      api.get<{ favorites: Fav[] }>('/api/me/favorites', true)
        .then((r) => setFavs(r.favorites))
        .catch(() => setFavs([]));
    })();
  }, []);

  useEffect(load, [load]);

  if (!authed) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 34 }}>❤️</Text>
        <Text style={{ color: theme.subtext, marginTop: 8 }}>Sign in to save favourite stays.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={favs ?? []}
      keyExtractor={(f) => f.hotelId}
      ListEmptyComponent={
        favs === null
          ? <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          : <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 60 }}>No saved stays yet — tap ♡ on a hotel.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.coverImage && <Image source={{ uri: item.coverImage }} style={styles.cover} />}
          <View style={{ padding: 12 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              🛕 {item.distanceMeters != null ? `${Math.round(item.distanceMeters)} m` : '—'} · from {formatINR(item.minPricePaise)}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.ivory },
  card: { backgroundColor: '#fff', borderRadius: theme.radius, overflow: 'hidden' },
  cover: { width: '100%', height: 130 },
  name: { fontWeight: 'bold', color: theme.text, fontSize: 15 },
  sub: { fontSize: 12, color: theme.subtext, marginTop: 2 },
});
