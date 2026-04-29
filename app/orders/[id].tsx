import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

const ORDERS_KEY = '@plentycart/orders';

type OrderItem = { id: string; name: string; price: number; quantity: number; image?: string };
type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: string;
  placedAt: string;
  trackingNumber: string;
  shipping?: { name: string; days: string };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ORDERS_KEY).then((raw) => {
      if (raw) {
        const orders: Order[] = JSON.parse(raw);
        setOrder(orders.find((o) => o.id === id) ?? null);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.notFoundText}>Order not found</Text>
        <TouchableOpacity onPress={() => router.replace('/' as never)} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/' as never)} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSub}>{order.id}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          <Text style={styles.statusDate}>Placed {formatDate(order.placedAt)}</Text>
          <View style={styles.trackingRow}>
            <Ionicons name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.trackingText}>Tracking: {order.trackingNumber}</Text>
          </View>
          {order.shipping && (
            <Text style={styles.shippingText}>
              {order.shipping.name} · {order.shipping.days}
            </Text>
          )}
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              contentFit="cover"
              placeholder={{ color: '#F1F5F9' }}
              transition={200}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemMeta}>Qty: {item.quantity} · ${item.price.toFixed(2)} each</Text>
            </View>
            <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>${order.shippingCost.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total charged</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 16 },
  notFoundText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  homeBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#1A56DB', borderRadius: 10 },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  statusDate: { fontSize: 13, color: '#64748B' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trackingText: { fontSize: 12, color: '#64748B', fontFamily: 'monospace' },
  shippingText: { fontSize: 13, color: '#64748B' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#F1F5F9' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18, marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#64748B' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  summaryCard: {
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
});
