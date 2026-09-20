import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#c98d1a',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#faf6ec' },
        headerStyle: { backgroundColor: '#1e3a6e' },
        headerTintColor: '#f9ecc8',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Namma Guruvayoor', tabBarIcon: ({ focused }) => <TabIcon icon="🛕" focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ focused }) => <TabIcon icon="🧾" focused={focused} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ focused }) => <TabIcon icon="❤️" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tabs>
  );
}
