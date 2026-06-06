// app/(tabs)/settings.tsx — Jade AI Settings Screen
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme, type ThemeMode } from '@/lib/ThemeContext';

const L = {
  bg: '#F9F4EF', bg2: '#F2EAE0', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  togOn: '#C4957A', togOff: '#D4BFB0',
};
const D = {
  bg: '#140E0A', bg2: '#1E1410', bg3: '#2A1E16',
  card: '#1E1410', ink: '#E8D4C0', sec: '#9A7A68',
  mut: '#5A3E30', faint: '#3A2A20', border: 'rgba(200,160,120,0.12)',
  accent: '#C4957A', green: '#6A9A68', red: '#C06858',
  togOn: '#C4957A', togOff: '#3A2A20',
};

function Toggle({ value, onToggle, C }: { value: boolean; onToggle: () => void; C: typeof L }) {
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

function Row({ label, vi, value, C, isToggle, togValue, onToggle, danger }: any) {
  return (
    <View style={[s.row, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={s.rowLeft}>
        <Text style={[s.rowLabel, { color: danger ? C.red : C.ink }]}>{label}</Text>
        {vi && <Text style={[s.rowVi, { color: C.mut }]}>{vi}</Text>}
      </View>
      {isToggle
        ? <Toggle value={togValue} onToggle={onToggle} C={C} />
        : <Text style={[s.rowVal, { color: value === 'Đã kết nối' ? C.green : C.sec }]}>{value}</Text>
      }
    </View>
  );
}

function ThemeSelector({ value, onChange, C }: {
  value: ThemeMode; onChange: (m: ThemeMode) => void; C: typeof L;
}) {
  const options: { key: ThemeMode; vi: string; en: string }[] = [
    { key: 'light',  vi: 'Sáng',     en: 'Light'  },
    { key: 'dark',   vi: 'Tối',      en: 'Dark'   },
    { key: 'system', vi: 'Hệ thống', en: 'System' },
  ];
  return (
    <View style={[ts.wrap, { backgroundColor: C.bg3 }]}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[ts.pill, active && { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[ts.vi, { color: active ? C.ink  : C.mut   }]}>{opt.vi}</Text>
            <Text style={[ts.en, { color: active ? C.sec  : C.faint }]}>{opt.en}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ts = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 3 },
  pill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, borderWidth: 0.5, borderColor: 'transparent' },
  vi:   { fontSize: 13, fontWeight: '600' },
  en:   { fontSize: 11, marginTop: 1 },
});

export default function SettingsScreen() {
  const { scheme, themeMode, setThemeMode } = useJadeTheme();
  const C = scheme === 'dark' ? D : L;

  const [notifNew,    setNotifNew]    = useState(true);
  const [notifMissed, setNotifMissed] = useState(true);
  const [notifSms,    setNotifSms]    = useState(true);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      <View style={s.header}>
        <Text style={[s.eyebrow, { color: C.accent }]}>TÀI KHOẢN CỦA TÔI</Text>
        <Text style={[s.title,   { color: C.ink   }]}>Cài đặt</Text>
        <Text style={[s.viSub,   { color: C.sec   }]}>Settings · Thiết lập</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}>

        {/* Salon */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>Tiệm nail · Salon</Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label="Tên tiệm · Salon name"  value="Luxe Nail Studio"  C={C} />
          <Row label="Số Jade · Jade number"   value="+1 (512) 555-0181" C={C} />
          <Row label="Google Calendar"         value="Đã kết nối"        C={C} />
        </View>

        {/* Notifications */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>Thông báo · Notifications</Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label="Lịch mới · New bookings"  isToggle togValue={notifNew}    onToggle={() => setNotifNew(v => !v)}    C={C} />
          <Row label="Lỡ lịch · Missed calls"   isToggle togValue={notifMissed} onToggle={() => setNotifMissed(v => !v)} C={C} />
          <Row label="SMS khách · Client SMS"    isToggle togValue={notifSms}    onToggle={() => setNotifSms(v => !v)}    C={C} />
        </View>

        {/* Hours */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>Giờ làm việc · Hours</Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label="Giờ mở · Open"    value="9:00 SA"  C={C} />
          <Row label="Giờ đóng · Close" value="7:00 CH"  C={C} />
          <Row label="Ngày nghỉ · Off"  value="Chủ nhật" C={C} />
        </View>

        {/* Appearance */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>Giao diện · Appearance</Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label="Hiển thị · Display" vi="Giao diện app" value="Tiếng Việt" C={C} />
          <View style={[s.row, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.rowLeft}>
              <Text style={[s.rowLabel, { color: C.ink }]}>Giao diện · Theme</Text>
              <Text style={[s.rowVi,    { color: C.mut }]}>Sáng / Tối / Hệ thống</Text>
            </View>
          </View>
          <View style={{ backgroundColor: C.card, paddingHorizontal: 14, paddingBottom: 12 }}>
            <ThemeSelector value={themeMode} onChange={setThemeMode} C={C} />
          </View>
        </View>

        {/* Account */}
        <Text style={[s.sectionHdr, { color: C.accent }]}>Tài khoản · Account</Text>
        <View style={[s.group, { borderColor: C.border }]}>
          <Row label="Gói dịch vụ · Plan"  value="Pro · $400/tháng" C={C} />
          <Row label="Đăng xuất · Sign out" danger C={C} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:   { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  viSub:   { fontSize: 14, marginTop: 2 },

  sectionHdr: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 18, marginBottom: 6, paddingHorizontal: 4 },

  group: { borderRadius: 16, overflow: 'hidden', borderWidth: 0.5 },
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 0.5 },

  rowLeft:  { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowVi:    { fontSize: 12, marginTop: 1 },
  rowVal:   { fontSize: 14, fontWeight: '500' },

  togTrack: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  togThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
});