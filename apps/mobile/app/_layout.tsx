import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { api, getToken, setTokens } from '../src/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (await getToken()) {
        // Register push token with the backend (FCM/expo push abstraction).
        api.post('/api/me/devices', { token, platform: 'android' }, true).catch(() => {});
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1e3a6e' },
          headerTintColor: '#f9ecc8',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#faf6ec' },
        }}
      />
    </>
  );
}
