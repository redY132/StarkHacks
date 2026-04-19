import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import { getPatients } from '@/lib/firestore';
import type { Patient } from '@/types';

const PARCHMENT = '#EDEDE9';
const ALMOND_CREAM = '#E3D5CA';
const ALMOND_SILK = '#D5BDAF';
const BONE = '#D6CCC2';
const TXT_PRIMARY = '#3D2B1F';
const TXT_SECONDARY = '#7C6B5E';
const TXT_ACTIVE = '#5C3D2E';

const ACCENT = TXT_ACTIVE;

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const JS_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type MedEntry = {
  id: string;
  patientName: string;
  time: string;
  name: string;
  description: string;
  dose_description: string;
  prescribed_by: string;
  days: string[];
  repeat: string;
  monthly_day: number;
  active: boolean;
};

function buildEntries(patients: Patient[]): MedEntry[] {
  const entries: MedEntry[] = [];
  patients.forEach((patient) => {
    patient.medicines.forEach((med, idx) => {
      entries.push({
        id: `${patient.id}-${idx}`,
        patientName: patient.name,
        time: med.time,
        name: med.name,
        description: med.description,
        dose_description: med.dose_description,
        prescribed_by: med.prescribed_by,
        days: med.days,
        repeat: med.repeat,
        monthly_day: med.monthly_day,
        active: false,
      });
    });
  });
  return entries;
}

function shouldShowOnDate(med: MedEntry, date: Date): boolean {
  if (med.repeat === 'Daily') return true;
  if (med.repeat === 'Weekly') {
    const label = JS_DAY_LABELS[date.getDay()];
    return label !== undefined && med.days.includes(label);
  }
  if (med.repeat === 'Monthly') {
    return date.getDate() === med.monthly_day;
  }
  return true;
}

function getWeekDays(): Date[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const today = new Date();
  const weekDays = getWeekDays();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [entries, setEntries] = useState<MedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patients = await getPatients(user.id);
      setEntries(buildEntries(patients));
    } catch (e) {
      console.error('Calendar: failed to load patients', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries]),
  );

  const selectedDay = weekDays.find((d) => d.getDate() === selectedDate) ?? today;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerDayNum}>{selectedDate}</Text>
          <Text style={styles.headerSub}>
            {DAY_NAMES[selectedDay.getDay()]} / {MONTH_NAMES[selectedDay.getMonth()]}{' '}
            {selectedDay.getFullYear()}
          </Text>
        </View>
        <Pressable style={styles.todayBtn} onPress={() => setSelectedDate(today.getDate())}>
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
      </View>

      {/* Weekly date strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((day, idx) => {
          const isSelected = day.getDate() === selectedDate;
          const isToday = day.getDate() === today.getDate();
          return (
            <Pressable
              key={idx}
              style={styles.dayItem}
              onPress={() => setSelectedDate(day.getDate())}
            >
              <Text style={[styles.dayLetter, isSelected && styles.dayLetterActive]}>
                {DAY_LETTERS[idx]}
              </Text>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
                <Text
                  style={[
                    styles.dayNum,
                    isToday && !isSelected && styles.dayNumToday,
                    isSelected && styles.dayNumActive,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={styles.colLabel}>TIME</Text>
        <Text style={[styles.colLabel, styles.colLabelMed]}>MEDICATION</Text>
        <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
      </View>

      {/* Medication list */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        (() => {
          const visibleEntries = entries.filter((med) => shouldShowOnDate(med, selectedDay));
          if (visibleEntries.length === 0) {
            return (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  {entries.length === 0
                    ? 'No medications scheduled.'
                    : 'No medications scheduled for this day.'}
                </Text>
                {entries.length === 0 && (
                  <Text style={styles.emptyHint}>Add medications from the Home tab.</Text>
                )}
              </View>
            );
          }
          return (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {visibleEntries.map((med) => (
            <View key={med.id} style={styles.entryRow}>
              <Text style={styles.entryTime}>{med.time || '—'}</Text>
              <View style={[styles.card, med.active && styles.cardActive]}>
                <View style={styles.cardTop}>
                  <Text
                    style={[styles.cardName, med.active && styles.whiteText]}
                    numberOfLines={1}
                  >
                    {med.patientName} - {med.name}
                  </Text>
                  <Pressable hitSlop={8}>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color={med.active ? TXT_ACTIVE : ALMOND_SILK}
                    />
                  </Pressable>
                </View>

                {!!med.description && (
                  <Text style={[styles.cardDescription, med.active && styles.whiteFaded]}>
                    {med.description}
                  </Text>
                )}

                {!!med.dose_description && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={14}
                      color={med.active ? TXT_ACTIVE : TXT_SECONDARY}
                    />
                    <Text style={[styles.metaText, med.active && styles.whiteFaded]}>
                      {med.dose_description}
                    </Text>
                  </View>
                )}

                {!!med.prescribed_by && (
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={med.active ? TXT_ACTIVE : TXT_SECONDARY}
                    />
                    <Text style={[styles.metaText, med.active && styles.whiteFaded]}>
                      {med.prescribed_by}
                    </Text>
                  </View>
                )}
              </View>
            </View>
              ))}
            </ScrollView>
          );
        })()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PARCHMENT },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerDayNum: {
    fontSize: 52,
    fontWeight: '800',
    color: TXT_PRIMARY,
    lineHeight: 56,
    letterSpacing: -1,
  },
  headerSub: { fontSize: 14, color: TXT_SECONDARY, fontWeight: '500', marginTop: 2 },
  todayBtn: {
    backgroundColor: ALMOND_CREAM,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    marginBottom: 6,
  },
  todayBtnText: { color: TXT_ACTIVE, fontWeight: '700', fontSize: 14 },

  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  dayItem: { alignItems: 'center', gap: 6, flex: 1 },
  dayLetter: { fontSize: 12, fontWeight: '600', color: TXT_SECONDARY },
  dayLetterActive: { color: ACCENT },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: ALMOND_CREAM },
  dayNum: { fontSize: 15, fontWeight: '600', color: TXT_PRIMARY },
  dayNumToday: { color: TXT_ACTIVE, fontWeight: '700' },
  dayNumActive: { color: TXT_ACTIVE, fontWeight: '700' },

  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: ALMOND_SILK,
  },
  colLabel: { fontSize: 11, fontWeight: '700', color: TXT_SECONDARY, letterSpacing: 0.6 },
  colLabelMed: { flex: 1, marginLeft: 52, marginRight: 6 },

  loader: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '600', color: TXT_PRIMARY },
  emptyHint: { fontSize: 14, color: TXT_SECONDARY },

  scroll: { flex: 1 },
  listContent: { padding: 16, gap: 14, paddingBottom: 48 },

  entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  entryTime: {
    width: 46,
    fontSize: 13,
    fontWeight: '600',
    color: TXT_SECONDARY,
    paddingTop: 18,
    textAlign: 'right',
    flexShrink: 0,
  },

  card: {
    flex: 1,
    backgroundColor: BONE,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: ALMOND_SILK,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardActive: { backgroundColor: ALMOND_SILK },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardName: { fontSize: 16, fontWeight: '700', color: TXT_PRIMARY, flex: 1 },
  cardDescription: { fontSize: 13, color: TXT_SECONDARY },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: TXT_SECONDARY, flex: 1 },

  whiteText: { color: TXT_PRIMARY },
  whiteFaded: { color: TXT_ACTIVE },
});
