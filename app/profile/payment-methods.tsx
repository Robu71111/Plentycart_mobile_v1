import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PAYMENT_METHODS_KEY = 'plentycart_payment_methods';

export type PaymentMethod = {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  name: string;
  isDefault: boolean;
};

function brandIcon(brand: string): React.ComponentProps<typeof Ionicons>['name'] {
  return 'card-outline';
}

function brandLabel(brand: string) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card';
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PAYMENT_METHODS_KEY).then((raw) => {
        setMethods(raw ? JSON.parse(raw) : []);
      });
    }, [])
  );

  const remove = (id: string) => {
    Alert.alert('Remove Card', 'Remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = methods.filter((m) => m.id !== id);
          await AsyncStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
          setMethods(updated);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 32 }} />
      </View>

      {methods.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="card-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyHeading}>No payment methods saved</Text>
          <Text style={styles.emptySubtitle}>Add a card for faster checkout</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/profile/add-payment' as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {methods.map((m) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons name={brandIcon(m.brand)} size={22} color="#1A56DB" />
                  </View>
                  <View>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardBrand}>{brandLabel(m.brand)}</Text>
                      {m.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardNumber}>•••• •••• •••• {m.last4}</Text>
                    <Text style={styles.cardMeta}>{m.name}  ·  Expires {m.expiry}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => remove(m.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/profile/add-payment' as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  cardIconCircle: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrand: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  defaultBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: '#1A56DB' },
  cardNumber: { fontSize: 13, color: '#475569', letterSpacing: 1, marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  footer: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  addBtn: {
    backgroundColor: '#1A56DB', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
