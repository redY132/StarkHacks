import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addPatient } from '@/lib/firestore';
import type { Patient } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPatientAdded: (patient: Patient) => void;
};

export default function AddPatientModal({ visible, onClose, onPatientAdded }: Props) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setPhoneNumber('');
    setPhoto(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function pickPhoto(source: 'camera' | 'library') {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Camera access denied', 'Enable camera access in Settings to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' });
      }
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Photo library access denied', 'Enable photo library access in Settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' });
      }
    }
  }

  async function handleSubmit() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (!phoneNumber.trim()) { Alert.alert('Phone number required'); return; }

    setSaving(true);
    try {
      const patient = await addPatient({
        name: name.trim(),
        phone_number: phoneNumber.trim(),
        faceEmbedding: [],
        medicines: [],
      });

      onPatientAdded(patient);
      handleClose();
    } catch (e) {
      console.error('AddPatientModal: failed to save patient', e);
      Alert.alert('Error', 'Failed to save patient. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Add Patient</Text>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Patient name"
                placeholderTextColor="#7C6B5E"
                autoCapitalize="words"
              />

              {/* Phone Number */}
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.iconInput}>
                <Ionicons name="call-outline" size={18} color="#7C6B5E" />
                <TextInput
                  style={styles.iconInputField}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="e.g. +1 (555) 123-4567"
                  placeholderTextColor="#7C6B5E"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>

              {/* Medicine Photo (optional) */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Medicine Photo</Text>
                <Text style={styles.optional}>(optional)</Text>
              </View>
              <View style={styles.photoRow}>
                <Pressable style={styles.photoBtn} onPress={() => void pickPhoto('camera')}>
                  <Text style={styles.photoBtnText}>Camera</Text>
                </Pressable>
                <Pressable style={styles.photoBtn} onPress={() => void pickPhoto('library')}>
                  <Text style={styles.photoBtnText}>Library</Text>
                </Pressable>
              </View>
              {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}

              <Pressable
                style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                onPress={() => void handleSubmit()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Add Patient</Text>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kavWrapper: { flex: 1, justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F5EBE0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5BDAF',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: '#3D2B1F' },
  form: { gap: 2, paddingBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#7C6B5E', marginTop: 16, marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 16, marginBottom: 6 },
  optional: { fontSize: 12, color: '#7C6B5E', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#D5BDAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#3D2B1F',
    backgroundColor: '#E3D5CA',
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D5BDAF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#E3D5CA',
  },
  iconInputField: { flex: 1, fontSize: 16, color: '#3D2B1F' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5BDAF',
    alignItems: 'center',
    backgroundColor: '#E3D5CA',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: '#3D2B1F' },
  preview: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#5C3D2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#F5EBE0', fontSize: 16, fontWeight: '700' },
});
