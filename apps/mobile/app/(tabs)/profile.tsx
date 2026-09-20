import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, clearTokens, getToken, setTokens } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';

export default function Profile() {
  const [me, setMe] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ identifier: '', password: '', name: '', email: '', phone: '' });

  async function load() {
    if (!(await getToken())) { setLoading(false); return; }
    api.get<{ user: { name: string; email: string; role: string } }>('/api/auth/me', true)
      .then((r) => setMe(r.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    try {
      if (mode === 'login') {
        const res = await api.post<{ accessToken: string; refreshToken: string }>('/api/auth/login', {
          identifier: form.identifier, password: form.password,
        });
        await setTokens(res.accessToken, res.refreshToken);
      } else {
        const res = await api.post<{ accessToken: string; refreshToken: string }>('/api/auth/register', {
          name: form.name, email: form.email, phone: form.phone, password: form.password, role: 'CUSTOMER',
        });
        await setTokens(res.accessToken, res.refreshToken);
      }
      setLoading(true);
      setMe(null);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  async function logout() {
    await clearTokens();
    setMe(null);
  }

  if (loading) return <ActivityIndicator color={theme.gold} style={{ marginTop: 60 }} />;

  return (
    <View style={styles.screen}>
      {me ? (
        <View style={{ padding: 16, gap: 12 }}>
          <View style={styles.card}>
            <Text style={{ fontSize: 40 }}>🙏</Text>
            <Text style={styles.name}>{me.name}</Text>
            <Text style={styles.sub}>{me.email} · {me.role}</Text>
          </View>
          <Pressable style={styles.btnDanger} onPress={logout}>
            <Text style={{ color: theme.danger, fontWeight: 'bold' }}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Join Guruvayoor Stay'}</Text>
          <View style={styles.card}>
            {mode === 'register' && (
              <>
                <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor={theme.subtext} />
                <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholderTextColor={theme.subtext} />
                <TextInput style={styles.input} placeholder="Phone (98XXXXXXXX)" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholderTextColor={theme.subtext} />
              </>
            )}
            {mode === 'login' && (
              <TextInput style={styles.input} placeholder="Email or phone" autoCapitalize="none" value={form.identifier} onChangeText={(v) => setForm({ ...form, identifier: v })} placeholderTextColor={theme.subtext} />
            )}
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholderTextColor={theme.subtext} />
            <Pressable style={styles.btn} onPress={submit}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            </Pressable>
            <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={{ textAlign: 'center', color: theme.gold, fontWeight: '600', marginTop: 4 }}>
                {mode === 'login' ? 'New here? Create account' : 'Have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.ivory },
  card: { backgroundColor: '#fff', borderRadius: theme.radius, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  name: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  sub: { color: theme.subtext, fontSize: 13 },
  input: { backgroundColor: theme.templeLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: theme.text },
  btn: { backgroundColor: theme.temple, borderRadius: 12, alignItems: 'center', paddingVertical: 13 },
  btnDanger: { backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', paddingVertical: 13 },
});
