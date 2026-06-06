// app/(tabs)/index.tsx — Jade AI Feed Screen
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';
import { Booking, FeedItem, MissedCall, supabase } from '../../lib/supabase';

const C = {
  bg: '#F9F4EF', bg3: '#EDE3D8',
  card: '#FFFFFF', cardMiss: '#FFF3EE',
  ink: '#3D2B2B', sec: '#8A6A58', mut: '#B09080', faint: '#D4BFB0',
  border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  pillNew: '#EAF4EA', pillNewT: '#2A6A28',
  pillConf: '#E8E0F0', pillConfT: '#4A2A6A',
  pillMiss: '#FDE8E4', pillMissT: '#BC5A48',
  aviBg: '#EDE3D8', aviT: '#7A5A48',
  aviMiss: '#F5DDD5', aviMissT: '#8A3A2A',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

const SALON = 'aa567339-4580-43ff-abb1-87b02359834e';

function dedup(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter(item => seen.has(item.id) ? false : !!seen.add(item.id));
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
}

function relativeTime(iso: string, vi: boolean): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2)  return vi ? 'vừa xong' : 'just now';
  if (mins < 60) return vi ? `${mins} phút trước` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return vi ? `${hrs} giờ trước` : `${hrs}h ago`;
  return vi ? `${Math.floor(hrs / 24)} ngày trước` : `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1} · ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
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

function BookingCard({ item, vi, onConfirm }: {
  item: Booking; vi: boolean; onConfirm: (id: string) => void;
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
            <Text style={[s.clientName, { color: C.ink }]}>{item.client_name ?? '—'}</Text>
            <Text style={[s.clientSub,  { color: C.sec }]}>
              {item.service ?? '—'}{item.technician_name ? ` · ${item.technician_name}` : ''}
            </Text>
          </View>
        </View>
        <Text style={[s.relTime, { color: C.mut }]}>{relativeTime(item.created_at, vi)}</Text>
      </View>

      <View style={s.metaRow}>
        <View style={[s.pill, { backgroundColor: isNew ? C.pillNew : C.pillConf }]}>
          <Text style={[s.pillText, { color: isNew ? C.pillNewT : C.pillConfT }]}>
            {isNew ? (vi ? 'Mới' : 'New') : (vi ? 'Đã xác nhận' : 'Confirmed')}
          </Text>
        </View>
        <Text style={[s.timeText, { color: C.sec }]}>📅 {formatTime(item.start_time)}</Text>
      </View>

      {isNew ? (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, { flex: 2, backgroundColor: C.ink }]}
            activeOpacity={0.8}
            onPress={() => onConfirm(item.id)}
          >
            <Text style={[s.btnText, { color: '#F9F4EF' }]}>{vi ? 'Xác nhận' : 'Confirm'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 2, backgroundColor: C.bg3 }]} activeOpacity={0.8}>
            <Text style={[s.btnText, { color: C.sec }]}>{vi ? 'Đổi lịch' : 'Reschedule'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.bg3 }]} activeOpacity={0.8}>
            <Text style={[s.btnText, { color: C.sec }]}>✆</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.smsRow}>
          <Text style={[s.smsText, { color: C.green }]}>
            ✓ {vi ? 'Đã gửi SMS' : 'SMS sent'}
          </Text>
        </View>
      )}
    </View>
  );
}

function MissedCard({ item, vi }: { item: MissedCall; vi: boolean }) {
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
            <Text style={[s.clientName, { color: C.red }]}>
              {vi ? 'Lỡ lịch hẹn' : 'Missed call'}
            </Text>
            <Text style={[s.clientSub, { color: C.aviMissT }]}>{item.caller_phone ?? '—'}</Text>
          </View>
        </View>
        <Text style={[s.relTime, { color: C.mut }]}>{relativeTime(item.created_at, vi)}</Text>
      </View>

      <View style={s.metaRow}>
        <View style={[s.pill, { backgroundColor: C.pillMiss }]}>
          <Text style={[s.pillText, { color: C.pillMissT }]}>{vi ? 'Lỡ' : 'Missed'}</Text>
        </View>
      </View>

      {!!snippet && (
        <View style={[s.snippet, { borderLeftColor: C.faint }]}>
          <Text style={[s.snippetText, { color: C.mut }]}>{snippet}</Text>
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.ink }]} activeOpacity={0.8}>
          <Text style={[s.btnText, { color: '#F9F4EF' }]}>{vi ? 'Gọi lại' : 'Call back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.bg3 }]} activeOpacity={0.8}>
          <Text style={[s.btnText, { color: C.sec }]}>{vi ? 'Bỏ qua' : 'Dismiss'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { lang, setLang } = useJadeTheme();
  const vi = lang === 'vi';

  const [feed,       setFeed]       = useState<FeedItem[]>([]);
  const [stats,      setStats]      = useState({ today: 0, week: 0, revenue: 0 });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const now       = new Date();
    const todayStart = startOfDay(now).toISOString();
    const weekStart  = startOfWeek(now).toISOString();

    const [feedBookings, missedRes, todayRes, weekRes, servicesRes] = await Promise.all([
      // Feed: recent bookings for the activity list
      supabase.from('bookings').select('*').eq('salon_id', SALON)
        .order('created_at', { ascending: false }).limit(20),

      // Missed calls for activity list
      supabase.from('missed_calls').select('*').eq('salon_id', SALON)
        .order('created_at', { ascending: false }).limit(20),

      // Today's bookings count (by start_time)
      supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('salon_id', SALON)
        .neq('status', 'cancelled')
        .gte('start_time', todayStart),

      // This week's bookings (by start_time) with service name for revenue
      supabase.from('bookings').select('id, service')
        .eq('salon_id', SALON)
        .neq('status', 'cancelled')
        .gte('start_time', weekStart),

      // Services for price lookup
      supabase.from('services').select('name, price').eq('salon_id', SALON),
    ]);

    // Build service price map (case-insensitive)
    const priceMap = new Map<string, number>();
    for (const svc of servicesRes.data ?? []) {
      priceMap.set(svc.name.toLowerCase().trim(), Number(svc.price));
    }

    // Estimate revenue: match booking service name to service price
    // Fall back to $0 if no match found
    const FALLBACK_PRICE = 0;
    const weekBookings = weekRes.data ?? [];
    const revenue = weekBookings.reduce((sum: number, b: { service: string | null }) => {
      const price = b.service
        ? (priceMap.get(b.service.toLowerCase().trim()) ?? FALLBACK_PRICE)
        : FALLBACK_PRICE;
      return sum + price;
    }, 0);

    const bookings: FeedItem[] = (feedBookings.data ?? []).map(
      (b: Booking) => ({ ...b, type: 'booking' as const })
    );
    const missed: FeedItem[] = (missedRes.data ?? []).map(
      (m: MissedCall) => ({ ...m, type: 'missed' as const })
    );

    const merged = dedup(
      [...bookings, ...missed].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );

    setFeed(merged);
    setStats({
      today:   todayRes.count ?? 0,
      week:    weekBookings.length,
      revenue,
    });
  }, []);

  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  useEffect(() => {
    const subscribedAt = new Date().toISOString();
    const channel = supabase.channel(`feed:${SALON}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bookings',
        filter: `salon_id=eq.${SALON}`,
      }, (payload) => {
        if (payload.new.created_at < subscribedAt) return;
        setFeed(prev => dedup([{ ...(payload.new as Booking), type: 'booking' }, ...prev]));
        // Refetch stats on new booking so counts + revenue stay accurate
        fetchFeed();
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'missed_calls',
        filter: `salon_id=eq.${SALON}`,
      }, (payload) => {
        if (payload.new.created_at < subscribedAt) return;
        setFeed(prev => dedup([{ ...(payload.new as MissedCall), type: 'missed' }, ...prev]));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

  const handleConfirm = useCallback(async (id: string) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    setFeed(prev => prev.map(item =>
      item.type === 'booking' && item.id === id
        ? { ...item, status: 'confirmed' as const }
        : item
    ));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, [fetchFeed]);

  const today = new Date();
  const dateStr = vi
    ? `Thứ ${['Chủ nhật','Hai','Ba','Tư','Năm','Sáu','Bảy'][today.getDay()]}, ${today.getDate()} tháng ${today.getMonth()+1}`
    : today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const revenueStr = stats.revenue >= 1000
    ? `$${(stats.revenue / 1000).toFixed(1)}k`
    : `$${stats.revenue}`;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: C.accent }]}>LUXE NAIL STUDIO</Text>
            <Text style={[s.title,   { color: C.ink }]}>{vi ? 'Hôm nay' : 'Today'}</Text>
            <Text style={[s.sub,     { color: C.sec }]}>{dateStr}</Text>
          </View>
          <LangToggle lang={lang} setLang={setLang} />
        </View>
      </View>

      <View style={s.statsRow}>
        {[
          { val: String(stats.today), label: vi ? 'Hôm nay'  : 'Today'     },
          { val: String(stats.week),  label: vi ? 'Tuần này'  : 'This week' },
          { val: revenueStr,          label: vi ? 'Doanh thu' : 'Revenue'   },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: C.bg3 }]}>
            <Text style={[s.statVal,   { color: C.ink }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: C.sec }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.feedHeader}>
        <Text style={[s.feedTitle, { color: C.accent }]}>
          {vi ? 'LỊCH ĐẶT HẸN' : 'BOOKING ACTIVITY'}
        </Text>
        <View style={s.liveBadge}>
          <View style={[s.liveDot, { backgroundColor: C.green }]} />
          <Text style={[s.liveText, { color: C.green }]}>{vi ? 'Trực tiếp' : 'Live'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={[s.loadingText, { color: C.mut }]}>{vi ? 'Đang tải...' : 'Loading...'}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
          }
        >
          {feed.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyTitle, { color: C.sec }]}>
                {vi ? 'Chưa có lịch hẹn hôm nay' : 'No bookings today'}
              </Text>
              <Text style={[s.emptySub, { color: C.mut }]}>
                {vi ? 'Jade đang trực 24/7 cho bạn' : 'Jade is on 24/7 for you'}
              </Text>
            </View>
          ) : (
            feed.map(item =>
              item.type === 'booking'
                ? <BookingCard key={item.id} item={item as Booking} vi={vi} onConfirm={handleConfirm} />
                : <MissedCard  key={item.id} item={item as MissedCall} vi={vi} />
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow:    { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:      { fontSize: 36, fontWeight: '300', letterSpacing: -0.8, lineHeight: 42 },
  sub:        { fontSize: 13, marginTop: 2 },
  langWrap:   { flexDirection: 'row', backgroundColor: '#EDE3D8', borderRadius: 100, padding: 3, gap: 2, marginTop: 4 },
  langBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  langTxt:    { fontSize: 12, fontWeight: '700' },
  statsRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  statCard:   { flex: 1, borderRadius: 14, padding: 10 },
  statVal:    { fontSize: 24, fontWeight: '400', letterSpacing: -0.3 },
  statLabel:  { fontSize: 11, fontWeight: '600', marginTop: 2 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  feedTitle:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  liveBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:    { width: 6, height: 6, borderRadius: 3 },
  liveText:   { fontSize: 12, fontWeight: '600' },
  card:       { borderRadius: 18, padding: 16, borderWidth: 0.5, marginBottom: 10 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 11 },
  cardLeft:   { flexDirection: 'row', gap: 11, flex: 1 },
  avi:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  aviText:    { fontSize: 14, fontWeight: '600' },
  clientName: { fontSize: 17, fontWeight: '600' },
  clientSub:  { fontSize: 13, marginTop: 2 },
  relTime:    { fontSize: 13 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  pill:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  pillText:   { fontSize: 11, fontWeight: '600' },
  timeText:   { fontSize: 13 },
  actions:    { flexDirection: 'row', gap: 7 },
  btn:        { borderRadius: 11, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnText:    { fontSize: 15, fontWeight: '600' },
  smsRow:     { flexDirection: 'row', alignItems: 'center' },
  smsText:    { fontSize: 13, fontWeight: '600' },
  snippet:    { borderLeftWidth: 2, paddingLeft: 10, marginBottom: 11 },
  snippetText:{ fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  loadingWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText:{ fontSize: 14 },
  emptyWrap:  { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub:   { fontSize: 13 },
});