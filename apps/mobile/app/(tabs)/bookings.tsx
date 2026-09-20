import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, getToken } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { formatINR } from '@gsv/types';

type Booking = {
  id: string; bookingCode: string; status: string; checkIn: string; checkOut: string;
  roomName: string; roomsCount: number; guests: number;
  hotel: { name: string; contactPhone: string };
  amounts: { totalPaise: number };
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: theme.kerala, PENDING: theme.gold, CANCELLED: theme.danger,
  REJECTED: theme.danger, COMPLETED: theme.temple, NO_SHOW: theme.danger,
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const hasToken = Boolean(await getToken());
      setAuthed(hasToken);
      if (!hasToken) return;
      api.get<{ bookings: Booking[] }>('/api/bookings/mine', true)
        .then((r) => setBookings(r.bookings))
        .catch(() => setBookings([]));
    })();
  }, []);

  if (authed === null) return <ActivityIndicator color={theme.gold} style={{ marginTop: 60 }} />;
  if (!authed) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 34 }}>🧾</Text>
        <Text style={{ color: theme.subtext, marginTop: 8, textAlign: 'center' }}>
          Sign in to see your bookings — or book as guest and track with your booking ID.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={bookings ?? []}
      keyExtractor={(b) => b.id}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 60 }}>No bookings yet 🛕</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.hotel}>{item.hotel.name}</Text>
            <Text style={[styles.status, { color: STATUS_COLORS[item.status] ?? theme.temple }]}>{item.status}</Text>
          </View>
          <Text style={styles.code}>{item.bookingCode}</Text>
          <Text style={styles.sub}>{item.roomName} × {item.roomsCount} · {item.checkIn.slice(0, 10)} → {item.checkOut.slice(0, 10)}</Text>
          <Text style={styles.price}>{formatINR(item.amounts.totalPaise)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: theme.ivory },
  card: { backgroundColor: '#fff', borderRadius: theme.radius, padding: 14 },
  hotel: { fontWeight: 'bold', fontSize: 15, color: theme.text, flex: 1 },
  status: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  code: { fontFamily: 'monospace', fontSize: 12, color: theme.gold, marginTop: 2 },
  sub: { fontSize: 12, color: theme.subtext, marginTop: 4 },
  price: { fontWeight: 'bold', color: theme.temple, marginTop: 6 },
});
