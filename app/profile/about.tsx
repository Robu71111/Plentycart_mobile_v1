import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VERSION = '1.0.0';
const BUILD = '2026.04';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Plentycart</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="cart" size={40} color="#1A56DB" />
          </View>
          <Text style={styles.appName}>Plentycart</Text>
          <Text style={styles.tagline}>Shop more. Spend less. Live well.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version {VERSION}  ·  Build {BUILD}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardBody}>
            Plentycart brings the best products across electronics, skincare, wellness, and lifestyle
            directly to your fingertips — at prices that make sense. We believe great shopping should
            be effortless, fast, and trustworthy.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What Makes Us Different</Text>
          {[
            { icon: 'shield-checkmark-outline' as const, text: 'Verified products from trusted suppliers' },
            { icon: 'return-up-back-outline' as const, text: 'Hassle-free 30-day returns' },
            { icon: 'flash-outline' as const, text: 'Fast delivery, starting at $5.99' },
            { icon: 'headset-outline' as const, text: '7-day customer support' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={item.icon} size={18} color="#1A56DB" />
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalLine}>© 2026 Plentycart, Inc. All rights reserved.</Text>
          <Text style={styles.legalLine}>Terms of Service  ·  Privacy Policy  ·  Cookie Policy</Text>
          <Text style={[styles.legalLine, { marginTop: 8, color: '#CBD5E1' }]}>
            This is a demo app built for stakeholder preview.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  logoSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 24, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  appName: { fontSize: 26, fontWeight: '800', color: '#1A56DB' },
  tagline: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },
  versionBadge: {
    marginTop: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 14,
    paddingVertical: 5, borderRadius: 20,
  },
  versionText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: '#475569', flex: 1 },
  legalCard: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  legalLine: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});
