// app/(tabs)/clients.tsx — Jade AI Clients Screen
import { useJadeTheme } from '@/lib/ThemeContext';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const L = {
  bg: '#F9F4EF', bg2: '#F2EAE0', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78',
  pillConf: '#E8E0F0', pillConfT: '#4A2A6A',
  aviBg: '#EDE3D8', aviT: '#7A5A48',
};
const D = {
  bg: '#140E0A', bg2: '#1E1410', bg3: '#2A1E16',
  card: '#1E1410', ink: '#E8D4C0', sec: '#9A7A68',
  mut: '#5A3E30', faint: '#3A2A20', border: 'rgba(200,160,120,0.12)',
  accent: '#C4957A', green: '#6A9A68',
  pillConf: '#1A1228', pillConfT: '#9A78C0',
  aviBg: '#2A1E16', aviT: '#9A7A68',
};

const CLIENTS = [
  { id: '1', name: 'Maria Rodriguez', phone: '+1 (512) 445-9021', visits: 7,  spend: '$420', fave: 'Gel manicure',  last: '10/6/2025', initials: 'MR', color: '#EDE3D8', textColor: '#7A5A48' },
  { id: '2', name: 'Tanya Nguyen',    phone: '+1 (512) 334-8821', visits: 12, spend: '$780', fave: 'Dip powder',    last: '11/6/2025', initials: 'TN', color: '#EAE0F0', textColor: '#5A3A8A' },
  { id: '3', name: 'Jessica Kim',     phone: '+1 (512) 229-4401', visits: 4,  spend: '$290', fave: 'Acrylic set',   last: '10/6/2025', initials: 'JK', color: '#E8F0F8', textColor: '#2A4A7A' },
  { id: '4', name: 'Linda Tran',      phone: '+1 (512) 881-3320', visits: 9,  spend: '$540', fave: 'Pedicure',      last: '8/6/2025',  initials: 'LT', color: '#EAF2EA', textColor: '#3A6A3A' },
  { id: '5', name: 'Sarah Johnson',   phone: '+1 (512) 774-9901', visits: 2,  spend: '$110', fave: 'Manicure',      last: '5/6/2025',  initials: 'SJ', color: '#F5EEE8', textColor: '#8A6A48' },
];

export default function ClientsScreen() {
  const { scheme } = useJadeTheme();
  const C = scheme === 'dark' ? D : L;
  const [search, setSearch] = useState('');

  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.eyebrow, { color: C.accent }]}>DANH SÁCH KHÁCH</Text>
        <Text style={[s.title,   { color: C.ink   }]}>Khách hàng</Text>
        <Text style={[s.viSub,   { color: C.sec   }]}>Clients · {CLIENTS.length} người</Text>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: C.bg3, borderColor: C.border }]}>
        <Text style={[s.searchIcon, { color: C.mut }]}>⌕</Text>
        <Text style={[s.searchPlaceholder, { color: C.mut }]}>Tìm khách hàng... · Search clients</Text>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        {[
          { val: String(CLIENTS.length), label: 'Khách hàng', vi: 'Total clients' },
          { val: '$'+Math.round(CLIENTS.reduce((a,c)=>a+parseInt(c.spend.replace('$','')),0)/CLIENTS.length), label: 'TB chi tiêu', vi: 'Avg spend' },
          { val: String(Math.round(CLIENTS.reduce((a,c)=>a+c.visits,0)/CLIENTS.length)), label: 'TB lần đến', vi: 'Avg visits' },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: C.bg3 }]}>
            <Text style={[s.statVal,   { color: C.ink }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: C.sec }]}>{st.label}</Text>
            <Text style={[s.statVi,    { color: C.mut }]}>{st.vi}</Text>
          </View>
        ))}
      </View>

      {/* Client list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}>
        {filtered.map((client) => (
          <TouchableOpacity key={client.id} style={[s.card, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.75}>
            <View style={s.cardRow}>
              <View style={[s.avi, { backgroundColor: client.color }]}>
                <Text style={[s.aviText, { color: client.textColor }]}>{client.initials}</Text>
              </View>
              <View style={s.cardMid}>
                <Text style={[s.clientName, { color: C.ink }]}>{client.name}</Text>
                <Text style={[s.clientPhone, { color: C.sec }]}>{client.phone}</Text>
                <Text style={[s.clientFave,  { color: C.mut }]}>{client.fave} · Lần cuối: {client.last}</Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.spend,  { color: C.ink }]}>{client.spend}</Text>
                <Text style={[s.visits, { color: C.mut }]}>{client.visits} lần</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow:{ fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:  { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  viSub:  { fontSize: 14, marginTop: 2 },

  searchWrap:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, borderRadius: 12, padding: 12, borderWidth: 0.5, marginBottom: 12 },
  searchIcon:       { fontSize: 18 },
  searchPlaceholder:{ fontSize: 15 },

  statsRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  statCard:  { flex: 1, borderRadius: 14, padding: 11 },
  statVal:   { fontSize: 22, fontWeight: '400', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  statVi:    { fontSize: 10, marginTop: 1 },

  card:       { borderRadius: 16, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avi:        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aviText:    { fontSize: 16, fontWeight: '600' },
  cardMid:    { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientPhone:{ fontSize: 13, marginTop: 2 },
  clientFave: { fontSize: 12, marginTop: 2 },
  cardRight:  { alignItems: 'flex-end' },
  spend:      { fontSize: 16, fontWeight: '600' },
  visits:     { fontSize: 12, marginTop: 2 },
});