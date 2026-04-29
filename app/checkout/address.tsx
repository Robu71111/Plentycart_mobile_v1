import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { useCheckout, type CheckoutAddress } from '../../lib/checkout';
import { CheckoutHeader } from '../../components/CheckoutHeader';

type VerifyState = 'idle' | 'verifying' | 'verified';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  optional,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {optional && <Text style={styles.optional}> (optional)</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        autoCorrect={false}
      />
    </View>
  );
}

export default function AddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { address: saved, setAddress } = useCheckout();

  const [form, setForm] = useState<CheckoutAddress>({
    fullName: saved?.fullName ?? user?.name ?? '',
    phone: saved?.phone ?? '',
    address1: saved?.address1 ?? '',
    address2: saved?.address2 ?? '',
    city: saved?.city ?? '',
    state: saved?.state ?? '',
    zip: saved?.zip ?? '',
    country: saved?.country ?? 'United States',
  });
  const [error, setError] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');

  // Reset the overlay every time this screen comes back into focus (e.g. user
  // taps "Edit" from the shipping step and returns here).
  useFocusEffect(
    useCallback(() => {
      setVerifyState('idle');
    }, [])
  );

  const set = (key: keyof CheckoutAddress) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleContinue = async () => {
    const required: (keyof CheckoutAddress)[] = [
      'fullName', 'phone', 'address1', 'city', 'state', 'zip',
    ];
    const missing = required.find((k) => !form[k].trim());
    if (missing) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setAddress(form);
    setVerifyState('verifying');
    await new Promise((r) => setTimeout(r, 1000));
    setVerifyState('verified');
    await new Promise((r) => setTimeout(r, 700));
    router.push('/checkout/shipping' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CheckoutHeader step={1} title="Shipping Address" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Full Name" value={form.fullName} onChangeText={set('fullName')} />
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Field label="Address Line 1" value={form.address1} onChangeText={set('address1')} />
          <Field
            label="Address Line 2"
            value={form.address2}
            onChangeText={set('address2')}
            optional
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={form.city} onChangeText={set('city')} />
            </View>
            <View style={{ width: 80 }}>
              <Field
                label="State"
                value={form.state}
                onChangeText={set('state')}
                placeholder="CA"
                autoCapitalize="characters"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ width: 120 }}>
              <Field
                label="Zip Code"
                value={form.zip}
                onChangeText={set('zip')}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Country" value={form.country} onChangeText={set('country')} />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.87}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Address verification overlay */}
      {verifyState !== 'idle' && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            {verifyState === 'verifying' ? (
              <>
                <ActivityIndicator size="large" color="#1A56DB" />
                <Text style={styles.overlayText}>Verifying address...</Text>
              </>
            ) : (
              <>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={28} color="#fff" />
                </View>
                <Text style={[styles.overlayText, { color: '#16A34A' }]}>
                  Address verified ✓
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 4, paddingBottom: 40 },

  row: { flexDirection: 'row', gap: 12 },

  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#94A3B8' },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },

  error: { fontSize: 13, color: '#DC2626', marginBottom: 4 },

  continueBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 48,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  overlayText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
