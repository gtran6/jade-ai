// app/(tabs)/settings.tsx — Jade AI Settings Screen
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';

const C = {
  bg: '#F9F4EF', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  togOn: '#3D2B2B', togOff: '#D4BFB0',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[s.togTrack, { backgroundColor: value ? C.togOn : C.togOff }]}
    >
      <View style={[s.togThumb, { transform: [{ translateX: value ? 14 : 0 }] }]} />
    </TouchableOpacity>
  );
}

function Row({ label, value, isToggle, togValue, onToggle, danger }: {
  label: string; value?: string;
  isToggle?: boolean; togValue?: boolean; onToggle?: () => void;
  danger?: boolean;
}) {
  return (
    <View style={[s.row, { backgroundColor: C.card, borderColor: C.border }]}>
      <Text style={[s.rowLabel, { color: danger ? C.red : C.ink }]}>{label}</Text>
      {isToggle
        ? <Toggle value={togValue!} onToggle={onToggle!} />
        : value
          ? <Text style={[s.rowVal, { color: value === 'Connected' || value === 'Đã kết nối' ? C.green : C.sec }]}>{value}</Text>
          : null
      }
    </View>
  );
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

export default function SettingsScreen() {
  const { lang, setLang } = useJadeTheme();
  const vi = lang === 'vi';

  const [notifNew,    setNotifNew]    = useState(true);
  const [notifMissed, setNotifMissed] = useState(true);
  const [notifSms,    setNotifSms]    = useState(true);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: C.accent }]}>
            {vi ? 'TÀI KHOẢN CỦA TÔI' : 'MY ACCOUNT'}
          </Text>
          <Text style={[s.title, { color: C.ink }]}>{vi ? 'Cài đặt' : 'Settings'}</Text>
        </View>
        <LangToggle lang={lang} setLang={setLang} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}>

        {/* Salon */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>
          {vi ? 'TIỆM NAIL' : 'SALON'}
        </Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label={vi ? 'Tên tiệm' : 'Salon name'}   value="Luxe Nail Studio"  />
          <Row label={vi ? 'Số Jade'  : 'Jade number'}   value="+1 (512) 555-0181" />
          <Row label="Google Calendar"                    value={vi ? 'Đã kết nối' : 'Connected'} />
        </View>

        {/* Notifications */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>
          {vi ? 'THÔNG BÁO' : 'NOTIFICATIONS'}
        </Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label={vi ? 'Lịch mới'  : 'New bookings'} isToggle togValue={notifNew}    onToggle={() => setNotifNew(v => !v)} />
          <Row label={vi ? 'Lỡ lịch'   : 'Missed calls'} isToggle togValue={notifMissed} onToggle={() => setNotifMissed(v => !v)} />
          <Row label={vi ? 'SMS khách' : 'Client SMS'}    isToggle togValue={notifSms}    onToggle={() => setNotifSms(v => !v)} />
        </View>

        {/* Account */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>
          {vi ? 'TÀI KHOẢN' : 'ACCOUNT'}
        </Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label={vi ? 'Gói dịch vụ' : 'Plan'} value="Pro · $400/tháng" />
          <Row label={vi ? 'Đăng xuất'   : 'Sign out'} danger />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow:    { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:      { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  langWrap:   { flexDirection: 'row', backgroundColor: '#EDE3D8', borderRadius: 100, padding: 3, gap: 2, marginTop: 4 },
  langBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  langTxt:    { fontSize: 12, fontWeight: '700' },
  sectionHdr: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 18, marginBottom: 6, paddingHorizontal: 4 },
  group:      { borderRadius: 16, overflow: 'hidden', borderWidth: 0.5 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 0.5 },
  rowLabel:   { fontSize: 15, fontWeight: '500', flex: 1 },
  rowVal:     { fontSize: 14, fontWeight: '500' },
  togTrack:   { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  togThumb:   { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
});