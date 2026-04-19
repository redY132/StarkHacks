import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { MedicineEntry, Patient, Room, Schedule, ScheduleUpdate } from '@/types';

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  return uid;
}

function patientsCollection(firestore: Firestore, userId: string) {
  return collection(firestore, 'users', userId, 'patients');
}

function schedulesCollection(firestore: Firestore, userId: string) {
  return collection(firestore, 'users', userId, 'schedules');
}

function mapPatientDoc(id: string, data: DocumentData): Patient {
  return {
    id,
    name: String(data.name ?? ''),
    phone_number: String(data.phone_number ?? ''),
    faceEmbedding: Array.isArray(data.faceEmbedding)
      ? (data.faceEmbedding as number[])
      : [],
    faceEmbeddingModel: typeof data.faceEmbeddingModel === 'string'
      ? data.faceEmbeddingModel
      : undefined,
    medicines: Array.isArray(data.medicines)
      ? data.medicines.map((m): MedicineEntry =>
          typeof m === 'string'
            ? {
                name: m,
                description: '',
                dose_description: '',
                prescribed_by: '',
                time: '',
                days: [],
                repeat: 'Daily',
                monthly_day: 0,
              }
            : {
                name: String(m.name ?? ''),
                description: String(m.description ?? ''),
                dose_description: String(m.dose_description ?? ''),
                prescribed_by: String(m.prescribed_by ?? ''),
                time: String(m.time ?? ''),
                days: Array.isArray(m.days) ? m.days.map(String) : [],
                repeat: String(m.repeat ?? 'Daily'),
                monthly_day: typeof m.monthly_day === 'number' ? m.monthly_day : 0,
              },
        )
      : [],
  };
}

function mapScheduleDoc(id: string, data: DocumentData): Schedule {
  const timeRaw = data.time;
  const time =
    typeof timeRaw === 'string'
      ? timeRaw
      : timeRaw?.toDate?.()?.toISOString?.() ?? '';

  return {
    id,
    patientId: String(data.patientId ?? ''),
    medicineId: String(data.medicineId ?? ''),
    time,
    roomId: String(data.roomId ?? ''),
    status: (data.status ?? 'pending') as Schedule['status'],
  };
}

export async function getPatients(userId: string): Promise<Patient[]> {
  const snap = await getDocs(patientsCollection(db, userId));
  return snap.docs.map((d) => mapPatientDoc(d.id, d.data()));
}

export async function addPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
  const userId = requireUid();
  const ref = await addDoc(patientsCollection(db, userId), {
    ...patient,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...patient };
}

export async function getSchedules(userId: string): Promise<Schedule[]> {
  const snap = await getDocs(schedulesCollection(db, userId));
  return snap.docs.map((d) => mapScheduleDoc(d.id, d.data()));
}

export async function createSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
  const userId = requireUid();
  const ref = await addDoc(schedulesCollection(db, userId), {
    ...schedule,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...schedule };
}

export async function updateSchedule(
  scheduleId: string,
  data: ScheduleUpdate,
): Promise<void> {
  const userId = requireUid();
  const ref = doc(db, 'users', userId, 'schedules', scheduleId);
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const userId = requireUid();
  const ref = doc(db, 'users', userId, 'schedules', scheduleId);
  await deleteDoc(ref);
}

export async function deletePatient(patientId: string): Promise<void> {
  const userId = requireUid();
  const q = query(schedulesCollection(db, userId), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', userId, 'patients', patientId));
}

export async function getRooms(): Promise<Room[]> {
  const snap = await getDocs(collection(db, 'rooms'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: String(data.displayName ?? data.name ?? ''),
      polygonCoordinates: Array.isArray(data.polygon) ? data.polygon : [],
    };
  });
}

export async function updatePatientEmbedding(
  patientId: string,
  embedding: number[],
  model?: string,
): Promise<void> {
  const userId = requireUid();
  const ref = doc(db, 'users', userId, 'patients', patientId);
  await updateDoc(ref, {
    faceEmbedding: embedding,
    ...(model ? { faceEmbeddingModel: model } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function removePatientMedicine(
  patientId: string,
  medicineIndex: number,
): Promise<void> {
  const userId = requireUid();
  const ref = doc(db, 'users', userId, 'patients', patientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Patient not found');
  const medicines: unknown[] = Array.isArray(snap.data().medicines)
    ? [...(snap.data().medicines as unknown[])]
    : [];
  medicines.splice(medicineIndex, 1);
  await updateDoc(ref, { medicines, updatedAt: serverTimestamp() });
}

export async function updatePatientMedicines(
  patientId: string,
  entry: MedicineEntry,
): Promise<void> {
  const userId = requireUid();
  const ref = doc(db, 'users', userId, 'patients', patientId);
  await updateDoc(ref, {
    medicines: arrayUnion(entry),
    updatedAt: serverTimestamp(),
  });
}

export async function addRoom(name: string): Promise<Room> {
  const trimmed = name.trim();
  const ref = await addDoc(collection(db, 'rooms'), {
    name: trimmed,
    displayName: trimmed,
    polygon: [],
    patientIds: [],
    floor: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: trimmed, polygonCoordinates: [] };
}
