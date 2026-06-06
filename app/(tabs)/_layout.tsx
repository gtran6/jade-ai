// app/(tabs)/_layout.tsx — Jade AI tab navigator
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useJadeTheme } from '@/lib/ThemeContext';

const TC = { navBg: '#F2EAE0', active: '#3D2B2B', idle: '#C4A090', border: 'rgba(61,43,43,0.10)' };

function TabIcon({ emoji, label, focused, color }: {
  emoji: string; label: string; focused: boolean; color: string;
}) {
  return (
    <View style={s.item}>
      <Text style={[s.emoji, { color }]}>{emoji}</Text>
      <Text style={[s.label, { color, fontWeight: focused ? '700' : '500' }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { lang } = useJadeTheme();
  const vi = lang === 'vi';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: TC.navBg,
        borderTopColor: TC.border,
        borderTopWidth: 0.5,
        height: 80,
        paddingBottom: 12,
        paddingTop: 6,
      },
      tabBarActiveTintColor:   TC.active,
      tabBarInactiveTintColor: TC.idle,
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="⌂" label={vi ? 'Nguồn' : 'Feed'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="calendar" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="▦" label={vi ? 'Lịch' : 'Calendar'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="clients" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="◎" label={vi ? 'Khách' : 'Clients'} focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="✦" label={vi ? 'Cài đặt' : 'Settings'} focused={focused} color={color} />,
      }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  item:  { alignItems: 'center', justifyContent: 'center', paddingTop: 4, width: 72 },
  emoji: { fontSize: 22 },
  label: { fontSize: 11, marginTop: 2 },
});