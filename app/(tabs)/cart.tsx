import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../lib/cart';

export default function CartScreen() {
  const { items, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        {totalItems > 0 && (
          <Text style={styles.headerSubtitle}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>

      {items.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={40} color="#94A3B8" />
          </View>
          <Text style={styles.emptyHeading}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add products to get started</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/' as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  contentFit="cover"
                  placeholder={{ color: '#F1F5F9' }}
                  transition={200}
                />
                <View style={styles.itemContent}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      style={styles.trashBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemUnitPrice}>${item.price.toFixed(2)} each</Text>
                  <View style={styles.itemBottom}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        hitSlop={6}
                      >
                        <Text style={styles.stepperSymbol}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        hitSlop={6}
                      >
                        <Text style={styles.stepperSymbol}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.lineTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated tax (8%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated shipping</Text>
              <Text style={[styles.summaryValue, { color: '#94A3B8' }]}>
                Calculated at checkout
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Order Total</Text>
              <Text style={styles.totalValue}>${(subtotal + tax).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout/address' as never)}
              activeOpacity={0.87}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#fff" />
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHeading: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', marginBottom: 28, textAlign: 'center' },
  browseBtn: {
    backgroundColor: '#1A56DB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 12 },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#F1F5F9' },
  itemContent: { flex: 1, gap: 4 },
  itemNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18 },
  trashBtn: { paddingTop: 2 },
  itemUnitPrice: { fontSize: 12, color: '#64748B' },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  stepperSymbol: { fontSize: 18, color: '#1E293B', lineHeight: 22 },
  stepperQty: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  lineTotal: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  summary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  checkoutBtn: {
    backgroundColor: '#1A56DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
