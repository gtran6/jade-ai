// app/(tabs)/_layout.tsx — Jade AI tab navigator
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useJadeTheme } from '@/lib/ThemeContext';

const L = { navBg: '#F2EAE0', active: '#3D2B2B', idle: '#C4A090', border: 'rgba(61,43,43,0.10)' };
const D = { navBg: '#1A1208', active: '#C4957A', idle: '#5A3E30', border: 'rgba(200,160,120,0.12)' };

function TabIcon({ emoji, label, vi, focused, color }: {
  emoji: string; label: string; vi: string; focused: boolean; color: string;
}) {
  return (
    <View style={s.item}>
      <Text style={[s.emoji, { color }]}>{emoji}</Text>
      <Text style={[s.label, { color }]}>{vi}</Text>
      <Text style={[s.sub, { color: focused ? color : 'transparent' }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { scheme } = useJadeTheme();
  const C = scheme === 'dark' ? D : L;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: C.navBg,
        borderTopColor: C.border,
        borderTopWidth: 0.5,
        height: 80,
        paddingBottom: 12,
        paddingTop: 6,
      },
      tabBarActiveTintColor:   C.active,
      tabBarInactiveTintColor: C.idle,
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="⌂" label="Feed" vi="Nguồn" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="calendar" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="▦" label="Calendar" vi="Lịch" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="clients" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="◎" label="Clients" vi="Khách" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        tabBarIcon: ({ color, focused }) =>
          <TabIcon emoji="✦" label="Settings" vi="Cài đặt" focused={focused} color={color} />,
      }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  item:  { alignItems: 'center', justifyContent: 'center', paddingTop: 4, width: 72 },
  emoji: { fontSize: 24 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sub:   { fontSize: 9 },
});