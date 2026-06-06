// app/(tabs)/clients.tsx — Jade AI Clients Screen
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';

const C = {
  bg: '#F9F4EF', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A',
  searchBg: '#EDE3D8',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

const CLIENTS = [
  { id: '1', name: 'Maria Rodriguez', phone: '+1 (512) 445-9021', visits: 7,  spend: 420, fave: 'Gel manicure',  initials: 'MR', color: '#EDE3D8', textColor: '#7A5A48' },
  { id: '2', name: 'Tanya Nguyen',    phone: '+1 (512) 334-8821', visits: 12, spend: 780, fave: 'Dip powder',    initials: 'TN', color: '#EAE0F0', textColor: '#5A3A8A' },
  { id: '3', name: 'Jessica Kim',     phone: '+1 (512) 229-4401', visits: 4,  spend: 290, fave: 'Full set acrylic', initials: 'JK', color: '#E8F0F8', textColor: '#2A4A7A' },
  { id: '4', name: 'Linda Tran',      phone: '+1 (512) 881-3320', visits: 9,  spend: 540, fave: 'Pedicure',      initials: 'LT', color: '#2A4A2A', textColor: '#FFFFFF' },
  { id: '5', name: 'Sarah Johnson',   phone: '+1 (512) 774-9901', visits: 2,  spend: 110, fave: 'Manicure',      initials: 'SJ', color: '#F5EEE8', textColor: '#8A6A48' },
];

function LangToggle({ lang, setLang }: { lang: 'vi'|'en'; setLang: (l: 'vi'|'en') => void }) {
  return (
    <View style={s.langWrap}>
      {(['vi','en'] as const).map(l => (
        <TouchableOpacity
          key={l}
          onPress={() => setLang(l)}
          style={[s.langBtn, { backgroundColor: lang === l ? C.langActive : C.langIdle }]}
          activeOpacity={0.8}
        >
          <Text style={[s.langTxt, { color: lang === l ? C.langActiveT : C.langIdleT }]}>
            {l.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ClientsScreen() {
  const { lang, setLang } = useJadeTheme();
  const vi = lang === 'vi';

  const [search, setSearch] = useState('');
  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const avgSpend  = Math.round(CLIENTS.reduce((a, c) => a + c.spend, 0) / CLIENTS.length);
  const avgVisits = Math.round(CLIENTS.reduce((a, c) => a + c.visits, 0) / CLIENTS.length);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: C.accent }]}>
            {vi ? 'DANH SÁCH KHÁCH' : 'CLIENT LIST'}
          </Text>
          <Text style={[s.title, { color: C.ink }]}>{vi ? 'Khách hàng' : 'Clients'}</Text>
        </View>
        <LangToggle lang={lang} setLang={setLang} />
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: C.searchBg }]}>
        <Text style={[s.searchIcon, { color: C.mut }]}>⌕</Text>
        <TextInput
          style={[s.searchInput, { color: C.ink }]}
          placeholder={vi ? 'Tìm khách hàng...' : 'Search clients...'}
          placeholderTextColor={C.mut}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { val: String(CLIENTS.length), label: vi ? 'Khách hàng' : 'Total',      sub: vi ? 'Total clients' : '' },
          { val: `$${avgSpend}`,         label: vi ? 'TB chi tiêu' : 'Avg spend',  sub: vi ? 'Avg spend'     : '' },
          { val: String(avgVisits),      label: vi ? 'TB lần đến'  : 'Avg visits', sub: vi ? 'Avg visits'    : '' },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: C.bg3 }]}>
            <Text style={[s.statVal,   { color: C.ink }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: C.sec }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}>
        {filtered.map(client => (
          <TouchableOpacity
            key={client.id}
            style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
            activeOpacity={0.75}
          >
            <View style={s.cardRow}>
              <View style={[s.avi, { backgroundColor: client.color }]}>
                <Text style={[s.aviText, { color: client.textColor }]}>{client.initials}</Text>
              </View>
              <View style={s.cardMid}>
                <Text style={[s.clientName, { color: C.ink }]}>{client.name}</Text>
                <Text style={[s.clientFave, { color: C.sec }]}>{client.fave}</Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.spend,  { color: C.ink }]}>${client.spend}</Text>
                <Text style={[s.visits, { color: C.mut }]}>
                  {client.visits} {vi ? 'lần' : 'visits'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow:     { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:       { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  langWrap:    { flexDirection: 'row', backgroundColor: '#EDE3D8', borderRadius: 100, padding: 3, gap: 2, marginTop: 4 },
  langBtn:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  langTxt:     { fontSize: 12, fontWeight: '700' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchIcon:  { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 15 },
  statsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  statCard:    { flex: 1, borderRadius: 14, padding: 11 },
  statVal:     { fontSize: 22, fontWeight: '400', letterSpacing: -0.3 },
  statLabel:   { fontSize: 11, fontWeight: '600', marginTop: 3 },
  card:        { borderRadius: 16, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avi:         { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aviText:     { fontSize: 16, fontWeight: '600' },
  cardMid:     { flex: 1 },
  clientName:  { fontSize: 16, fontWeight: '600' },
  clientFave:  { fontSize: 13, marginTop: 2 },
  cardRight:   { alignItems: 'flex-end' },
  spend:       { fontSize: 16, fontWeight: '600' },
  visits:      { fontSize: 12, marginTop: 2 },
});