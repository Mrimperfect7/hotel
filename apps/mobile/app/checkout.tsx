import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, ApiError, getToken } from '../src/lib/api';
import { theme } from '../src/lib/theme';

function isoPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Checkout() {
  const params = useLocalSearchParams<{
    hotel: string; room: string; hotelName: string; roomName: string; price: string;
  }>();
  const price = Number(params.price ?? 0);

  const [checkIn, setCheckIn] = useState(isoPlus(1));
  const [checkOut, setCheckOut] = useState(isoPlus(3));
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const subtotal = price * nights * Number(rooms);
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax;

  const inr = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  async function submit() {
    setBusy(true);
    try {
      const authed = Boolean(await getToken());
      const payload: Record<string, unknown> = {
        hotelId: params.hotel, roomTypeId: params.room, checkIn, checkOut,
        guests: Number(guests), rooms: Number(rooms),
      };
      if (!authed) payload.guest = guest;
      const res = await api.post<{ bookingCode: string; status: string }>('/api/bookings', payload, authed);
      Alert.alert(
        'Booking requested 🙏',
        `${res.bookingCode}\nThe hotel will confirm shortly.`,
        [{ text: 'View my bookings', onPress: () => router.replace('/(tabs)/bookings') }, { text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Booking failed', err instanceof ApiError ? err.message : 'Network error — please retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={styles.title}>{params.hotelName}</Text>
      <Text style={styles.sub}>{params.roomName}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>CHECK-IN</Text>
        <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD" placeholderTextColor={theme.subtext} />
        <Text style={styles.label}>CHECK-OUT</Text>
        <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="YYYY-MM-DD" placeholderTextColor={theme.subtext} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ROOMS</Text>
            <TextInput style={styles.input} value={rooms} onChangeText={setRooms} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>GUESTS</Text>
            <TextInput style={styles.input} value={guests} onChangeText={setGuests} keyboardType="number-pad" />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>PRICE ESTIMATE (server confirms final)</Text>
        <Row label={`${inr(price)} × ${nights} night${nights > 1 ? 's' : ''} × ${rooms}`} value={inr(subtotal)} />

        <Row label="Total" value={inr(total)} bold />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>YOUR DETAILS</Text>
        <TextInput style={styles.input} placeholder="Full name" value={guest.name} onChangeText={(v) => setGuest({ ...guest, name: v })} placeholderTextColor={theme.subtext} />
        <TextInput style={styles.input} placeholder="Phone (98XXXXXXXX)" keyboardType="phone-pad" value={guest.phone} onChangeText={(v) => setGuest({ ...guest, phone: v })} placeholderTextColor={theme.subtext} />
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={guest.email} onChangeText={(v) => setGuest({ ...guest, email: v })} placeholderTextColor={theme.subtext} />
      </View>

      <Pressable disabled={busy} style={styles.payBtn} onPress={submit}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {busy ? 'Sending…' : `Request Booking · ${inr(total)}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ color: theme.subtext, fontWeight: bold ? 'bold' : 'normal' }}>{label}</Text>
      <Text style={{ color: bold ? theme.gold : theme.text, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  sub: { fontSize: 13, color: theme.subtext },
  card: { backgroundColor: '#fff', borderRadius: theme.radius, padding: 14, gap: 8 },
  label: { fontSize: 10, fontWeight: '700', color: theme.subtext, letterSpacing: 1 },
  input: { backgroundColor: theme.templeLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.text },
  payBtn: { backgroundColor: theme.gold, borderRadius: 14, alignItems: 'center', paddingVertical: 16 },
});
