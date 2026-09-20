import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, ApiError, getToken } from '../../src/lib/api';
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
  const [trackCode, setTrackCode] = useState('');
  const [trackContact, setTrackContact] = useState('');
  const [tracked, setTracked] = useState<Booking | null>(null);
  const [tracking, setTracking] = useState(false);

  async function track() {
    if (!trackCode.trim() || !trackContact.trim()) {
      Alert.alert('Missing details', 'Enter both the booking ID and the phone/email used to book.');
      return;
    }
    setTracking(true);
    setTracked(null);
    try {
      const p = new URLSearchParams({ code: trackCode.trim(), contact: trackContact.trim() });
      const r = await api.get<{ booking: Booking }>(`/api/bookings/track?${p.toString()}`);
      setTracked(r.booking);
    } catch (err) {
      Alert.alert('Not found', err instanceof ApiError ? err.message : 'Network error — please retry.');
    } finally {
      setTracking(false);
    }
  }

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
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 34 }}>🧾</Text>
          <Text style={{ color: theme.subtext, marginTop: 8, textAlign: 'center' }}>
            Sign in to see your bookings — or track a guest booking below.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Track a booking</Text>
          <TextInput
            style={styles.input}
            placeholder="Booking ID (GV-2026-XXXXXX)"
            autoCapitalize="characters"
            value={trackCode}
            onChangeText={(v) => setTrackCode(v.toUpperCase())}
            placeholderTextColor={theme.subtext}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone or email used at booking"
            autoCapitalize="none"
            value={trackContact}
            onChangeText={setTrackContact}
            placeholderTextColor={theme.subtext}
          />
          <Pressable style={styles.trackBtn} onPress={track} disabled={tracking}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tracking ? 'Searching…' : 'Track booking'}</Text>
          </Pressable>
        </View>

        {tracked && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.hotel}>{tracked.hotel.name}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[tracked.status] ?? theme.temple }]}>{tracked.status}</Text>
            </View>
            <Text style={styles.code}>{tracked.bookingCode}</Text>
            <Text style={styles.sub}>
              {tracked.roomName} × {tracked.roomsCount} · {tracked.checkIn.slice(0, 10)} → {tracked.checkOut.slice(0, 10)} · {tracked.guests} guest(s)
            </Text>
            <Text style={styles.price}>{formatINR(tracked.amounts.totalPaise)}</Text>
            <Text style={styles.sub}>📞 Hotel: {tracked.hotel.contactPhone}</Text>
          </View>
        )}
      </ScrollView>
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
  card: { backgroundColor: '#fff', borderRadius: theme.radius, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  input: { backgroundColor: theme.templeLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.text },
  trackBtn: { backgroundColor: theme.temple, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  hotel: { fontWeight: 'bold', fontSize: 15, color: theme.text, flex: 1 },
  status: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  code: { fontFamily: 'monospace', fontSize: 12, color: theme.gold, marginTop: 2 },
  sub: { fontSize: 12, color: theme.subtext, marginTop: 4 },
  price: { fontWeight: 'bold', color: theme.temple, marginTop: 6 },
});
