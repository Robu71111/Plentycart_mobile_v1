import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FAQ = [
  {
    q: 'How do I track my order?',
    a: 'Go to the Orders tab to see all your orders. Tap any order to view its status, tracking number, and estimated delivery date.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Orders can be modified within 1 hour of placement. After that, they enter processing and cannot be changed. Contact support for urgent requests.',
  },
  {
    q: 'How do I return an item?',
    a: 'We offer free returns within 30 days of delivery. Start a return from your order detail page and we\'ll email you a prepaid label.',
  },
  {
    q: 'When will I be charged?',
    a: 'Your card is charged at the time of order placement. For pre-order items, you\'re charged when the item ships.',
  },
  {
    q: 'How do I update my saved address?',
    a: 'Go to Profile → Saved Addresses. Tap the edit icon on any address to update it.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. We use industry-standard encryption and never store your full card number. Only the last 4 digits and expiry are saved for reference.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {FAQ.map((item, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.divider} />}
              <FaqItem q={item.q} a={item.a} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Contact Us</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@plentycart.com')}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={20} color="#1A56DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSub}>support@plentycart.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('tel:+18005551234')}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={20} color="#1A56DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSub}>1-800-555-1234  ·  Mon–Fri 9am–6pm ET</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#94A3B8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: '#94A3B8' }]}>Live Chat</Text>
              <Text style={styles.contactSub}>Coming soon</Text>
            </View>
          </View>
        </View>

        <Text style={styles.responseNote}>
          We typically respond within 24 hours on business days.
        </Text>
      </ScrollView>
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
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  faqCard: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1 },
  faqA: { fontSize: 13, color: '#64748B', lineHeight: 20, marginTop: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  contactCard: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  contactIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  contactTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  contactSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  responseNote: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});
