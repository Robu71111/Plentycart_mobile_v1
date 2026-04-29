import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  step: number;
  title: string;
  onBack: () => void;
};

export function CheckoutHeader({ step, title, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.progressTrack}>
        <View style={{ flex: step, backgroundColor: '#1A56DB', borderRadius: 2 }} />
        <View style={{ flex: 4 - step }} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  progressTrack: {
    height: 4,
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
});
