import { useState, useCallback, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../lib/auth';
import { useCheckout, type CheckoutAddress } from '../../lib/checkout';
import { CheckoutHeader } from '../../components/CheckoutHeader';
import { ADDRESSES_KEY, type SavedAddress } from '../profile/addresses';

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
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
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

function mapSavedToForm(addr: SavedAddress): CheckoutAddress {
  return {
    fullName: addr.fullName,
    phone: addr.phone ?? '',
    address1: addr.address1,
    address2: addr.address2 ?? '',
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country,
  };
}

const LABEL_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Home: 'home-outline',
  Work: 'business-outline',
  Other: 'location-outline',
};

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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Track whether we've auto-pre-filled on mount so we don't override edits on re-focus
  const prefilled = useRef(false);

  // Load saved addresses for the picker on every focus
  useFocusEffect(
    useCallback(() => {
      setVerifyState('idle');
      AsyncStorage.getItem(ADDRESSES_KEY).then((raw) => {
        if (!raw) return;
        const all: SavedAddress[] = JSON.parse(raw);
        setSavedAddresses(all);
      });
    }, [])
  );

  // Pre-fill from default saved address once on mount (only if checkout has no address yet)
  useEffect(() => {
    if (saved || prefilled.current) return;
    AsyncStorage.getItem(ADDRESSES_KEY).then((raw) => {
      if (!raw) return;
      const all: SavedAddress[] = JSON.parse(raw);
      const def = all.find((a) => a.is_default) ?? (all.length === 1 ? all[0] : null);
      if (def) {
        setForm(mapSavedToForm(def));
        prefilled.current = true;
      }
    });
  }, []);

  const set = (key: keyof CheckoutAddress) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const applyAddress = (addr: SavedAddress) => {
    setForm(mapSavedToForm(addr));
    setShowPicker(false);
  };

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
          {/* Saved addresses picker */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedCard}>
              <TouchableOpacity
                style={styles.savedHeader}
                onPress={() => setShowPicker((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={styles.savedHeaderLeft}>
                  <Ionicons name="bookmark-outline" size={15} color="#1A56DB" />
                  <Text style={styles.savedHeaderText}>Saved Addresses</Text>
                  <View style={styles.savedCountBadge}>
                    <Text style={styles.savedCountText}>{savedAddresses.length}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showPicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.savedList}>
                  {savedAddresses.map((addr, i) => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[styles.savedItem, i > 0 && styles.savedItemBorder]}
                      onPress={() => applyAddress(addr)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.savedItemLeft}>
                        <Ionicons
                          name={LABEL_ICONS[addr.label] ?? 'location-outline'}
                          size={14}
                          color="#1A56DB"
                        />
                        <Text style={styles.savedItemLabel}>{addr.label}</Text>
                        {addr.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.savedItemAddr} numberOfLines={1}>
                        {addr.address1}, {addr.city}, {addr.state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

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
                  Address verified
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

  savedCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  savedHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedHeaderText: { fontSize: 13, fontWeight: '700', color: '#1A56DB' },
  savedCountBadge: {
    backgroundColor: '#1A56DB',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  savedList: { borderTopWidth: 1, borderTopColor: '#C7D2FE', backgroundColor: '#fff' },
  savedItem: { paddingHorizontal: 14, paddingVertical: 12 },
  savedItemBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  savedItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  savedItemLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  defaultBadge: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: '#1A56DB' },
  savedItemAddr: { fontSize: 12, color: '#64748B' },

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
    backgroundColor: '#fff',
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
