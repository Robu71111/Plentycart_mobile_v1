import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth';
import { getOrders, type Order } from '../../../lib/orders';

const STEPS = [
  { label: 'Return Initiated',       sub: 'Just now',             done: true },
  { label: 'Return Approved',        sub: 'Within ~20 seconds',   done: false },
  { label: 'Return in Progress',     sub: 'Item being collected',  done: false },
  { label: 'Returned to Warehouse',  sub: 'Item received',         done: false },
  { label: 'Refund Initiated',       sub: 'Processing payment',    done: false },
  { label: 'Refunded',               sub: '3–5 business days',     done: false },
];

export default function ReturnConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getOrders().then(orders => setOrder(orders.find(o => o.id === id) ?? null));

    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const returnId = order?.returnRequest?.id ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale }], opacity }]}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </Animated.View>

        <Animated.View style={{ opacity }}>
          <Text style={styles.title}>Return Request Submitted</Text>
          <Text style={styles.requestId}>Request ID: {returnId}</Text>
          <Text style={styles.blurb}>
            We'll review your request within 24 hours and email you at{' '}
            <Text style={styles.email}>{user?.email ?? 'your email'}</Text>
          </Text>
        </Animated.View>

        {/* What happens next */}
        <Animated.View style={[styles.timelineCard, { opacity }]}>
          <Text style={styles.timelineTitle}>What happens next</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              {/* dot + line */}
              <View style={styles.stepLeft}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  {step.done
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : <View style={styles.stepDotInner} />}
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              {/* text */}
              <View style={styles.stepText}>
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Info banner */}
        <Animated.View style={[styles.infoBanner, { opacity }]}>
          <Ionicons name="information-circle-outline" size={16} color="#1A56DB" />
          <Text style={styles.infoText}>
            Once approved, you'll receive a prepaid return shipping label via email.
            Refunds are issued to your original payment method.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.back()}
          activeOpacity={0.87}
        >
          <Text style={styles.primaryBtnText}>Back to Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)/orders' as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>View All Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, alignItems: 'center', gap: 20, paddingBottom: 32 },

  checkCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },

  title: { fontSize: 22, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginTop: 4 },
  requestId: {
    fontSize: 13, fontWeight: '700', color: '#1A56DB',
    textAlign: 'center', marginTop: 4,
    fontFamily: 'monospace',
  },
  blurb: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginTop: 10 },
  email: { fontWeight: '700', color: '#1E293B' },

  timelineCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    width: '100%', borderWidth: 1, borderColor: '#E2E8F0',
    gap: 0,
  },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 16 },

  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center', width: 22 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  stepDotDone: { backgroundColor: '#16A34A' },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' },
  stepLine: {
    flex: 1, width: 2, backgroundColor: '#E2E8F0',
    marginTop: 2, marginBottom: 2,
    minHeight: 28,
  },
  stepText: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  stepLabelDone: { color: '#1E293B' },
  stepSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  infoBanner: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14,
    flexDirection: 'row', gap: 10, width: '100%',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1A56DB', lineHeight: 19 },

  footer: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#1A56DB', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 6 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});
