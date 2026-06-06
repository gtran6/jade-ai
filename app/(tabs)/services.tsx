// app/(tabs)/services.tsx — Jade AI Services Screen
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    RefreshControl, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJadeTheme } from '@/lib/ThemeContext';
import { supabase } from '../../lib/supabase';

const C = {
  bg: '#F9F4EF', bg2: '#F2EAE0', bg3: '#EDE3D8',
  card: '#FFFFFF', ink: '#3D2B2B', sec: '#8A6A58',
  mut: '#B09080', faint: '#D4BFB0', border: 'rgba(61,43,43,0.10)',
  accent: '#C4957A', red: '#BC5A48',
  langActive: '#3D2B2B', langActiveT: '#F9F4EF',
  langIdle: 'transparent', langIdleT: '#B09080',
};

const SALON = 'aa567339-4580-43ff-abb1-87b02359834e';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface FormState {
  name: string;
  duration: string;
  price: string;
}

const EMPTY_FORM: FormState = { name: '', duration: '', price: '' };

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

function ServiceCard({ service, vi, onEdit, onDelete }: {
  service: Service; vi: boolean;
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
}) {
  const handleDelete = () => {
    Alert.alert(
      vi ? 'Xoá dịch vụ?' : 'Delete service?',
      service.name,
      [
        { text: vi ? 'Huỷ' : 'Cancel', style: 'cancel' },
        { text: vi ? 'Xoá' : 'Delete', style: 'destructive', onPress: () => onDelete(service.id) },
      ]
    );
  };

  return (
    <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={[s.cardIcon, { backgroundColor: C.bg3 }]}>
        <Text style={s.cardIconText}>✦</Text>
      </View>
      <View style={s.cardMid}>
        <Text style={[s.cardName, { color: C.ink }]}>{service.name}</Text>
        <Text style={[s.cardDur,  { color: C.sec }]}>
          {service.duration_minutes} {vi ? 'phút' : 'min'}
        </Text>
      </View>
      <View style={s.cardRight}>
        <Text style={[s.cardPrice, { color: C.ink }]}>${service.price}</Text>
        <View style={s.cardActions}>
          <TouchableOpacity onPress={() => onEdit(service)} activeOpacity={0.7}>
            <Text style={[s.cardActionText, { color: C.accent }]}>{vi ? 'Sửa' : 'Edit'}</Text>
          </TouchableOpacity>
          <Text style={[s.cardActionText, { color: C.faint }]}> · </Text>
          <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
            <Text style={[s.cardActionText, { color: C.red }]}>{vi ? 'Xoá' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ServicesScreen() {
  const { lang, setLang } = useJadeTheme();
  const vi = lang === 'vi';

  const [services,   setServices]   = useState<Service[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<Partial<FormState>>({});

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', SALON)
      .order('name', { ascending: true });

    if (error) { console.error('Services fetch error:', error.message); return; }
    setServices(data ?? []);
  }, []);

  useEffect(() => {
    fetchServices().finally(() => setLoading(false));
  }, [fetchServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name:     service.name,
      duration: String(service.duration_minutes),
      price:    String(service.price),
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim())              e.name     = vi ? 'Bắt buộc' : 'Required';
    if (!form.duration || isNaN(Number(form.duration)) || Number(form.duration) <= 0)
                                        e.duration = vi ? 'Không hợp lệ' : 'Invalid';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
                                        e.price    = vi ? 'Không hợp lệ' : 'Invalid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      salon_id:         SALON,
      name:             form.name.trim(),
      duration_minutes: Number(form.duration),
      price:            Number(form.price),
    };

    if (editingId) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingId);
      if (error) { console.error('Update error:', error.message); setSaving(false); return; }
      setServices(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
    } else {
      const { data, error } = await supabase.from('services').insert(payload).select().single();
      if (error) { console.error('Insert error:', error.message); setSaving(false); return; }
      setServices(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { console.error('Delete error:', error.message); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: C.accent }]}>
              {vi ? 'DỊCH VỤ' : 'SERVICES'}
            </Text>
            <Text style={[s.title, { color: C.ink }]}>{vi ? 'Dịch vụ' : 'Services'}</Text>
          </View>
          <View style={s.headerRight}>
            <LangToggle lang={lang} setLang={setLang} />
            {!showForm && (
              <TouchableOpacity style={[s.addBtn, { backgroundColor: C.ink }]} onPress={openAdd} activeOpacity={0.8}>
                <Text style={[s.addBtnText, { color: C.bg }]}>+ {vi ? 'Thêm' : 'Add'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Add / Edit form */}
        {showForm && (
          <View style={[s.form, { backgroundColor: C.bg2, borderColor: C.border }]}>
            <Text style={[s.formTitle, { color: C.accent }]}>
              {editingId
                ? (vi ? 'SỬA DỊCH VỤ' : 'EDIT SERVICE')
                : (vi ? 'THÊM DỊCH VỤ' : 'ADD SERVICE')
              }
            </Text>

            {/* Name */}
            <TextInput
              style={[s.input, { backgroundColor: C.card, borderColor: errors.name ? C.red : C.border, color: C.ink }]}
              placeholder={vi ? 'Tên dịch vụ' : 'Service name'}
              placeholderTextColor={C.mut}
              value={form.name}
              onChangeText={t => setForm(f => ({ ...f, name: t }))}
            />
            {errors.name && <Text style={[s.errText, { color: C.red }]}>{errors.name}</Text>}

            <View style={s.formRow}>
              {/* Duration */}
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[s.input, { backgroundColor: C.card, borderColor: errors.duration ? C.red : C.border, color: C.ink }]}
                  placeholder={vi ? 'Thời gian (phút)' : 'Duration (min)'}
                  placeholderTextColor={C.mut}
                  keyboardType="numeric"
                  value={form.duration}
                  onChangeText={t => setForm(f => ({ ...f, duration: t }))}
                />
                {errors.duration && <Text style={[s.errText, { color: C.red }]}>{errors.duration}</Text>}
              </View>

              <View style={{ width: 8 }} />

              {/* Price */}
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[s.input, { backgroundColor: C.card, borderColor: errors.price ? C.red : C.border, color: C.ink }]}
                  placeholder={vi ? 'Giá ($)' : 'Price ($)'}
                  placeholderTextColor={C.mut}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={t => setForm(f => ({ ...f, price: t }))}
                />
                {errors.price && <Text style={[s.errText, { color: C.red }]}>{errors.price}</Text>}
              </View>
            </View>

            <View style={s.formRow}>
              <TouchableOpacity style={[s.btnSave, { backgroundColor: C.ink }]} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
                <Text style={[s.btnSaveText, { color: C.bg }]}>
                  {saving ? '...' : (vi ? 'Lưu' : 'Save')}
                </Text>
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity style={[s.btnCancel, { backgroundColor: C.bg3 }]} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={[s.btnCancelText, { color: C.sec }]}>{vi ? 'Huỷ' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
            {services.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={[s.emptyTitle, { color: C.sec }]}>
                  {vi ? 'Chưa có dịch vụ nào' : 'No services yet'}
                </Text>
                <Text style={[s.emptySub, { color: C.mut }]}>
                  {vi ? 'Thêm dịch vụ đầu tiên của bạn' : 'Add your first service'}
                </Text>
              </View>
            ) : (
              services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  vi={vi}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  eyebrow:       { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  title:         { fontSize: 34, fontWeight: '300', letterSpacing: -0.5 },
  headerRight:   { alignItems: 'flex-end', gap: 8 },
  langWrap:      { flexDirection: 'row', backgroundColor: '#EDE3D8', borderRadius: 100, padding: 3, gap: 2 },
  langBtn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  langTxt:       { fontSize: 12, fontWeight: '700' },
  addBtn:        { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText:    { fontSize: 14, fontWeight: '600' },
  form:          { marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 14, borderWidth: 0.5 },
  formTitle:     { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  formRow:       { flexDirection: 'row', marginTop: 8 },
  input:         { borderRadius: 12, padding: 13, borderWidth: 0.5, fontSize: 15 },
  errText:       { fontSize: 12, marginTop: 3 },
  btnSave:       { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnSaveText:   { fontSize: 15, fontWeight: '600' },
  btnCancel:     { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelText: { fontSize: 15, fontWeight: '600' },
  card:          { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, borderWidth: 0.5, marginBottom: 8, gap: 12 },
  cardIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardIconText:  { fontSize: 18, color: '#7A5A48' },
  cardMid:       { flex: 1 },
  cardName:      { fontSize: 16, fontWeight: '600' },
  cardDur:       { fontSize: 13, marginTop: 2 },
  cardRight:     { alignItems: 'flex-end' },
  cardPrice:     { fontSize: 17, fontWeight: '500' },
  cardActions:   { flexDirection: 'row', marginTop: 3 },
  cardActionText:{ fontSize: 12 },
  loadingWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText:   { fontSize: 14 },
  emptyWrap:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle:    { fontSize: 16, fontWeight: '600' },
  emptySub:      { fontSize: 13 },
});