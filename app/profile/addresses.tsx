import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ADDRESSES_KEY = 'plentycart_addresses';

export type SavedAddress = {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
};

const LABEL_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Home: 'home-outline',
  Work: 'business-outline',
  Other: 'location-outline',
};

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(ADDRESSES_KEY).then((raw) => {
        setAddresses(raw ? JSON.parse(raw) : []);
      });
    }, [])
  );

  const deleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = addresses.filter((a) => a.id !== id);
          await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated));
          setAddresses(updated);
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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 32 }} />
      </View>

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="location-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyHeading}>No saved addresses yet</Text>
          <Text style={styles.emptySubtitle}>Add your first address for faster checkout</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/profile/address-form' as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add your first address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {addresses.map((addr) => (
              <View key={addr.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.labelRow}>
                    <Ionicons name={LABEL_ICONS[addr.label]} size={14} color="#1A56DB" />
                    <Text style={styles.labelText}>{addr.label}</Text>
                    {addr.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => router.push(`/profile/address-form?id=${addr.id}` as never)}
                      hitSlop={8}
                    >
                      <Ionicons name="create-outline" size={18} color="#1A56DB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAddress(addr.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addrName}>{addr.fullName}</Text>
                <Text style={styles.addrLine}>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</Text>
                <Text style={styles.addrLine}>{addr.city}, {addr.state} {addr.zip}</Text>
                <Text style={styles.addrLine}>{addr.country}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/profile/address-form' as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add New Address</Text>
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
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  defaultBadge: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, marginLeft: 4,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#1A56DB' },
  cardActions: { flexDirection: 'row', gap: 16 },
  addrName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  addrLine: { fontSize: 13, color: '#64748B', lineHeight: 18 },
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
