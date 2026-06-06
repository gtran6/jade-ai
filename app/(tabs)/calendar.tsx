// app/(tabs)/calendar.tsx — Jade AI Calendar Screen
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';

const C = {
  bg: '#F9F4EF', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  todayBg: '#3D2B2B', todayText: '#FFFFFF',
  dotConf: '#7AAA78', dotPend: '#C4957A',
  slotBg: '#FFFFFF', slotPend: '#FFF8F4', slotPendDot: '#C4957A',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

const DAYS_VI = ['CN','T2','T3','T4','T5','T6','T7'];
const DAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const BOOKED_DAYS = new Set([3, 5, 6, 9, 10, 11, 13, 16, 18, 20]);

const SLOTS: Record<number, { time: string; name: string; service: string; tech: string; status: 'confirmed'|'pending' }[]> = {
  6: [
    { time: '2:00',  name: 'Maria Rodriguez', service: 'Gel manicure',   tech: 'Lisa',  status: 'confirmed' },
    { time: '3:30',  name: 'Tanya Nguyen',    service: 'Dip powder',     tech: 'Maria', status: 'pending'   },
    { time: '4:45',  name: 'Jessica Kim',     service: 'Full set',       tech: 'Lisa',  status: 'confirmed' },
  ],
};

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

export default function CalendarScreen() {
  const { lang, setLang } = useJadeTheme();
  const vi = lang === 'vi';

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [currentMonth] = useState(today.getMonth());
  const [currentYear]  = useState(today.getFullYear());

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells: (number|null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const slots = SLOTS[selectedDay] ?? [];
  const selectedDate = new Date(currentYear, currentMonth, selectedDay);
  const dayNames = vi
    ? ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: C.accent }]}>
            {vi ? `THÁNG ${currentMonth + 1}` : (MONTHS_EN[currentMonth]).toUpperCase()}
          </Text>
          <Text style={[s.title, { color: C.ink }]}>
            {vi ? MONTHS_VI[currentMonth] : 'Calendar'}
          </Text>
        </View>
        <LangToggle lang={lang} setLang={setLang} />
      </View>

      {/* Day headers */}
      <View style={s.dayHeaders}>
        {(vi ? DAYS_VI : DAYS_EN).map(d => (
          <Text key={d} style={[s.dayHdr, { color: C.mut }]}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {cells.map((day, i) => {
          const isToday    = day === today.getDate() && currentMonth === today.getMonth();
          const isSelected = day === selectedDay;
          const hasBooking = day !== null && BOOKED_DAYS.has(day);
          return (
            <TouchableOpacity
              key={i}
              style={s.cell}
              onPress={() => day && setSelectedDay(day)}
              activeOpacity={day ? 0.7 : 1}
            >
              {day && (
                <>
                  <View style={[
                    s.dayCircle,
                    isToday    && { backgroundColor: C.todayBg },
                    isSelected && !isToday && { backgroundColor: C.bg3 },
                  ]}>
                    <Text style={[
                      s.dayNum,
                      { color: C.ink },
                      isToday && { color: C.todayText, fontWeight: '700' },
                      !isToday && day < today.getDate() && { color: C.mut },
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasBooking && (
                    <View style={[s.dot, { backgroundColor: isToday ? C.todayText : C.dotConf }]} />
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day label */}
      <View style={[s.dayLabel, { borderTopColor: C.border }]}>
        <Text style={[s.dayLabelText, { color: C.ink }]}>
          {vi
            ? `${dayNames[selectedDate.getDay()]}, ${selectedDay} tháng ${currentMonth + 1}`
            : `${dayNames[selectedDate.getDay()]}, ${MONTHS_EN[currentMonth]} ${selectedDay}`
          }
        </Text>
      </View>

      {/* Slots */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {slots.length === 0 ? (
          <Text style={[s.emptySlot, { color: C.mut }]}>
            {vi ? 'Không có lịch hẹn' : 'No appointments'}
          </Text>
        ) : (
          slots.map((slot, i) => (
            <View key={i} style={[s.slotCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={s.slotLeft}>
                <Text style={[s.slotTime, { color: C.mut }]}>{slot.time}</Text>
              </View>
              <View style={s.slotMid}>
                <Text style={[s.slotName, { color: C.ink }]}>{slot.name}</Text>
                <Text style={[s.slotSvc,  { color: C.sec }]}>{slot.service} · {slot.tech}</Text>
              </View>
              <View style={[s.slotDot, { backgroundColor: slot.status === 'confirmed' ? C.dotConf : C.dotPend }]} />
            </View>
          ))
        )}
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
  dayHeaders: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 2 },
  dayHdr:     { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 4 },
  cell:       { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  dayCircle:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNum:     { fontSize: 15, fontWeight: '400' },
  dot:        { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  dayLabel:   { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 0.5, marginTop: 4 },
  dayLabelText:{ fontSize: 16, fontWeight: '600' },
  emptySlot:  { textAlign: 'center', marginTop: 40, fontSize: 14 },
  slotCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  slotLeft:   { width: 44 },
  slotTime:   { fontSize: 14, fontWeight: '500' },
  slotMid:    { flex: 1 },
  slotName:   { fontSize: 15, fontWeight: '600' },
  slotSvc:    { fontSize: 13, marginTop: 2 },
  slotDot:    { width: 10, height: 10, borderRadius: 5 },
});