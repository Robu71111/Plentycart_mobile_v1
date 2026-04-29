import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_KEY = '@plentycart/orders';

type OrderItem = { id: string; name: string; price: number; quantity: number };
type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  placedAt: string;
  trackingNumber: string;
  shipping?: { name: string };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusColor(status: string) {
  if (status === 'Delivered') return '#16A34A';
  if (status === 'Shipped') return '#1A56DB';
  return '#D97706';
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-read every time the tab is focused so new orders appear immediately
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      AsyncStorage.getItem(ORDERS_KEY)
        .then((raw) => {
          setOrders(raw ? JSON.parse(raw) : []);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {orders.length > 0 && (
          <Text style={styles.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {orders.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyHeading}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your completed orders will appear here</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push('/' as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const itemCount = item.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${item.id}` as never)}
                activeOpacity={0.85}
              >
                <View style={styles.orderIconCircle}>
                  <Ionicons name="cube-outline" size={20} color="#1A56DB" />
                </View>
                <View style={styles.orderInfo}>
                  <View style={styles.orderTopRow}>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor(item.status) + '18' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderMeta}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''} ·{' '}
                    {item.shipping?.name ?? 'Standard'}
                  </Text>
                  <View style={styles.orderBottomRow}>
                    <Text style={styles.orderDate}>{formatDate(item.placedAt)}</Text>
                    <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  shopBtn: {
    backgroundColor: '#1A56DB',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  listContent: { padding: 12, gap: 10, paddingBottom: 32 },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: { flex: 1, gap: 3 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderMeta: { fontSize: 12, color: '#64748B' },
  orderBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  orderDate: { fontSize: 12, color: '#94A3B8' },
  orderTotal: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
});
