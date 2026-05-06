import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOrders, type Order, type ReturnStatus } from '../../lib/orders';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function returnStatusLabel(status: ReturnStatus): string {
  switch (status) {
    case 'RETURN_INITIATED': return 'Return Requested';
    case 'RETURN_APPROVED': return 'Return Approved';
    case 'RETURN_IN_PROGRESS': return 'Return in Progress';
    case 'ORDER_RETURNED_TO_WAREHOUSE': return 'At Warehouse';
    case 'REFUND_INITIATED': return 'Refund Processing';
    case 'REFUNDED': return 'Refunded';
  }
}

function returnStatusColor(status: ReturnStatus): string {
  switch (status) {
    case 'RETURN_INITIATED': return '#D97706';
    case 'RETURN_APPROVED': return '#1A56DB';
    case 'RETURN_IN_PROGRESS': return '#EA580C';
    case 'ORDER_RETURNED_TO_WAREHOUSE': return '#7C3AED';
    case 'REFUND_INITIATED': return '#0891B2';
    case 'REFUNDED': return '#166534';
  }
}

export default function ProfileReturnsScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getOrders()
        .then(all => setOrders(all.filter(o => !!o.returnRequest)))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Returns</Text>
          {!loading && orders.length > 0 && (
            <Text style={styles.headerSub}>
              {orders.length} return{orders.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="refresh-circle-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyHeading}>No returns yet</Text>
          <Text style={styles.emptySubtitle}>Your return requests will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const rr = item.returnRequest!;
            const label = returnStatusLabel(rr.status);
            const color = returnStatusColor(rr.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/orders/${item.id}` as never)}
                activeOpacity={0.85}
              >
                <View style={styles.cardIconCircle}>
                  <Ionicons name="refresh-outline" size={20} color="#DC2626" />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardOrderId}>{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.statusText, { color }]}>{label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardReason}>{rr.reason}</Text>
                  <Text style={styles.cardDate}>Submitted {formatDate(rr.requestedAt)}</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  listContent: { padding: 12, gap: 10, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardOrderId: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardReason: { fontSize: 12, color: '#64748B' },
  cardDate: { fontSize: 12, color: '#94A3B8' },
});
