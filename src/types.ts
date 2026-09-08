/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  regNo: string;
  department: string;
  photoUrl: string;
  level?: string;
  phoneNumber?: string;
  registeredBiometrics: {
    face: boolean;
    fingerprint: boolean;
    devicePasskey: boolean;
  };
  faceFingerprintHash?: string;
  deviceCredentialId?: string;
  faceEncodings?: number[][];
  arcfaceEmbedding512?: number[];
  anonymizedTokenId?: string;
  encryptedFaceData?: string;
  registrationTimestamp?: string;
  registrationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  deviceId?: string; // Hardware device lock to prevent proxy marking
  gdprCompliant?: boolean;
}

export interface Course {
  code: string;
  title: string;
  department: string;
  lecturerName: string;
  semester?: 'First Semester' | 'Second Semester' | string;
  level?: '100 Level' | '200 Level' | '300 Level' | '400 Level' | '500 Level' | 'Postgraduate' | string;
  creditUnits?: number;
  academicSession?: string;
  status?: 'Compulsory' | 'Required' | 'Elective' | 'Inactive' | string;
  description?: string;
  dateAdded?: string;
}

export interface Lecturer {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  dateRegistered: string;
  password?: string;
}

export interface CourseRep {
  id: string;
  name: string;
  regNo: string;
  department: string;
  email: string;
  phone: string;
  level: string; // e.g. "400 Level"
  assignedCourseCode?: string;
  dateRegistered: string;
  password?: string;
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  date: string;
  startTime: string;
  endTime?: string;
  secureToken: string; // Dynamic secure code changing every 30 seconds to prevent link-sharing
  isActive: boolean;
  isCustomLocationLocked: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 500m
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  regNo: string;
  department: string;
  timestamp: string;
  biometricType: 'facial_recognition' | 'fingerprint_scan' | 'device_passkey';
  status: 'present' | 'late';
  locationInfo?: {
    campusName: string;
    distanceMeters: number;
    latitude: number;
    longitude: number;
    isWithinBounds: boolean;
  };
  authSnapshot?: string; // Captured photo during attendance verification
  lecturerId?: string; // Saved Lecturer ID
  date?: string; // Saved Date (e.g. YYYY-MM-DD or DD Month YYYY)
  time?: string; // Saved Time (e.g. HH:MM)
  confidenceScore?: number; // Saved Verification confidence score
  livenessScore?: number; // Active + Passive Liveness combined score
  livenessPassed?: boolean;
  matchAlgorithm?: string; // e.g. "ArcFace-512D Cosine"
  deviceId?: string; // Saved hardware device footprint
}

export interface CampusLocation {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const COOU_CAMPUSES: CampusLocation[] = [
  {
    name: "Uli Campus (Computer Science Dept)",
    latitude: 5.7725,
    longitude: 6.8778,
    radiusMeters: 1000
  }
];

export interface VerificationAuditLog {
  id: string;
  timestamp: string;
  studentName: string;
  studentIdOrReg?: string;
  scanType: 'FACIAL' | 'FINGERPRINT' | 'PASSKEY';
  status: 'SUCCESS' | 'MISMATCH' | 'FAILED';
  errorMessage?: string;
  challengeAction?: string;
}

