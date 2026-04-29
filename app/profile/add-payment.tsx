import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PAYMENT_METHODS_KEY, type PaymentMethod } from './payment-methods';

function detectBrand(number: string): PaymentMethod['brand'] {
  const first = number.replace(/\s/g, '')[0];
  if (first === '4') return 'visa';
  if (first === '5') return 'mastercard';
  if (first === '3') return 'amex';
  return 'visa';
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function AddPaymentScreen() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  const handleCardNumber = (text: string) => setCardNumber(formatCardNumber(text));
  const handleExpiry = (text: string) => setExpiry(formatExpiry(text));
  const handleCvc = (text: string) => setCvc(text.replace(/\D/g, '').slice(0, 4));

  const handleSave = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13) { setError('Enter a valid card number.'); return; }
    if (expiry.length < 5) { setError('Enter a valid expiry date (MM/YY).'); return; }
    if (cvc.length < 3) { setError('Enter a valid CVC.'); return; }
    if (!name.trim()) { setError('Enter the cardholder name.'); return; }

    const raw = await AsyncStorage.getItem(PAYMENT_METHODS_KEY);
    let all: PaymentMethod[] = raw ? JSON.parse(raw) : [];

    if (isDefault) {
      all = all.map((m) => ({ ...m, isDefault: false }));
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expiry,
      name: name.trim(),
      isDefault,
    };

    all = [...all, newMethod];
    await AsyncStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(all));
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.stripeBanner}>
            <Ionicons name="lock-closed" size={13} color="#16A34A" />
            <Text style={styles.stripeText}>Card info is stored locally on this device only</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Card Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputInRow}
                value={cardNumber}
                onChangeText={handleCardNumber}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Expiry</Text>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={handleExpiry}
                placeholder="MM/YY"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVC</Text>
              <TextInput
                style={styles.input}
                value={cvc}
                onChangeText={handleCvc}
                placeholder="123"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name on card"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Set as default payment method</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={isDefault ? '#1A56DB' : '#94A3B8'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Card</Text>
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
  stripeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 20,
  },
  stripeText: { fontSize: 12, color: '#15803D', fontWeight: '500', flex: 1 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    backgroundColor: '#F8FAFC', paddingRight: 12,
  },
  inputInRow: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1E293B',
  },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputIcon: { marginLeft: 4 },
  row: { flexDirection: 'row', gap: 12 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 4,
  },
  toggleLabel: { fontSize: 15, color: '#1E293B', fontWeight: '500', flex: 1, marginRight: 12 },
  error: { fontSize: 13, color: '#DC2626', marginBottom: 8 },
  saveBtn: {
    backgroundColor: '#1A56DB', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
