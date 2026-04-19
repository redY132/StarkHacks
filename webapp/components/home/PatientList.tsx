import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deletePatient } from '@/lib/firestore';
import type { Patient } from '@/types';

type Props = {
  patients: Patient[];
  removeMode: boolean;
  searchQuery: string;
  onPatientDeleted: (id: string) => void;
};

export default function PatientList({
  patients,
  removeMode,
  searchQuery,
  onPatientDeleted,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirmDelete(patient: Patient) {
    Alert.alert(
      'Remove Patient',
      `Remove ${patient.name}? This will also delete their schedules.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void handleDelete(patient) },
      ],
    );
  }

  async function handleDelete(patient: Patient) {
    setDeleting(patient.id);
    try {
      await deletePatient(patient.id);
      onPatientDeleted(patient.id);
    } catch {
      Alert.alert('Error', 'Failed to remove patient.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.content}>
      {filtered.length === 0 && (
        <Text style={styles.empty}>No patients found.</Text>
      )}
      {filtered.map((patient) => {
        const isExpanded = expanded.has(patient.id);
        const isDeleting = deleting === patient.id;
        return (
          <View key={patient.id} style={styles.row}>
            <Pressable style={styles.rowHeader} onPress={() => toggle(patient.id)}>
              <View style={styles.info}>
                <Text style={styles.name}>{patient.name}</Text>
              </View>
              <View style={styles.rowRight}>
                {removeMode && (
                  <Pressable
                    style={[styles.delIcon, isDeleting && styles.delIconDisabled]}
                    onPress={() => confirmDelete(patient)}
                    disabled={isDeleting}
                    hitSlop={8}
                  >
                    <Text style={styles.delIconText}>✕</Text>
                  </Pressable>
                )}
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>MEDICATIONS</Text>
                {patient.medicines.length === 0 ? (
                  <Text style={styles.detailValue}>No medications assigned</Text>
                ) : (
                  patient.medicines.map((m, i) => (
                    <View key={i} style={styles.medItem}>
                      <Text style={styles.medName}>{m.name}</Text>
                      {!!m.description && (
                        <Text style={styles.medDesc}>{m.description}</Text>
                      )}
                    </View>
                  ))
                )}

                <Pressable
                  style={styles.addMedBtn}
                  onPress={() => router.push(`/add-medication?patientId=${patient.id}`)}
                >
                  <Text style={styles.addMedBtnText}>+ Add Medication</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { color: '#7C6B5E', textAlign: 'center', marginTop: 32, fontSize: 15 },
  row: {
    backgroundColor: '#D6CCC2',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#D5BDAF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 14,
    minHeight: 88,
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#3D2B1F', letterSpacing: -0.2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  delIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delIconDisabled: { opacity: 0.4 },
  delIconText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  chevron: { color: '#7C6B5E', fontSize: 12 },
  detail: {
    borderTopWidth: 1,
    borderTopColor: '#D5BDAF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 4,
    backgroundColor: '#E3D5CA',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C6B5E',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 6,
  },
  detailValue: { fontSize: 14, color: '#3D2B1F' },
  medItem: { marginBottom: 10 },
  medName: { fontSize: 15, fontWeight: '700', color: '#3D2B1F' },
  medDesc: { fontSize: 13, color: '#7C6B5E', marginTop: 2 },
  addMedBtn: {
    marginTop: 10,
    backgroundColor: '#F5EBE0',
    borderWidth: 1,
    borderColor: '#D5BDAF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addMedBtnText: { fontSize: 14, fontWeight: '600', color: '#5C3D2E' },
});
