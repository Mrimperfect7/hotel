import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api, getToken } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';
import { formatINR, distanceLabel } from '@gsv/types';

type Room = {
  id: string; name: string; basePricePaise: number; bedType: string;
  maxOccupancy: number; acAvailable: boolean; availableNow: number;
  images: Array<{ url: string }> | null;
};
type Hotel = {
  id: string; name: string; description: string | null; addressLine1: string;
  distanceMeters: number | null; checkInTime: string; checkOutTime: string;
  images: Array<{ id: string; url: string }>;
  amenities: Array<{ id: string; icon: string; label: string }>;
  roomTypes: Room[];
};

export default function HotelDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api.get<{ hotel: Hotel }>(`/api/hotels/${slug}`)
      .then((r) => setHotel(r.hotel))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // Load favourite state for signed-in users.
  useEffect(() => {
    (async () => {
      if (!(await getToken()) || !hotel) return;
      setAuthed(true);
      api
        .get<{ favorites: Array<{ hotelId: string }> }>('/api/me/favorites', true)
        .then((r) => setFav(r.favorites.some((f) => f.hotelId === hotel.id)))
        .catch(() => {});
    })();
  }, [hotel]);

  async function toggleFav() {
    if (!hotel) return;
    const next = !fav;
    setFav(next);
    try {
      if (next) await api.post(`/api/me/favorites/${hotel.id}`, {}, true);
      else await api.del(`/api/me/favorites/${hotel.id}`, true);
    } catch {
      setFav(!next); // revert on failure
    }
  }

  if (loading) return <ActivityIndicator color={theme.gold} style={{ marginTop: 80 }} />;
  if (!hotel) return <Text style={{ padding: 40, textAlign: 'center' }}>Hotel unavailable.</Text>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {hotel.images.map((img) => (
          <Image key={img.id} source={{ uri: img.url }} style={{ width: 400, height: 240 }} />
        ))}
      </ScrollView>

      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={[styles.title, { flexShrink: 1 }]}>{hotel.name} <Text style={{ fontSize: 12 }}> ✔️</Text></Text>
          {authed && (
            <Pressable onPress={toggleFav} style={styles.favBtn} hitSlop={8} accessibilityLabel="Save hotel">
              <Text style={{ fontSize: 20 }}>{fav ? '❤️' : '🤍'}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.sub}>📍 {hotel.addressLine1}</Text>
        <Text style={styles.distance}>🛕 {hotel.distanceMeters != null ? `${distanceLabel(hotel.distanceMeters)} from Guruvayoor Temple` : ''}</Text>
        {hotel.description && <Text style={styles.body}>{hotel.description}</Text>}

        <Text style={styles.section}>Amenities</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {hotel.amenities.map((a) => (
            <View key={a.id} style={styles.amenityChip}>
              <Text style={{ fontSize: 12 }}>{a.icon} {a.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Rooms</Text>
        {hotel.roomTypes.map((room) => (
          <View key={room.id} style={styles.roomCard}>
            {room.images?.[0] && <Image source={{ uri: room.images[0].url }} style={styles.roomImage} />}
            <View style={{ padding: 12, gap: 2 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text }}>{room.name}</Text>
              <Text style={styles.sub}>🛏️ {room.bedType} · up to {room.maxOccupancy} · {room.acAvailable ? 'AC' : 'Non-AC'}</Text>
              <Text style={{ color: room.availableNow > 0 ? theme.kerala : theme.danger, fontSize: 12, fontWeight: '600' }}>
                {room.availableNow > 0 ? `${room.availableNow} available` : 'Sold out'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontWeight: 'bold', color: theme.temple, fontSize: 17 }}>{formatINR(room.basePricePaise)}<Text style={styles.small}> /night</Text></Text>
                <Pressable
                  disabled={room.availableNow === 0}
                  style={[styles.bookBtn, room.availableNow === 0 && { opacity: 0.5 }]}
                  onPress={() => router.push({ pathname: '/checkout', params: { hotel: hotel.id, room: room.id, hotelName: hotel.name, roomName: room.name, price: String(room.basePricePaise) } })}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Book This Room</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.section}>Good to know</Text>
        <Text style={styles.body}>Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  favBtn: { backgroundColor: '#fff', borderRadius: 999, padding: 8 },
  sub: { fontSize: 13, color: theme.subtext },
  distance: { fontSize: 13, color: theme.kerala, fontWeight: '600' },
  body: { fontSize: 14, color: theme.text, lineHeight: 21 },
  section: { fontSize: 17, fontWeight: 'bold', color: theme.text, marginTop: 8 },
  amenityChip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  roomCard: { backgroundColor: '#fff', borderRadius: theme.radius, overflow: 'hidden' },
  roomImage: { width: '100%', height: 120 },
  bookBtn: { backgroundColor: theme.gold, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  small: { fontSize: 11, color: theme.subtext, fontWeight: 'normal' },
});
