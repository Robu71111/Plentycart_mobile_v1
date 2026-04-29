import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { useCheckout } from '../../lib/checkout';
import { CheckoutHeader } from '../../components/CheckoutHeader';

const ORDERS_KEY = '@plentycart/orders';

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const { address, shippingMethod, setOrderId } = useCheckout();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState(user?.name ?? '');
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = shippingMethod?.price ?? 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handlePay = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 16) { setError('Please enter a valid 16-digit card number.'); return; }
    if (expiry.length < 5) { setError('Please enter a valid expiry date (MM/YY).'); return; }
    if (cvc.length < 3) { setError('Please enter a valid CVC.'); return; }
    if (!cardName.trim()) { setError('Please enter the cardholder name.'); return; }
    setError('');
    setProcessing(true);

    const orderId = `PC-${Date.now()}`;
    const trackingNumber =
      '1Z' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const newOrder = {
      id: orderId,
      items: [...items],
      address,
      shipping: shippingMethod,
      subtotal,
      tax,
      shippingCost,
      total,
      status: 'Processing',
      placedAt: new Date().toISOString(),
      trackingNumber,
    };

    await new Promise((r) => setTimeout(r, 2000));

    try {
      const existing = await AsyncStorage.getItem(ORDERS_KEY);
      const orders = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...orders]));
    } catch {
      // continue even if storage fails in demo
    }

    setOrderId(orderId);
    clearCart();
    router.replace('/checkout/confirmation' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CheckoutHeader step={3} title="Payment" onBack={() => router.back()} />

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
          {/* Stripe banner */}
          <View style={styles.stripeBanner}>
            <Ionicons name="lock-closed" size={14} color="#16A34A" />
            <Text style={styles.stripeBannerText}>
              Secure payment powered by Stripe
            </Text>
          </View>

          {/* Card inputs */}
          <View style={styles.cardBox}>
            <Text style={styles.cardBoxTitle}>Card Information</Text>
            <View style={styles.cardDivider} />
            <View style={styles.cardField}>
              <TextInput
                style={styles.cardInput}
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                placeholder="Card number"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={19}
              />
              <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.cardIcon} />
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.cardInput, { flex: 1 }]}
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                placeholder="MM/YY"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={5}
              />
              <View style={styles.cardVerticalDivider} />
              <TextInput
                style={[styles.cardInput, { flex: 1 }]}
                value={cvc}
                onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="CVC"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
              />
            </View>
          </View>

          {/* Cardholder name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              value={cardName}
              onChangeText={setCardName}
              placeholder="Name on card"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
            />
          </View>

          {/* Save card toggle */}
          <TouchableOpacity
            style={styles.saveRow}
            onPress={() => setSaveCard((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
              {saveCard && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={styles.saveLabel}>Save card for future purchases</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Order summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping ({shippingMethod?.name ?? 'Ground'})</Text>
              <Text style={styles.summaryValue}>${shippingCost.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated tax (8%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePay}
          activeOpacity={0.87}
          disabled={processing}
        >
          {processing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payBtnText}>Processing payment...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.payBtnText}>Pay ${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 24 },

  stripeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  stripeBannerText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },

  cardBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardBoxTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  cardDivider: { height: 1, backgroundColor: '#E2E8F0' },
  cardRow: { flexDirection: 'row' },
  cardVerticalDivider: { width: 1, backgroundColor: '#E2E8F0' },
  cardField: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  cardInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  cardIcon: { marginLeft: 4 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
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

  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#1A56DB', borderColor: '#1A56DB' },
  saveLabel: { fontSize: 14, color: '#475569' },

  error: { fontSize: 13, color: '#DC2626' },

  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0' },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  summaryTotalValue: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payBtn: {
    backgroundColor: '#1A56DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
