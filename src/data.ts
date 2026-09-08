/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Course, AttendanceRecord, AttendanceSession } from './types';

// Pre-populated Courses at COOU (Empty roster by default - courses registered via admin dashboard)
export const SEED_COURSES: Course[] = [];

// Pre-populated Students at COOU (Empty roster by default - students register via biometric registration portal)
export const SEED_STUDENTS: Student[] = [];

// Helper to generate seed sessions and simulation attendance logs from the last 7 days
export function generateSeedSessionsAndRecords(): { sessions: AttendanceSession[], records: AttendanceRecord[] } {
  const sessions: AttendanceSession[] = [];
  const records: AttendanceRecord[] = [];

  if (SEED_COURSES.length === 0) {
    return { sessions, records };
  }

  const now = new Date();

  // Create 5 completed sessions
  const pastSessionsData = [
    { offsetDays: 5, course: SEED_COURSES[0], startTime: "09:00", campus: "Uli Campus (Computer Science Dept)", lat: 5.7725, lon: 6.8778 },
    { offsetDays: 4, course: SEED_COURSES[1], startTime: "11:30", campus: "Uli Campus (Computer Science Dept)", lat: 5.7725, lon: 6.8778 },
    { offsetDays: 3, course: SEED_COURSES[2], startTime: "14:00", campus: "Uli Campus (Computer Science Dept)", lat: 5.7725, lon: 6.8778 },
    { offsetDays: 2, course: SEED_COURSES[3], startTime: "10:00", campus: "Uli Campus (Computer Science Dept)", lat: 5.7725, lon: 6.8778 },
    { offsetDays: 1, course: SEED_COURSES[4], startTime: "12:00", campus: "Uli Campus (Computer Science Dept)", lat: 5.7725, lon: 6.8778 }
  ];

  pastSessionsData.forEach((data, index) => {
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() - data.offsetDays);
    const dateStr = sessionDate.toISOString().split('T')[0];

    const sessionId = `ses-past-${index}`;
    const session: AttendanceSession = {
      id: sessionId,
      courseCode: data.course.code,
      date: dateStr,
      startTime: data.startTime,
      endTime: `${parseInt(data.startTime.split(':')[0]) + 2}:00`,
      secureToken: Math.floor(100000 + Math.random() * 900000).toString(),
      isActive: false,
      isCustomLocationLocked: true,
      latitude: data.lat,
      longitude: data.lon,
      radiusMeters: 500
    };
    sessions.push(session);

    // Generate records for students matching the course department or general computer science kids who take it
    SEED_STUDENTS.forEach((student) => {
      // 85% probability of attendance
      if (Math.random() < 0.85) {
        // Compute random timestamp within duration
        const recordTime = new Date(sessionDate);
        const startHour = parseInt(data.startTime.split(':')[0]);
        recordTime.setHours(startHour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        const isLate = recordTime.getMinutes() > 20;

        records.push({
          id: `rec-${sessionId}-${student.id}`,
          sessionId,
          courseCode: data.course.code,
          studentId: student.id,
          studentName: student.name,
          regNo: student.regNo,
          department: student.department,
          timestamp: recordTime.toISOString(),
          biometricType: Math.random() > 0.5 ? 'facial_recognition' : 'fingerprint_scan',
          status: isLate ? 'late' : 'present',
          locationInfo: {
            campusName: data.campus,
            distanceMeters: Math.floor(Math.random() * 250),
            latitude: data.lat + (Math.random() - 0.5) * 0.001,
            longitude: data.lon + (Math.random() - 0.5) * 0.001,
            isWithinBounds: true
          },
          authSnapshot: student.photoUrl // Preloaded snapshot matching the student photo
        });
      }
    });
  });

  return { sessions, records };
}

// Haversine formula to compute distance in meters between two GPS coordinates
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}
