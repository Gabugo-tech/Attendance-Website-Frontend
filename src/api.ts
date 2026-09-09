/**
 * COOU Attendance System — API Client
 * Thin fetch wrapper that talks to the Express/Neon backend.
 * Replaces the old firebase.ts — all data now lives in Neon PostgreSQL.
 */

import {
  Student,
  Course,
  AttendanceSession,
  AttendanceRecord,
  Lecturer,
  CourseRep,
  VerificationAuditLog,
} from './types';

// ---------------------------------------------------------------------------
// Sync-status helpers (kept for backwards compat with App.tsx subscribers)
// ---------------------------------------------------------------------------
export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
}

let syncStatusListeners: ((s: SyncStatus) => void)[] = [];

function getSyncStatus(): SyncStatus {
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,       // Neon is always-online — no pending queue needed
    lastSyncedAt: null,
  };
}

export function subscribeToSyncStatus(listener: (s: SyncStatus) => void) {
  syncStatusListeners.push(listener);
  listener(getSyncStatus());

  const onOnline  = () => syncStatusListeners.forEach(l => l(getSyncStatus()));
  const onOffline = () => syncStatusListeners.forEach(l => l({ ...getSyncStatus(), isOnline: false }));

  if (typeof window !== 'undefined') {
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
  }

  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    }
  };
}

// ---------------------------------------------------------------------------
// Base URL
// In dev, Vite proxies /api/* to localhost:3000, so base is empty.
// In production, VITE_API_BASE_URL points to the deployed backend on Vercel.
// ---------------------------------------------------------------------------
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

// ---------------------------------------------------------------------------
// Base fetch helper
// ---------------------------------------------------------------------------
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
export async function loginUser(
  credential: string,
  password: string
): Promise<{ role: 'admin' | 'lecturer' | 'student'; name: string; identifier: string }> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential, password }),
  });
}

// ---------------------------------------------------------------------------
// STUDENTS
// ---------------------------------------------------------------------------
export async function getStudentsFromDb(): Promise<Student[]> {
  return apiFetch<Student[]>('/api/students');
}

export async function saveStudentToDb(student: Student): Promise<void> {
  await apiFetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(student),
  });
}

export async function deleteStudentFromDb(studentId: string): Promise<void> {
  await apiFetch(`/api/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// COURSES
// ---------------------------------------------------------------------------
export async function getCoursesFromDb(): Promise<Course[]> {
  return apiFetch<Course[]>('/api/courses');
}

export async function saveCourseToDb(course: Course): Promise<void> {
  await apiFetch('/api/courses', {
    method: 'POST',
    body: JSON.stringify(course),
  });
}

export async function deleteCourseFromDb(courseCode: string): Promise<void> {
  await apiFetch(`/api/courses/${encodeURIComponent(courseCode)}`, { method: 'DELETE' });
}

export async function deleteAllCoursesFromDb(): Promise<void> {
  await apiFetch('/api/courses', { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// LECTURERS
// ---------------------------------------------------------------------------
export async function getLecturersFromDb(): Promise<Lecturer[]> {
  return apiFetch<Lecturer[]>('/api/lecturers');
}

export async function saveLecturerToDb(lecturer: Lecturer): Promise<void> {
  await apiFetch('/api/lecturers', {
    method: 'POST',
    body: JSON.stringify(lecturer),
  });
}

export async function deleteLecturerFromDb(id: string): Promise<void> {
  await apiFetch(`/api/lecturers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// COURSE REPS
// ---------------------------------------------------------------------------
export async function getCourseRepsFromDb(): Promise<CourseRep[]> {
  return apiFetch<CourseRep[]>('/api/course-reps');
}

export async function saveCourseRepToDb(rep: CourseRep): Promise<void> {
  await apiFetch('/api/course-reps', {
    method: 'POST',
    body: JSON.stringify(rep),
  });
}

export async function deleteCourseRepFromDb(id: string): Promise<void> {
  await apiFetch(`/api/course-reps/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// SESSIONS
// ---------------------------------------------------------------------------
export async function getSessionsFromDb(): Promise<AttendanceSession[]> {
  return apiFetch<AttendanceSession[]>('/api/sessions');
}

export async function saveSessionToDb(session: AttendanceSession): Promise<void> {
  await apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

// ---------------------------------------------------------------------------
// RECORDS
// ---------------------------------------------------------------------------
export async function getRecordsFromDb(): Promise<AttendanceRecord[]> {
  return apiFetch<AttendanceRecord[]>('/api/records');
}

export async function saveRecordToDb(record: AttendanceRecord): Promise<void> {
  await apiFetch('/api/records', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function deleteRecordFromDb(recordId: string): Promise<void> {
  await apiFetch(`/api/records/${encodeURIComponent(recordId)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------------------------
export async function getAuditLogsFromDb(): Promise<VerificationAuditLog[]> {
  return apiFetch<VerificationAuditLog[]>('/api/audit-logs');
}

export async function saveAuditLogToDb(log: VerificationAuditLog): Promise<void> {
  await apiFetch('/api/audit-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

// ---------------------------------------------------------------------------
// Kept for any legacy import — no longer meaningful with Neon
// ---------------------------------------------------------------------------
export const isMockFirebase = false;
