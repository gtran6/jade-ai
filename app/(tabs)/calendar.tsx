// app/(tabs)/calendar.tsx — Jade AI Calendar Screen
import { useJadeTheme } from '@/lib/ThemeContext';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const L = {
  bg: '#F9F4EF', bg2: '#F2EAE0', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', green: '#7AAA78', red: '#BC5A48',
  todayBg: '#3D2B2B', todayText: '#FFFFFF',
  dotColor: '#C4957A',
  slotFree: '#FFFFFF', slotFreeBorder: 'rgba(61,43,43,0.10)',
  slotPend: '#EAF2EA', slotPendBorder: 'rgba(122,170,120,0.25)', slotPendText: '#3A6A3A',
  slotBusy: '#FFF0EE', slotBusyBorder: 'rgba(188,90,72,0.20)', slotBusyText: '#8A3A2A',
};
const D = {
  bg: '#140E0A', bg2: '#1E1410', bg3: '#2A1E16',
  card: '#1E1410', ink: '#E8D4C0', sec: '#9A7A68',
  mut: '#5A3E30', faint: '#3A2A20', border: 'rgba(200,160,120,0.12)',
  accent: '#C4957A', green: '#6A9A68', red: '#C06858',
  todayBg: '#C4957A', todayText: '#1A0E08',
  dotColor: '#C4957A',
  slotFree: '#1E1410', slotFreeBorder: 'rgba(200,160,120,0.12)',
  slotPend: '#0E1A0E', slotPendBorder: 'rgba(106,154,104,0.25)', slotPendText: '#6A9A68',
  slotBusy: '#1E1008', slotBusyBorder: 'rgba(192,104,88,0.20)', slotBusyText: '#C06858',
};

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

// Days that have bookings (for dot markers)
const BOOKED_DAYS = new Set([3, 5, 9, 10, 11, 13, 16, 18, 20]);

// Sample appointments for the selected day
const SLOTS: Record<number, { time: string; name: string; service: string; tech: string; type: 'free' | 'booked' | 'pending' | 'busy' }[]> = {
  10: [
    { time: '10:00', name: '',              service: '',                    tech: '',      type: 'free'    },
    { time: '11:00', name: 'Jessica Kim',   service: 'Full set acrylic · 75 phút', tech: 'Lisa',  type: 'booked'  },
    { time: '13:00', name: '',              service: '',                    tech: '',      type: 'free'    },
    { time: '14:00', name: 'Maria Rodriguez', service: 'Gel manicure · 45 phút', tech: 'Lisa', type: 'pending' },
    { time: '16:00', name: 'Riêng tư',      service: 'Nha sĩ · 1 giờ',     tech: '',      type: 'busy'    },
    { time: '18:00', name: '',              service: '',                    tech: '',      type: 'free'    },
  ],
};

export default function CalendarScreen() {
  const { scheme } = useJadeTheme();
  const C = scheme === 'dark' ? D : L;

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [currentMonth] = useState(today.getMonth());
  const [currentYear] = useState(today.getFullYear());

  // Build calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const slots = SLOTS[selectedDay] ?? [
    { time: '10:00', name: '', service: '', tech: '', type: 'free' as const },
    { time: '12:00', name: '', service: '', tech: '', type: 'free' as const },
    { time: '14:00', name: '', service: '', tech: '', type: 'free' as const },
  ];

  const selectedDate = new Date(currentYear, currentMonth, selectedDay);
  const dayName = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'][selectedDate.getDay()];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.eyebrow, { color: C.accent }]}>LỊCH LÀM VIỆC</Text>
          <Text style={[s.title,   { color: C.ink   }]}>{MONTHS_VI[currentMonth]}, {currentYear}</Text>
          <Text style={[s.viSub,   { color: C.sec   }]}>June {currentYear} · Calendar</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: C.bg3, borderColor: C.border }]}>
          <Text style={[s.addBtnText, { color: C.ink }]}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={s.dayHeaders}>
        {DAYS_VI.map(d => (
          <Text key={d} style={[s.dayHdr, { color: C.mut }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={[s.grid, { borderColor: C.border }]}>
        {calendarCells.map((day, i) => {
          const isToday   = day === today.getDate() && currentMonth === today.getMonth();
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
                      { color: day ? C.ink : 'transparent' },
                      isToday && { color: C.todayText, fontWeight: '700' },
                      !isToday && day < today.getDate() && currentMonth <= today.getMonth() && { color: C.mut },
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasBooking && (
                    <View style={[s.dot, { backgroundColor: isToday ? C.todayText : C.dotColor }]} />
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day detail */}
      <View style={[s.dayLabel, { borderTopColor: C.border }]}>
        <Text style={[s.dayLabelText, { color: C.ink   }]}>{dayName}, {selectedDay} tháng {currentMonth + 1}</Text>
        <Text style={[s.dayLabelVi,   { color: C.sec   }]}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][selectedDate.getDay()]}{' '}
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][currentMonth]} {selectedDay}
        </Text>
      </View>

      {/* Time slots */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {slots.map((slot, i) => (
          <View key={i} style={s.slotRow}>
            <Text style={[s.slotTime, { color: C.mut }]}>{slot.time}</Text>
            {slot.type === 'free' ? (
              <View style={[s.slotEmpty, { borderBottomColor: C.border }]}>
                <View style={[s.slotLine, { backgroundColor: C.border }]} />
              </View>
            ) : (
              <View style={[
                s.slotCard,
                slot.type === 'booked'  && { backgroundColor: C.slotFree,  borderColor: C.slotFreeBorder  },
                slot.type === 'pending' && { backgroundColor: C.slotPend,  borderColor: C.slotPendBorder  },
                slot.type === 'busy'    && { backgroundColor: C.slotBusy,  borderColor: C.slotBusyBorder  },
              ]}>
                <Text style={[
                  s.slotName,
                  slot.type === 'booked'  && { color: C.ink         },
                  slot.type === 'pending' && { color: C.slotPendText },
                  slot.type === 'busy'    && { color: C.slotBusyText },
                ]}>
                  {slot.name}
                </Text>
                <Text style={[
                  s.slotSvc,
                  slot.type === 'booked'  && { color: C.sec         },
                  slot.type === 'pending' && { color: C.slotPendText },
                  slot.type === 'busy'    && { color: C.slotBusyText },
                ]}>
                  {slot.service}{slot.tech ? ` · ${slot.tech}` : ''}
                  {slot.type === 'pending' ? ' · Chờ xác nhận' : ''}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow:  { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:    { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  viSub:    { fontSize: 14, marginTop: 2 },
  addBtn:   { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 0.5, marginTop: 6 },
  addBtnText:{ fontSize: 14, fontWeight: '600' },

  dayHeaders: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 2 },
  dayHdr:     { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 0 },
  cell: { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNum:    { fontSize: 15, fontWeight: '400' },
  dot:       { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  dayLabel:   { paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 0.5, marginTop: 4 },
  dayLabelText:{ fontSize: 16, fontWeight: '600' },
  dayLabelVi: { fontSize: 13, marginTop: 2 },

  slotRow:   { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 6 },
  slotTime:  { fontSize: 13, width: 42, paddingTop: 8, textAlign: 'right', flexShrink: 0 },
  slotEmpty: { flex: 1, justifyContent: 'center', borderBottomWidth: 0.5, paddingVertical: 12 },
  slotLine:  { height: 0.5 },
  slotCard:  { flex: 1, borderRadius: 12, padding: 11, borderWidth: 0.5 },
  slotName:  { fontSize: 15, fontWeight: '600' },
  slotSvc:   { fontSize: 13, marginTop: 2 },
});