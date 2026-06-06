// app/(tabs)/index.tsx — Jade AI Feed Screen (live Supabase data)
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Booking, FeedItem, MissedCall, supabase } from '../../lib/supabase';

import { useJadeTheme } from '@/lib/ThemeContext';

const L = {
  bg: '#F9F4EF', bg2: '#F2EAE0', bg3: '#EDE3D8',
  card: '#FFFFFF', cardMiss: '#FFF3EE',
  ink: '#3D2B2B', sec: '#8A6A58', mut: '#B09080', faint: '#D4BFB0',
  border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  pillNew: '#EAF4EA', pillNewT: '#2A6A28',
  pillConf: '#E8E0F0', pillConfT: '#4A2A6A',
  aviBg: '#EDE3D8', aviT: '#7A5A48',
  aviMiss: '#F5DDD5', aviMissT: '#8A3A2A',
};
const D = {
  bg: '#140E0A', bg2: '#1E1410', bg3: '#2A1E16',
  card: '#1E1410', cardMiss: '#211410',
  ink: '#E8D4C0', sec: '#9A7A68', mut: '#5A3E30', faint: '#3A2A20',
  border: 'rgba(200,160,120,0.12)',
  accent: '#C4957A', green: '#6A9A68', red: '#C06858',
  pillNew: '#0E1E0E', pillNewT: '#6A9A68',
  pillConf: '#1A1228', pillConfT: '#9A78C0',
  aviBg: '#2A1E16', aviT: '#9A7A68',
  aviMiss: '#2A1208', aviMissT: '#C06858',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2)  return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const days = ['CN','T2','T3','T4','T5','T6','T7'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1} · ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Booking Card ───────────────────────────────────────────────────────────

function BookingCard({ item, C, onConfirm }: {
  item: Booking; C: typeof L; onConfirm: (id: string) => void;
}) {
  const isNew = item.status === 'pending' ||
    (Date.now() - new Date(item.created_at).getTime()) < 5 * 60 * 1000;

  return (
    <View style={[
      s.card,
      { backgroundColor: C.card, borderColor: isNew ? C.green : C.border },
      isNew && { borderWidth: 1.5 },
    ]}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <View style={[s.avi, { backgroundColor: C.aviBg }]}>
            <Text style={[s.aviText, { color: C.aviT }]}>{initials(item.client_name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.clientName, { color: C.ink }]}>{item.client_name ?? 'Unknown'}</Text>
            <Text style={[s.clientSub,  { color: C.sec }]}>
              {item.service ?? '—'}{item.technician_name ? ` · ${item.technician_name}` : ''}
            </Text>
          </View>
        </View>
        <Text style={[s.relTime, { color: C.mut }]}>{relativeTime(item.created_at)}</Text>
      </View>

      <View style={s.metaRow}>
        <View style={[s.pill, { backgroundColor: isNew ? C.pillNew : C.pillConf }]}>
          <Text style={[s.pillText, { color: isNew ? C.pillNewT : C.pillConfT }]}>
            {isNew ? 'Mới · New' : 'Đã xác nhận'}
          </Text>
        </View>
        <Text style={[s.timeText, { color: C.sec }]}>📅 {formatTime(item.start_time)}</Text>
      </View>

      {isNew ? (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: C.ink }]}
            activeOpacity={0.8}
            onPress={() => onConfirm(item.id)}
          >
            <Text style={[s.btnText, { color: C.bg }]}>Xác nhận</Text>
            <Text style={[s.btnVi, { color: 'rgba(255,255,255,0.5)' }]}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: C.bg3 }]} activeOpacity={0.8}>
            <Text style={[s.btnText, { color: C.sec }]}>Đổi lịch</Text>
            <Text style={[s.btnVi, { color: C.faint }]}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnSm, { backgroundColor: C.bg3 }]} activeOpacity={0.8}>
            <Text style={{ color: C.sec, fontSize: 20 }}>✆</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.smsRow}>
          <Text style={[s.smsText, { color: C.green }]}>✓ Đã gửi SMS · SMS sent</Text>
        </View>
      )}
    </View>
  );
}

// ── Missed Call Card ───────────────────────────────────────────────────────

function MissedCard({ item, C }: { item: MissedCall; C: typeof L }) {
  const snippet = item.transcript
    ? `"${item.transcript.slice(0, 80)}${item.transcript.length > 80 ? '…' : ''}"`
    : item.reason ?? '';

  return (
    <View style={[s.card, { backgroundColor: C.cardMiss, borderColor: `${C.red}44` }]}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <View style={[s.avi, { backgroundColor: C.aviMiss }]}>
            <Text style={[s.aviText, { color: C.aviMissT }]}>!</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.clientName, { color: C.red }]}>Lỡ lịch hẹn</Text>
            <Text style={[s.clientSub,  { color: C.aviMissT }]}>{item.caller_phone ?? '—'}</Text>
          </View>
        </View>
        <Text style={[s.relTime, { color: C.mut }]}>{relativeTime(item.created_at)}</Text>
      </View>

      {!!snippet && (
        <View style={[s.snippet, { borderLeftColor: C.faint }]}>
          <Text style={[s.snippetText, { color: C.mut }]}>{snippet}</Text>
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, { backgroundColor: C.ink }]} activeOpacity={0.8}>
          <Text style={[s.btnText, { color: C.bg }]}>Gọi lại</Text>
          <Text style={[s.btnVi, { color: 'rgba(255,255,255,0.5)' }]}>Call back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: C.bg3 }]} activeOpacity={0.8}>
          <Text style={[s.btnText, { color: C.sec }]}>Bỏ qua</Text>
          <Text style={[s.btnVi, { color: C.faint }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Feed Screen ────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { scheme } = useJadeTheme();
  const C = scheme === 'dark' ? D : L;

  const [feed,       setFeed]       = useState<FeedItem[]>([]);
  const [stats,      setStats]      = useState({ today: 0, week: 0, revenue: 0 });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch feed ───────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    const ACTIVE_SALON_ID = 'aa567339-4580-43ff-abb1-87b02359834e';

    const [bookingsRes, missedRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('salon_id', ACTIVE_SALON_ID)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('missed_calls')
        .select('*')
        .eq('salon_id', ACTIVE_SALON_ID)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const bookings: FeedItem[] = (bookingsRes.data ?? []).map(
      (b: Booking) => ({ ...b, type: 'booking' as const })
    );
    const missed: FeedItem[] = (missedRes.data ?? []).map(
      (m: MissedCall) => ({ ...m, type: 'missed' as const })
    );

    const merged = [...bookings, ...missed].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFeed(merged);
    setStats({
      today:   bookings.length,
      week:    bookings.length,
      revenue: bookings.length * 65,
    });
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  // ── Real-time subscription ────────────────────────────────────────────────
  useEffect(() => {
    const ACTIVE_SALON_ID = 'aa567339-4580-43ff-abb1-87b02359834e';
    const channel = supabase
      .channel(`feed:${ACTIVE_SALON_ID}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bookings',
        filter: `salon_id=eq.${ACTIVE_SALON_ID}`,
      }, (payload) => {
        setFeed(prev => {
          const exists = prev.some(item => item.id === payload.new.id);
          if (exists) return prev;
          return [{ ...(payload.new as Booking), type: 'booking' }, ...prev];
        });
        setStats(prev => ({ ...prev, today: prev.today + 1, revenue: (prev.today + 1) * 65 }));
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'missed_calls',
        filter: `salon_id=eq.${ACTIVE_SALON_ID}`,
      }, (payload) => {
        setFeed(prev => {
          const exists = prev.some(item => item.id === payload.new.id);
          if (exists) return prev;
          return [{ ...(payload.new as MissedCall), type: 'missed' }, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Confirm booking ───────────────────────────────────────────────────────
  const handleConfirm = useCallback(async (id: string) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    setFeed(prev => prev.map(item =>
      item.type === 'booking' && item.id === id
        ? { ...item, status: 'confirmed' as const }
        : item
    ));
  }, []);

  // ── Pull to refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, [fetchFeed]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: C.accent }]}>LUXE NAIL STUDIO</Text>
            <Text style={[s.serifTitle, { color: C.ink }]}>Hôm nay</Text>
            <Text style={[s.viSub, { color: C.sec }]}>Today's bookings · Lịch hẹn hôm nay</Text>
          </View>
          <View style={[s.langPill, { backgroundColor: C.bg3 }]}>
            <Text style={[s.langText, { color: C.accent }]}>VI · EN</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { val: String(stats.today),   label: 'Lịch hẹn', vi: 'Bookings'  },
          { val: String(stats.week),    label: 'Tuần này',  vi: 'This week' },
          { val: `$${(stats.revenue/1000).toFixed(1)}k`, label: 'Doanh thu', vi: 'Revenue' },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: C.bg3 }]}>
            <Text style={[s.statVal,   { color: C.ink }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: C.sec }]}>{st.label}</Text>
            <Text style={[s.statVi,    { color: C.mut }]}>{st.vi}</Text>
          </View>
        ))}
      </View>

      {/* Feed header */}
      <View style={s.feedHeader}>
        <View>
          <Text style={[s.feedTitle, { color: C.accent }]}>LỊCH ĐẶT HẸN</Text>
          <Text style={[s.feedVi,    { color: C.sec   }]}>Booking activity</Text>
        </View>
        <View style={s.liveBadge}>
          <View style={[s.liveDot, { backgroundColor: C.green }]} />
          <Text style={[s.liveText, { color: C.green }]}>Trực tiếp</Text>
        </View>
      </View>

      {/* Feed list */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={[s.loadingText, { color: C.mut }]}>Đang tải... Loading</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.accent}
            />
          }
        >
          {feed.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyTitle, { color: C.sec }]}>Chưa có lịch hẹn hôm nay</Text>
              <Text style={[s.emptySub,   { color: C.mut }]}>Jade đang trực 24/7 cho bạn</Text>
            </View>
          ) : (
            feed.map((item) =>
              item.type === 'booking'
                ? <BookingCard key={item.id} item={item as Booking} C={C} onConfirm={handleConfirm} />
                : <MissedCard  key={item.id} item={item as MissedCall} C={C} />
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header:    { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow:   { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  serifTitle:{ fontSize: 36, fontWeight: '300', letterSpacing: -0.8, lineHeight: 42 },
  viSub:     { fontSize: 13, marginTop: 2 },
  langPill:  { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  langText:  { fontSize: 12, fontWeight: '600' },
  statsRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  statCard:  { flex: 1, borderRadius: 14, padding: 10 },
  statVal:   { fontSize: 24, fontWeight: '400', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statVi:    { fontSize: 10, marginTop: 1 },
  feedHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  feedTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  feedVi:    { fontSize: 11, marginTop: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:   { width: 6, height: 6, borderRadius: 3 },
  liveText:  { fontSize: 12, fontWeight: '600' },
  card:      { borderRadius: 18, padding: 16, borderWidth: 0.5, marginBottom: 10 },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 11 },
  cardLeft:  { flexDirection: 'row', gap: 11, flex: 1 },
  avi:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  aviText:   { fontSize: 14, fontWeight: '600' },
  clientName:{ fontSize: 17, fontWeight: '600' },
  clientSub: { fontSize: 13, marginTop: 2 },
  relTime:   { fontSize: 13 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  pill:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  pillText:  { fontSize: 11, fontWeight: '600' },
  timeText:  { fontSize: 13 },
  actions:   { flexDirection: 'row', gap: 7 },
  btn:       { flex: 1, borderRadius: 11, paddingVertical: 12, alignItems: 'center' },
  btnSm:     { borderRadius: 11, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  btnText:   { fontSize: 15, fontWeight: '600' },
  btnVi:     { fontSize: 11, marginTop: 2 },
  smsRow:    { flexDirection: 'row', alignItems: 'center' },
  smsText:   { fontSize: 13, fontWeight: '600' },
  snippet:   { borderLeftWidth: 2, paddingLeft: 10, marginBottom: 11 },
  snippetText:{ fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  loadingWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText:{ fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:{ fontSize: 16, fontWeight: '600' },
  emptySub:  { fontSize: 13 },
});