import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { updatePatientMedicines } from '@/lib/firestore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const REPEAT_OPTIONS = ['Daily', 'Weekly', 'Monthly'] as const;

export default function AddMedicationScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [medName, setMedName] = useState('');
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [repeat, setRepeat] = useState<string>('Daily');
  const [saving, setSaving] = useState(false);

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  }

  function adjustHour(delta: number) {
    setHour((h) => {
      const next = h + delta;
      if (next < 1) return 12;
      if (next > 12) return 1;
      return next;
    });
  }

  function adjustMinute(delta: number) {
    setMinute((m) => {
      const next = m + delta;
      if (next < 0) return 55;
      if (next > 55) return 0;
      return next;
    });
  }

  async function handleDone() {
    if (!medName.trim()) {
      Alert.alert('Medication name required');
      return;
    }
    if (!patientId) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await updatePatientMedicines(patientId, medName.trim());
      router.back();
    } catch (e) {
      console.error('AddMedication: failed to save', e);
      Alert.alert('Error', 'Failed to save medication. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Medication Name */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="pill" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.inputField}
              placeholder="Medication name"
              placeholderTextColor="#9CA3AF"
              value={medName}
              onChangeText={setMedName}
              autoCapitalize="words"
            />
            <Pressable hitSlop={8}>
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Time */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.cardLabel}>Time</Text>
          </View>
          <View style={styles.timePicker}>
            <View style={styles.timeColumn}>
              <Pressable onPress={() => adjustHour(1)} hitSlop={10}>
                <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
              </Pressable>
              <Text style={styles.timeDigit}>{String(hour).padStart(2, '0')}</Text>
              <Pressable onPress={() => adjustHour(-1)} hitSlop={10}>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.timeColon}>:</Text>
            <View style={styles.timeColumn}>
              <Pressable onPress={() => adjustMinute(5)} hitSlop={10}>
                <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
              </Pressable>
              <Text style={styles.timeDigit}>{String(minute).padStart(2, '0')}</Text>
              <Pressable onPress={() => adjustMinute(-5)} hitSlop={10}>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
            <View style={styles.amPmToggle}>
              {(['AM', 'PM'] as const).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.amPmBtn, amPm === p && styles.amPmBtnActive]}
                  onPress={() => setAmPm(p)}
                >
                  <Text style={[styles.amPmText, amPm === p && styles.amPmTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Days */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Day</Text>
          <View style={styles.dayRow}>
            {DAYS.map((day) => (
              <Pressable
                key={day}
                style={[styles.dayBtn, selectedDays.has(day) && styles.dayBtnActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayText, selectedDays.has(day) && styles.dayTextActive]}>
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Repeat When */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Repeat When</Text>
          <View style={styles.segmented}>
            {REPEAT_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.segmentBtn, repeat === opt && styles.segmentBtnActive]}
                onPress={() => setRepeat(opt)}
              >
                <Text style={[styles.segmentText, repeat === opt && styles.segmentTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.doneBtn, saving && styles.doneBtnDisabled]}
          onPress={() => void handleDone()}
          disabled={saving}
        >
          <Text style={styles.doneBtnText}>{saving ? 'Saving…' : 'Done'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputField: { flex: 1, fontSize: 16, color: '#111' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12, letterSpacing: 0.3 },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  timeColumn: { alignItems: 'center', gap: 10 },
  timeDigit: { fontSize: 40, fontWeight: '700', color: '#111', width: 64, textAlign: 'center' },
  timeColon: { fontSize: 36, fontWeight: '700', color: '#111', marginBottom: 4 },
  amPmToggle: { marginLeft: 4, gap: 6 },
  amPmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  amPmBtnActive: { backgroundColor: '#22C55E' },
  amPmText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  amPmTextActive: { color: '#fff' },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  dayBtnActive: { backgroundColor: '#22C55E' },
  dayText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  dayTextActive: { color: '#fff' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#22C55E' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#fff' },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  doneBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnDisabled: { opacity: 0.5 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
