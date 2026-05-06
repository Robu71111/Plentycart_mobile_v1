import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { getOrders, requestReturn, simulateReturnApproval, type Order, type ReturnRequest } from '../../../lib/orders';

const MAX_NOTES = 500;

export default function ReturnRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState<ReturnRequest['reason'] | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getOrders().then(orders => {
      const found = orders.find(o => o.id === id) ?? null;
      setOrder(found);
      if (found) {
        setSelectedItems(new Set(found.items.map(i => i.id)));
      }
    });
  }, [id]);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = reason !== null && selectedItems.size > 0;

  const handleSubmit = async () => {
    if (!order || !reason) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    try {
      await requestReturn(id!, {
        reason,
        notes: notes.trim(),
        photos,
        selectedItems: [...selectedItems],
      });
      simulateReturnApproval(id!);
      router.replace(`/orders/${id}/return-confirmation` as never);
    } catch {
      Alert.alert('Error', 'Could not submit return. Please try again.');
      setSubmitting(false);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </SafeAreaView>
    );
  }

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Return</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Order summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="receipt-outline" size={16} color="#1A56DB" />
              <Text style={styles.summaryOrderId}>{order.id}</Text>
            </View>
            <Text style={styles.summaryMeta}>
              {itemCount} item{itemCount !== 1 ? 's' : ''} · Total ${order.total.toFixed(2)}
            </Text>
          </View>

          {/* Select items */}
          <Text style={styles.sectionTitle}>Items to Return</Text>
          <View style={styles.card}>
            {order.items.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxChecked]}>
                  {selectedItems.has(item.id) && (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  )}
                </View>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    contentFit="cover"
                    placeholder={{ color: '#F1F5F9' }}
                  />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="cube-outline" size={18} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    Qty {item.quantity} · ${item.price.toFixed(2)} each
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reason */}
          <Text style={styles.sectionTitle}>Reason for Return</Text>
          <View style={styles.reasonRow}>
            <TouchableOpacity
              style={[styles.reasonCard, reason === 'Damaged Product' && styles.reasonCardSelected]}
              onPress={() => setReason('Damaged Product')}
              activeOpacity={0.8}
            >
              <View style={[styles.reasonIconCircle, reason === 'Damaged Product' && styles.reasonIconSelected]}>
                <Ionicons
                  name="warning-outline"
                  size={22}
                  color={reason === 'Damaged Product' ? '#fff' : '#64748B'}
                />
              </View>
              <Text style={[styles.reasonLabel, reason === 'Damaged Product' && styles.reasonLabelSelected]}>
                Damaged Product
              </Text>
              {reason === 'Damaged Product' && (
                <Ionicons name="checkmark-circle" size={18} color="#1A56DB" style={styles.reasonCheck} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reasonCard, reason === 'Wrong Product' && styles.reasonCardSelected]}
              onPress={() => setReason('Wrong Product')}
              activeOpacity={0.8}
            >
              <View style={[styles.reasonIconCircle, reason === 'Wrong Product' && styles.reasonIconSelected]}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color={reason === 'Wrong Product' ? '#fff' : '#64748B'}
                />
              </View>
              <Text style={[styles.reasonLabel, reason === 'Wrong Product' && styles.reasonLabelSelected]}>
                Wrong Product
              </Text>
              {reason === 'Wrong Product' && (
                <Ionicons name="checkmark-circle" size={18} color="#1A56DB" style={styles.reasonCheck} />
              )}
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <Text style={styles.sectionTitle}>Additional Details <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={v => setNotes(v.slice(0, MAX_NOTES))}
              placeholder="Tell us more about the issue…"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{notes.length}/{MAX_NOTES}</Text>
          </View>

          {/* Photos */}
          <Text style={styles.sectionTitle}>Photos <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.card}>
            <Text style={styles.photoHint}>Attach up to 3 photos showing the issue</Text>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <TouchableOpacity key={i} style={styles.photoThumbSlot} onPress={() => removePhoto(i)}>
                  <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                  <View style={styles.removeOverlay}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity style={styles.addPhotoSlot} onPress={pickPhoto} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={24} color="#94A3B8" />
                  <Text style={styles.addPhotoLabel}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.87}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <View style={styles.submitRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitBtnText}>Submitting request…</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit Return Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },

  summaryCard: {
    backgroundColor: '#EEF2FF', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#C7D2FE', gap: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryOrderId: { fontSize: 13, fontWeight: '700', color: '#1A56DB' },
  summaryMeta: { fontSize: 12, color: '#64748B' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', paddingHorizontal: 2 },
  optional: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0',
  },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#1A56DB', borderColor: '#1A56DB' },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  itemImagePlaceholder: {
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18 },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },

  reasonRow: { flexDirection: 'row', gap: 10 },
  reasonCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E2E8F0', padding: 14, alignItems: 'center', gap: 8,
  },
  reasonCardSelected: { borderColor: '#1A56DB', backgroundColor: '#EEF2FF' },
  reasonIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  reasonIconSelected: { backgroundColor: '#1A56DB' },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  reasonLabelSelected: { color: '#1A56DB' },
  reasonCheck: { position: 'absolute', top: 8, right: 8 },

  notesInput: {
    padding: 14, fontSize: 14, color: '#1E293B',
    minHeight: 100, maxHeight: 160,
  },
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', paddingHorizontal: 14, paddingBottom: 10 },

  photoHint: { fontSize: 12, color: '#64748B', padding: 14, paddingBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14, flexWrap: 'wrap' },
  photoThumbSlot: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  photoThumb: { width: 80, height: 80 },
  removeOverlay: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10,
  },
  addPhotoSlot: {
    width: 80, height: 80, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#CBD5E1', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  footer: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#1A56DB', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
