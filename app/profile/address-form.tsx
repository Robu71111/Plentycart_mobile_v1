import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADDRESSES_KEY, type SavedAddress } from './addresses';

const LABELS = ['Home', 'Work', 'Other'] as const;
type Label = (typeof LABELS)[number];

export default function AddressFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [label, setLabel] = useState<Label>('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('United States');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(ADDRESSES_KEY).then((raw) => {
      if (!raw) return;
      const all: SavedAddress[] = JSON.parse(raw);
      const existing = all.find((a) => a.id === id);
      if (existing) {
        setLabel(existing.label);
        setFullName(existing.fullName);
        setPhone(existing.phone);
        setAddress1(existing.address1);
        setAddress2(existing.address2 ?? '');
        setCity(existing.city);
        setState(existing.state);
        setZip(existing.zip);
        setCountry(existing.country);
        setIsDefault(existing.is_default);
      }
    });
  }, [id]);

  const handleSave = async () => {
    if (!fullName.trim() || !address1.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
    let all: SavedAddress[] = raw ? JSON.parse(raw) : [];

    const newAddr: SavedAddress = {
      id: id ?? Date.now().toString(),
      label, fullName: fullName.trim(), phone: phone.trim(),
      address1: address1.trim(), address2: address2.trim() || undefined,
      city: city.trim(), state: state.trim(), zip: zip.trim(),
      country: country.trim(), is_default: isDefault,
    };

    if (isDefault) {
      all = all.map((a) => ({ ...a, is_default: false }));
    }

    if (isEdit) {
      all = all.map((a) => (a.id === id ? newAddr : a));
    } else {
      all = [...all, newAddr];
    }

    await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(all));
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'New Address'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Label picker */}
          <Text style={styles.label}>Label</Text>
          <View style={styles.labelPicker}>
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.labelChip, label === l && styles.labelChipActive]}
                onPress={() => setLabel(l)}
                activeOpacity={0.7}
              >
                <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {[
            { label: 'Full Name', value: fullName, set: setFullName, cap: 'words' as const },
            { label: 'Phone', value: phone, set: setPhone, cap: 'none' as const, keyboard: 'phone-pad' as const },
            { label: 'Address Line 1', value: address1, set: setAddress1, cap: 'words' as const },
            { label: 'Address Line 2 (optional)', value: address2, set: setAddress2, cap: 'words' as const },
            { label: 'City', value: city, set: setCity, cap: 'words' as const },
            { label: 'State', value: state, set: setState, cap: 'characters' as const },
            { label: 'Zip Code', value: zip, set: setZip, cap: 'none' as const, keyboard: 'numeric' as const },
            { label: 'Country', value: country, set: setCountry, cap: 'words' as const },
          ].map((f) => (
            <View key={f.label} style={styles.fieldGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.set}
                autoCapitalize={f.cap}
                keyboardType={f.keyboard ?? 'default'}
                placeholderTextColor="#94A3B8"
                placeholder={f.label}
              />
            </View>
          ))}

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Set as default address</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={isDefault ? '#1A56DB' : '#94A3B8'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Address</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  content: { padding: 20, gap: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  labelPicker: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  labelChip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  labelChipActive: { backgroundColor: '#1A56DB', borderColor: '#1A56DB' },
  labelChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  labelChipTextActive: { color: '#fff' },
  fieldGroup: { marginBottom: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 8,
  },
  toggleLabel: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  error: { fontSize: 13, color: '#DC2626', marginBottom: 8 },
  saveBtn: {
    backgroundColor: '#1A56DB', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
