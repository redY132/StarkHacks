import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AddPatientModal from '@/components/home/AddPatientModal';
import PatientList from '@/components/home/PatientList';
import { useAuth } from '@/contexts/AuthProvider';
import { getPatients } from '@/lib/firestore';
import type { Patient } from '@/types';

const breadCharacter = require('../../assets/images/bread-character.png') as number;

function BreadIllustration() {
  return <Image source={breadCharacter} style={styles.bannerImage} resizeMode="contain" />;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removeMode, setRemoveMode] = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await getPatients(user.id);
      setPatients(p);
    } catch (e) {
      console.error('Failed to load home data', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Hero banner ── */}
      <LinearGradient
        colors={['#F5EBE0', '#E3D5CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEyebrow}>PANKO</Text>
          <Text style={styles.bannerHeadline}>
            Forget your{'\n'}breadcrumbs—{'\n'}just don't forget{'\n'}your medicine.
          </Text>
          <Text style={styles.bannerSub}>Autonomous med delivery</Text>
        </View>
        <View style={styles.bannerRight}>
          <BreadIllustration />
        </View>
      </LinearGradient>

      {/* ── Search + action buttons ── */}
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Search patients…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <View style={styles.headerBtns}>
          <Pressable style={styles.btn} onPress={() => setAddVisible(true)}>
            <Text style={styles.btnText}>+ Patient</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, removeMode && styles.btnDanger]}
            onPress={() => setRemoveMode((v) => !v)}
          >
            <Text style={[styles.btnText, removeMode && styles.btnDangerText]}>
              {removeMode ? 'Done' : 'Remove'}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <PatientList
          patients={patients}
          removeMode={removeMode}
          searchQuery={searchQuery}
          onPatientDeleted={(id) => setPatients((p) => p.filter((x) => x.id !== id))}
        />
      )}

      <AddPatientModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onPatientAdded={(patient) => {
          setPatients((p) => [...p, patient]);
          setAddVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDEDE9' },

  // ── Hero banner ──────────────────────────────────────────────────────────
  banner: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 210,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#D5BDAF',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 14,
  },
  bannerLeft: { flex: 1, paddingRight: 12 },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5C3D2E',
    letterSpacing: 2,
    marginBottom: 10,
  },
  bannerHeadline: {
    fontSize: 21,
    fontWeight: '800',
    color: '#3D2B1F',
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  bannerSub: {
    marginTop: 10,
    fontSize: 12,
    color: '#7C6B5E',
    fontWeight: '600',
  },
  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
  },
  bannerImage: {
    width: 130,
    height: 130,
  },

  // ── Search / controls ────────────────────────────────────────────────────
  header: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  search: {
    backgroundColor: '#F5EBE0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#D5BDAF',
    color: '#3D2B1F',
  },
  headerBtns: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#D6CCC2',
    borderWidth: 1,
    borderColor: '#D5BDAF',
  },
  btnText: { fontWeight: '600', fontSize: 13, color: '#3D2B1F' },
  btnDanger: { backgroundColor: '#E3D5CA', borderColor: '#D5BDAF' },
  btnDangerText: { color: '#5C3D2E' },

  loader: { flex: 1 },
});
