// app/(tabs)/clients.tsx — Jade AI Clients Screen (Supabase-derived)
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';
import { supabase } from '../../lib/supabase';

const C = {
  bg: '#F9F4EF', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

const SALON = 'aa567339-4580-43ff-abb1-87b02359834e';

const AVI_COLORS = [
  { bg: '#EDE3D8', text: '#7A5A48' },
  { bg: '#EAE0F0', text: '#5A3A8A' },
  { bg: '#E8F0F8', text: '#2A4A7A' },
  { bg: '#2A4A2A', text: '#FFFFFF' },
  { bg: '#F5EEE8', text: '#8A6A48' },
  { bg: '#F0E8E0', text: '#6A4A38' },
];

interface Client {
  phone: string;
  name: string;
  visits: number;
  lastVisit: string;   // ISO string
  favService: string;
  aviColor: { bg: string; text: string };
  initials: string;
}

function deriveClients(bookings: any[]): Client[] {
  const map = new Map<string, { name: string; visits: any[]; services: string[] }>();

  for (const b of bookings) {
    const phone = b.client_phone ?? 'unknown';
    if (!map.has(phone)) {
      map.set(phone, { name: b.client_name ?? '—', visits: [], services: [] });
    }
    const entry = map.get(phone)!;
    entry.visits.push(b.start_time);
    if (b.service) entry.services.push(b.service);
  }

  const clients: Client[] = [];
  let colorIdx = 0;

  for (const [phone, data] of map.entries()) {
    const sorted = [...data.visits].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Most frequent service
    const freq = new Map<string, number>();
    for (const svc of data.services) freq.set(svc, (freq.get(svc) ?? 0) + 1);
    const favService = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const nameParts = data.name.trim().split(' ');
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : data.name.slice(0, 2).toUpperCase();

    clients.push({
      phone,
      name: data.name,
      visits: data.visits.length,
      lastVisit: sorted[0] ?? '',
      favService,
      aviColor: AVI_COLORS[colorIdx % AVI_COLORS.length],
      initials,
    });
    colorIdx++;
  }

  return clients.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
}

function formatLastVisit(iso: string, vi: boolean): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return vi
    ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('client_phone, client_name, service, start_time')
      .eq('salon_id', SALON)
      .not('client_phone', 'is', null)
      .order('start_time', { ascending: false });

    if (error) { console.error('Clients fetch error:', error.message); return; }
    setClients(deriveClients(data ?? []));
  }, []);

  useEffect(() => {
    fetchClients().finally(() => setLoading(false));
  }, [fetchClients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const avgVisits = clients.length
    ? Math.round(clients.reduce((a, c) => a + c.visits, 0) / clients.length)
    : 0;

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
      <View style={[s.searchWrap, { backgroundColor: C.bg3 }]}>
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
          { val: String(clients.length), label: vi ? 'Khách hàng' : 'Total'      },
          { val: String(avgVisits),      label: vi ? 'TB lần đến'  : 'Avg visits' },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: C.bg3 }]}>
            <Text style={[s.statVal,   { color: C.ink }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: C.sec }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={[s.loadingText, { color: C.mut }]}>{vi ? 'Đang tải...' : 'Loading...'}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          {filtered.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyText, { color: C.mut }]}>
                {search ? (vi ? 'Không tìm thấy' : 'No results') : (vi ? 'Chưa có khách hàng' : 'No clients yet')}
              </Text>
            </View>
          ) : (
            filtered.map(client => (
              <TouchableOpacity
                key={client.phone}
                style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
                activeOpacity={0.75}
              >
                <View style={s.cardRow}>
                  <View style={[s.avi, { backgroundColor: client.aviColor.bg }]}>
                    <Text style={[s.aviText, { color: client.aviColor.text }]}>{client.initials}</Text>
                  </View>
                  <View style={s.cardMid}>
                    <Text style={[s.clientName, { color: C.ink }]}>{client.name}</Text>
                    <Text style={[s.clientFave, { color: C.sec }]}>{client.favService}</Text>
                    <Text style={[s.clientLast, { color: C.mut }]}>
                      {vi ? 'Lần cuối: ' : 'Last: '}{formatLastVisit(client.lastVisit, vi)}
                    </Text>
                  </View>
                  <View style={s.cardRight}>
                    <Text style={[s.visits, { color: C.ink }]}>{client.visits}</Text>
                    <Text style={[s.visitsLabel, { color: C.mut }]}>{vi ? 'lần' : 'visits'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
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
  clientLast:  { fontSize: 12, marginTop: 2 },
  cardRight:   { alignItems: 'flex-end' },
  visits:      { fontSize: 20, fontWeight: '400' },
  visitsLabel: { fontSize: 11, marginTop: 2 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText: { fontSize: 14 },
  emptyWrap:   { alignItems: 'center', paddingTop: 60 },
  emptyText:   { fontSize: 14 },
});