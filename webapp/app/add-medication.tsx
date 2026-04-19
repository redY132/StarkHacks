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
  const [description, setDescription] = useState('');
  const [doseDescription, setDoseDescription] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
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
    if (!prescribedBy.trim()) {
      Alert.alert('Prescribed By required');
      return;
    }
    if (!patientId) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      let h = hour;
      if (amPm === 'AM' && h === 12) h = 0;
      if (amPm === 'PM' && h !== 12) h += 12;
      const time24 = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      await updatePatientMedicines(patientId, {
        name: medName.trim(),
        description: description.trim(),
        dose_description: doseDescription.trim(),
        prescribed_by: prescribedBy.trim(),
        time: time24,
        days: Array.from(selectedDays),
        repeat,
        monthly_day: new Date().getDate(),
      });
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
          <Ionicons name="arrow-back" size={22} color="#3D2B1F" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Medication Name */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="pill" size={20} color="#7C6B5E" />
            <TextInput
              style={styles.inputField}
              placeholder="Medication name"
              placeholderTextColor="#7C6B5E"
              value={medName}
              onChangeText={setMedName}
              autoCapitalize="words"
            />
            <Pressable hitSlop={8}>
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#7C6B5E" />
            </Pressable>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.multilineInput}
            placeholder="e.g. Used to manage moderate to severe chronic pain"
            placeholderTextColor="#7C6B5E"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Dose Description */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Dose Description</Text>
          <TextInput
            style={styles.multilineInput}
            placeholder="e.g. Take 1 tablet orally every 8 hours with or without food"
            placeholderTextColor="#7C6B5E"
            value={doseDescription}
            onChangeText={setDoseDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Prescribed By */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Prescribed By</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#7C6B5E" />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Dr. Sarah Mitchell"
              placeholderTextColor="#7C6B5E"
              value={prescribedBy}
              onChangeText={setPrescribedBy}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Time */}
        <View style={styles.card}>
          <View style={styles.cardLabelRow}>
            <Ionicons name="time-outline" size={16} color="#7C6B5E" />
            <Text style={styles.cardLabel}>Time</Text>
          </View>
          <View style={styles.timePicker}>
            <View style={styles.timeColumn}>
              <Pressable onPress={() => adjustHour(1)} hitSlop={10}>
                <Ionicons name="chevron-up" size={20} color="#7C6B5E" />
              </Pressable>
              <Text style={styles.timeDigit}>{String(hour).padStart(2, '0')}</Text>
              <Pressable onPress={() => adjustHour(-1)} hitSlop={10}>
                <Ionicons name="chevron-down" size={20} color="#7C6B5E" />
              </Pressable>
            </View>
            <Text style={styles.timeColon}>:</Text>
            <View style={styles.timeColumn}>
              <Pressable onPress={() => adjustMinute(5)} hitSlop={10}>
                <Ionicons name="chevron-up" size={20} color="#7C6B5E" />
              </Pressable>
              <Text style={styles.timeDigit}>{String(minute).padStart(2, '0')}</Text>
              <Pressable onPress={() => adjustMinute(-5)} hitSlop={10}>
                <Ionicons name="chevron-down" size={20} color="#7C6B5E" />
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
  safe: { flex: 1, backgroundColor: '#EDEDE9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5EBE0',
    borderBottomWidth: 1,
    borderBottomColor: '#D5BDAF',
  },
  headerSide: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#3D2B1F' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#F5EBE0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#D5BDAF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C6B5E',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  multilineInput: {
    backgroundColor: '#E3D5CA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3D2B1F',
    minHeight: 76,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3D5CA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputField: { flex: 1, fontSize: 16, color: '#3D2B1F' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#7C6B5E', marginBottom: 12, letterSpacing: 0.3 },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  timeColumn: { alignItems: 'center', gap: 10 },
  timeDigit: { fontSize: 40, fontWeight: '700', color: '#3D2B1F', width: 64, textAlign: 'center' },
  timeColon: { fontSize: 36, fontWeight: '700', color: '#3D2B1F', marginBottom: 4 },
  amPmToggle: { marginLeft: 4, gap: 6 },
  amPmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E3D5CA',
  },
  amPmBtnActive: { backgroundColor: '#5C3D2E' },
  amPmText: { fontSize: 14, fontWeight: '600', color: '#7C6B5E' },
  amPmTextActive: { color: '#F5EBE0' },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#E3D5CA',
  },
  dayBtnActive: { backgroundColor: '#5C3D2E' },
  dayText: { fontSize: 11, fontWeight: '600', color: '#7C6B5E' },
  dayTextActive: { color: '#F5EBE0' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E3D5CA',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#5C3D2E' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#7C6B5E' },
  segmentTextActive: { color: '#F5EBE0' },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#F5EBE0',
    borderTopWidth: 1,
    borderTopColor: '#D5BDAF',
  },
  doneBtn: {
    backgroundColor: '#5C3D2E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnDisabled: { opacity: 0.5 },
  doneBtnText: { color: '#F5EBE0', fontSize: 16, fontWeight: '700' },
});
