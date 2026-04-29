import { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useCheckout } from '../../lib/checkout';

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orderId, reset } = useCheckout();

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleViewOrder = () => {
    const id = orderId;
    reset();
    router.replace(`/orders/${id}` as never);
  };

  const handleContinueShopping = () => {
    reset();
    router.replace('/' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.checkCircle, { opacity, transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </Animated.View>

        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.orderId}>Order #{orderId ?? 'PC-0000000000000'}</Text>

        <Text style={styles.emailNote}>
          We'll send a confirmation to{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        {/* Delivery card */}
        <View style={styles.deliveryCard}>
          <Ionicons name="time-outline" size={18} color="#1A56DB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryLabel}>Estimated delivery</Text>
            <Text style={styles.deliveryDate}>{getDeliveryDate()}</Text>
          </View>
        </View>

        {/* Tracking pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Processing your order</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewOrderBtn}
          onPress={handleViewOrder}
          activeOpacity={0.87}
        >
          <Text style={styles.viewOrderText}>View Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinueShopping}
          activeOpacity={0.87}
        >
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },

  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },

  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  orderId: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  emailNote: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  email: { fontWeight: '600', color: '#1E293B' },

  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  deliveryLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  deliveryDate: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF9C3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CA8A04' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#CA8A04' },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  viewOrderBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  viewOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  continueBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
});
