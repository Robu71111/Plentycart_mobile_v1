import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../../lib/auth';
import { generateInvoicePDF } from '../../../lib/invoice';
import {
  getOrders, isReturnEligible,
  type Order, type ReturnRequest, type ReturnStatus,
} from '../../../lib/orders';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function shippingStatusLabel(status: string): string {
  switch (status) {
    case 'ORDER_PLACED': return 'Order Placed';
    case 'SHIPPED': return 'Shipped';
    case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
    case 'DELIVERED': return 'Delivered';
    default: return status;
  }
}

function shippingStatusColor(status: string): string {
  switch (status) {
    case 'ORDER_PLACED': return '#1A56DB';
    case 'SHIPPED': return '#D97706';
    case 'OUT_FOR_DELIVERY': return '#EA580C';
    case 'DELIVERED': return '#166534';
    default: return '#64748B';
  }
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

// ─── Shipping timeline (4 steps) ─────────────────────────────────────────────

const SHIPPING_STEPS: Array<{
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { key: 'ORDER_PLACED',      label: 'Order Placed',      icon: 'calendar-outline' },
  { key: 'SHIPPED',           label: 'Shipped',            icon: 'car-outline' },
  { key: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery',   icon: 'map-outline' },
  { key: 'DELIVERED',         label: 'Delivered',          icon: 'checkmark-circle-outline' },
];

const SHIPPING_ORDER: Record<string, number> = {
  ORDER_PLACED: 0,
  SHIPPED: 1,
  OUT_FOR_DELIVERY: 2,
  DELIVERED: 3,
};

function ShippingTimeline({ status }: { status: string }) {
  const currentIdx = SHIPPING_ORDER[status] ?? 0;

  return (
    <View style={tlStyles.container}>
      {SHIPPING_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const future = i > currentIdx;

        return (
          <View key={step.key} style={tlStyles.row}>
            <View style={tlStyles.left}>
              <View style={[tlStyles.dot, done && tlStyles.dotDone, active && tlStyles.dotActive]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Ionicons name={step.icon} size={10} color={future ? '#94A3B8' : '#fff'} />}
              </View>
              {i < SHIPPING_STEPS.length - 1 && (
                <View style={[tlStyles.line, done && tlStyles.lineDone]} />
              )}
            </View>
            <View style={tlStyles.textCol}>
              <Text style={[tlStyles.label, done && tlStyles.labelDone, active && tlStyles.labelActive]}>
                {step.label}
              </Text>
              {active && <Text style={tlStyles.inProgress}>In progress</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Return timeline (6 steps) ───────────────────────────────────────────────

const RETURN_STEPS: Array<{
  key: ReturnStatus;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { key: 'RETURN_INITIATED',           label: 'Return Initiated',      icon: 'refresh-outline' },
  { key: 'RETURN_APPROVED',            label: 'Return Approved',        icon: 'checkmark-outline' },
  { key: 'RETURN_IN_PROGRESS',         label: 'Return in Progress',     icon: 'cube-outline' },
  { key: 'ORDER_RETURNED_TO_WAREHOUSE', label: 'Returned to Warehouse', icon: 'home-outline' },
  { key: 'REFUND_INITIATED',           label: 'Refund Initiated',       icon: 'card-outline' },
  { key: 'REFUNDED',                   label: 'Refunded',               icon: 'checkmark-circle-outline' },
];

const RETURN_ORDER: Record<ReturnStatus, number> = {
  RETURN_INITIATED: 0,
  RETURN_APPROVED: 1,
  RETURN_IN_PROGRESS: 2,
  ORDER_RETURNED_TO_WAREHOUSE: 3,
  REFUND_INITIATED: 4,
  REFUNDED: 5,
};

function ReturnTimeline({ status }: { status: ReturnStatus }) {
  const currentIdx = RETURN_ORDER[status] ?? 0;

  return (
    <View style={tlStyles.container}>
      {RETURN_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const future = i > currentIdx;

        return (
          <View key={step.key} style={tlStyles.row}>
            <View style={tlStyles.left}>
              <View style={[tlStyles.dot, done && tlStyles.dotDone, active && tlStyles.dotActive]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Ionicons name={step.icon} size={10} color={future ? '#94A3B8' : '#fff'} />}
              </View>
              {i < RETURN_STEPS.length - 1 && (
                <View style={[tlStyles.line, done && tlStyles.lineDone]} />
              )}
            </View>
            <View style={tlStyles.textCol}>
              <Text style={[tlStyles.label, done && tlStyles.labelDone, active && tlStyles.labelActive]}>
                {step.label}
              </Text>
              {active && <Text style={tlStyles.inProgress}>In progress</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  container: { marginTop: 8, gap: 0 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  left: { alignItems: 'center', width: 22 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  dotDone: { backgroundColor: '#1A56DB' },
  dotActive: { backgroundColor: '#1A56DB' },
  line: { flex: 1, width: 2, backgroundColor: '#E2E8F0', minHeight: 24, marginTop: 2 },
  lineDone: { backgroundColor: '#1A56DB' },
  textCol: { flex: 1, paddingBottom: 16 },
  label: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  labelDone: { color: '#1E293B', fontWeight: '600' },
  labelActive: { color: '#1E293B', fontWeight: '700' },
  inProgress: { fontSize: 11, color: '#1A56DB', marginTop: 1 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getOrders().then(orders => {
        setOrder(orders.find(o => o.id === id) ?? null);
        setLoading(false);
      });
    }, [id])
  );

  // Poll every 3 s while return is active (not yet refunded)
  useEffect(() => {
    const s = order?.returnRequest?.status;
    if (!s || s === 'REFUNDED') return;
    const interval = setInterval(async () => {
      const orders = await getOrders();
      const found = orders.find(o => o.id === id);
      if (found) setOrder(found);
    }, 3000);
    return () => clearInterval(interval);
  }, [order?.returnRequest?.status, id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setGeneratingPDF(true);
    try {
      const uri = await generateInvoicePDF(order, user?.email);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${order.id}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch {
      Alert.alert('Error', 'Could not generate invoice. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

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
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/orders' as never)}
          style={styles.homeBtn}
        >
          <Text style={styles.homeBtnText}>Go to Orders</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const eligible = isReturnEligible(order);
  const hasReturn = !!order.returnRequest;
  const windowExpired = order.status === 'DELIVERED' && !eligible && !hasReturn;

  const displayStatus = hasReturn && order.returnRequest
    ? returnStatusLabel(order.returnRequest.status)
    : shippingStatusLabel(order.status);
  const displayColor = hasReturn && order.returnRequest
    ? returnStatusColor(order.returnRequest.status)
    : shippingStatusColor(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/orders' as never)}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSub}>{order.id}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: displayColor }]} />
            <Text style={[styles.statusText, { color: displayColor }]}>{displayStatus}</Text>
          </View>
          <Text style={styles.statusDate}>Placed {formatDate(order.placedAt)}</Text>
          <View style={styles.trackingRow}>
            <Ionicons name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.trackingText}>Tracking: {order.trackingNumber}</Text>
          </View>
          {order.shipping && (
            <Text style={styles.shippingText}>
              {order.shipping.name}{order.shipping.days ? ` · ${order.shipping.days}` : ''}
            </Text>
          )}
        </View>

        {/* Shipping progress timeline (only when no active return) */}
        {!hasReturn && (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Shipping Progress</Text>
            <ShippingTimeline status={order.status} />
          </View>
        )}

        {/* Shipping address */}
        {order.address && (
          <>
            <Text style={styles.sectionTitle}>Shipping To</Text>
            <View style={styles.addressCard}>
              <Ionicons name="location-outline" size={16} color="#1A56DB" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addrName}>{order.address.fullName}</Text>
                <Text style={styles.addrLine}>
                  {order.address.address1}{order.address.address2 ? `, ${order.address.address2}` : ''}
                </Text>
                <Text style={styles.addrLine}>
                  {order.address.city}, {order.address.state} {order.address.zip}
                </Text>
                <Text style={styles.addrLine}>{order.address.country}</Text>
              </View>
            </View>
          </>
        )}

        {/* Items */}
        <Text style={styles.sectionTitle}>Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</Text>
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

        {/* Payment summary */}
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

        {/* ── Action buttons — conditional on return status ── */}

        {hasReturn ? (
          // Return order: show Download Return Label
          <TouchableOpacity
            style={styles.returnLabelBtn}
            onPress={() => Alert.alert(
              'Return Label',
              `Return label sent to ${user?.email ?? 'your email'}. Check your inbox to print and attach it to your package.`
            )}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={18} color="#1A56DB" />
            <Text style={styles.returnLabelBtnText}>Download Return Label</Text>
          </TouchableOpacity>
        ) : (
          // Non-return order: show Track + Invoice
          <>
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => Alert.alert('Track Package', `Tracking: ${order.trackingNumber}\n\nOpen your carrier's website to track this shipment.`)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={18} color="#1A56DB" />
              <Text style={styles.trackBtnText}>Track Package</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.invoiceBtn, generatingPDF && { opacity: 0.7 }]}
              onPress={handleDownloadInvoice}
              activeOpacity={0.85}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <View style={styles.btnInner}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.invoiceBtnText}>Generating invoice…</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.invoiceBtnText}>Download Invoice</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Return section ── */}

        {eligible && (
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.push(`/orders/${id}/return` as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={18} color="#DC2626" />
            <Text style={styles.returnBtnText}>Request Return / Exchange</Text>
          </TouchableOpacity>
        )}

        {windowExpired && (
          <View style={styles.expiredBanner}>
            <Ionicons name="time-outline" size={15} color="#64748B" />
            <Text style={styles.expiredText}>7-day return window has expired for this order</Text>
          </View>
        )}

        {hasReturn && order.returnRequest && (
          <ReturnStatusCard order={order} userEmail={user?.email} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Return status card ───────────────────────────────────────────────────────

function ReturnStatusCard({ order, userEmail }: { order: Order; userEmail?: string }) {
  const rr = order.returnRequest!;
  const color = returnStatusColor(rr.status);
  const label = returnStatusLabel(rr.status);

  return (
    <View style={styles.returnCard}>
      <View style={styles.returnCardHeader}>
        <View style={styles.returnCardTitleRow}>
          <Ionicons name="refresh-circle-outline" size={18} color="#1E293B" />
          <Text style={styles.returnCardTitle}>Return Request</Text>
        </View>
        <View style={[styles.returnBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.returnBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <Text style={styles.returnId}>{rr.id}</Text>
      <Text style={styles.returnReason}>{rr.reason}</Text>
      {!!rr.notes && <Text style={styles.returnNotes}>{rr.notes}</Text>}
      <Text style={styles.returnDate}>
        Submitted {new Date(rr.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>

      <View style={styles.returnTimelineSeparator} />
      <ReturnTimeline status={rr.status} />

      {rr.status === 'REFUNDED' && (
        <View style={styles.refundBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#166534" />
          <Text style={styles.refundText}>
            Refund of ${rr.refundAmount?.toFixed(2)} has been processed. Allow 3–5 business days to appear on your statement.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 16 },
  notFoundText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  homeBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#1A56DB', borderRadius: 10 },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 48 },

  statusCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: '700' },
  statusDate: { fontSize: 13, color: '#64748B' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trackingText: { fontSize: 12, color: '#64748B', fontFamily: 'monospace' },
  shippingText: { fontSize: 13, color: '#64748B' },

  timelineCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },

  addressCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 10,
    padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  addrName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  addrLine: { fontSize: 13, color: '#64748B', lineHeight: 19 },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  itemImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#F1F5F9' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18, marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#64748B' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#1A56DB', borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#fff',
  },
  trackBtnText: { fontSize: 15, fontWeight: '700', color: '#1A56DB' },

  invoiceBtn: { backgroundColor: '#1A56DB', borderRadius: 14, paddingVertical: 15 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  invoiceBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  returnLabelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#1A56DB', borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#fff',
  },
  returnLabelBtnText: { fontSize: 15, fontWeight: '700', color: '#1A56DB' },

  returnBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#fff',
  },
  returnBtnText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },

  expiredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14,
  },
  expiredText: { fontSize: 13, color: '#64748B', flex: 1 },

  returnCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  returnCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  returnCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  returnCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  returnBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  returnBadgeText: { fontSize: 12, fontWeight: '700' },
  returnId: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  returnReason: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  returnNotes: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  returnDate: { fontSize: 12, color: '#94A3B8' },
  returnTimelineSeparator: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },

  refundBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#DCFCE7', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, marginTop: 4,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  refundText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 19 },
});
