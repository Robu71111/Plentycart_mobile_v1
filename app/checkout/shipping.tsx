import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckout, type ShippingMethod } from '../../lib/checkout';
import { CheckoutHeader } from '../../components/CheckoutHeader';

const SHIPPING_OPTIONS: ShippingMethod[] = [
  { id: 'ground', name: 'USPS Ground', days: '5–7 business days', price: 5.99 },
  { id: 'twoday', name: 'UPS 2-Day', days: '2 business days', price: 12.99 },
  { id: 'overnight', name: 'FedEx Overnight', days: '1 business day', price: 24.99 },
];

export default function ShippingScreen() {
  const router = useRouter();
  const { address, shippingMethod, setShippingMethod } = useCheckout();
  const [selected, setSelected] = useState<string>(
    shippingMethod?.id ?? 'ground'
  );

  const handleContinue = () => {
    const method = SHIPPING_OPTIONS.find((o) => o.id === selected)!;
    setShippingMethod(method);
    router.push('/checkout/payment' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CheckoutHeader
        step={2}
        title="Shipping Method"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address summary card */}
        {address && (
          <View style={styles.addressCard}>
            <View style={styles.addressCardHeader}>
              <View style={styles.addressIconCircle}>
                <Ionicons name="location-outline" size={16} color="#1A56DB" />
              </View>
              <Text style={styles.addressCardTitle}>Delivering to</Text>
              <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressName}>{address.fullName}</Text>
            <Text style={styles.addressLine}>
              {address.address1}
              {address.address2 ? `, ${address.address2}` : ''}
            </Text>
            <Text style={styles.addressLine}>
              {address.city}, {address.state} {address.zip}
            </Text>
            <Text style={styles.addressLine}>{address.country}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Choose a shipping method</Text>

        {SHIPPING_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isSelected && styles.optionCardActive]}
              onPress={() => setSelected(option.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, isSelected && styles.radioActive]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                  {option.name}
                </Text>
                <Text style={styles.optionDays}>{option.days}</Text>
              </View>
              <Text style={[styles.optionPrice, isSelected && styles.optionPriceActive]}>
                ${option.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.87}
        >
          <Text style={styles.continueBtnText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 3,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1E293B' },
  editLink: { fontSize: 13, fontWeight: '600', color: '#1A56DB' },
  addressName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  addressLine: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  optionCardActive: { borderColor: '#1A56DB', backgroundColor: '#F0F4FF' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: '#1A56DB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A56DB' },
  optionInfo: { flex: 1, gap: 2 },
  optionName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  optionNameActive: { color: '#1A56DB' },
  optionDays: { fontSize: 13, color: '#64748B' },
  optionPrice: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  optionPriceActive: { color: '#1A56DB' },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
