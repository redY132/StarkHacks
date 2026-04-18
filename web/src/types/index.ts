import type { Timestamp } from "firebase/firestore";

/** 2D point in map / SLAM coordinates (meters). */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** Authenticated caregiver / operator profile (Firestore `users`). */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly createdAt: Timestamp;
}

/** Prescription / SKU metadata (referenced by schedules and shelf; may live in `medicines` later). */
export interface Medicine {
  readonly id: string;
  readonly name: string;
  readonly dosage: string;
  readonly unit: string;
  readonly notes?: string;
}

/** Face enrollment and verification metadata (embedded on patient or synced from robot). */
export interface FaceData {
  readonly enrolled: boolean;
  /** Path on Mini PC or opaque handle for the embedding file */
  readonly embeddingRef?: string;
  /** Firebase Storage path to enrollment photo */
  readonly enrollmentPhotoRef?: string;
  readonly lastVerifiedAt?: Timestamp;
  /** Optional quality score from enrollment pipeline */
  readonly qualityScore?: number;
}

/** Patient record (Firestore `patients`). */
export interface Patient {
  readonly id: string;
  /** Owning account for multi-tenant security rules */
  readonly userId: string;
  readonly name: string;
  readonly roomId: string;
  readonly face: FaceData;
  readonly medicineIds: readonly string[];
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
}

export type ScheduleRecurrence = "once" | "daily" | "weekly" | null;

export type ScheduleStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

/** Delivery / reminder schedule (Firestore `schedules`). */
export interface Schedule {
  readonly id: string;
  readonly userId: string;
  readonly patientId: string;
  readonly medicineId: string;
  readonly roomId: string;
  readonly startTime: Timestamp;
  readonly recurrence: ScheduleRecurrence;
  readonly status: ScheduleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
}

/** High-level robot lifecycle (mirrors on-robot state machine). */
export enum RobotState {
  IDLE = "IDLE",
  MAPPING = "MAPPING",
  MAP_READY = "MAP_READY",
  READY = "READY",
  DISPATCHED = "DISPATCHED",
  NAVIGATING = "NAVIGATING",
  ARRIVED = "ARRIVED",
  VERIFYING_FACE = "VERIFYING_FACE",
  DELIVERING = "DELIVERING",
  WAITING_FOR_FACE = "WAITING_FOR_FACE",
  RETURNING = "RETURNING",
  ERROR = "ERROR",
}

/** Room polygon derived from SLAM / map simplification. */
export interface Room {
  readonly id: string;
  readonly displayName: string;
  readonly polygon: readonly Point2D[];
  readonly patientIds: readonly string[];
  readonly floor: number;
}

/** Occupancy grid metadata; heavy grids often stored in Storage (`gridRef`). */
export interface MapData {
  readonly installationId: string;
  readonly floor: number;
  readonly occupancy: {
    readonly width: number;
    readonly height: number;
    readonly resolutionMeters: number;
    readonly origin: Point2D;
  };
  /** Cloud Storage path to raw SLAM grid binary */
  readonly gridRef?: string;
  /** Optional downsampled inline grid for UI (e.g. 0–100 occupancy confidence) */
  readonly cells?: readonly number[];
  readonly roomIds: readonly string[];
  readonly generatedAt: Timestamp;
}

export interface RobotPose {
  readonly x: number;
  readonly y: number;
  /** Heading in radians, map frame */
  readonly headingRadians: number;
}

export interface SlamObservation {
  readonly x: number;
  readonly y: number;
  readonly weight?: number;
}

/** Live robot feed (WebSocket / bridge); not necessarily persisted in Firestore. */
export interface RobotTelemetry {
  readonly robotId: string;
  readonly state: RobotState;
  readonly pose: RobotPose;
  readonly batteryPercent: number;
  readonly timestamp: string;
  readonly slamObservations?: readonly SlamObservation[];
  /** Populated during VERIFYING_FACE / WAITING_FOR_FACE */
  readonly faceMatchPatientId?: string | null;
  readonly faceConfidence?: number;
}
