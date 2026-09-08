/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import StudentPortal from './components/StudentPortal';
import LecturerDashboard from './components/LecturerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthGate from './components/AuthGate';
import { Student, Course, AttendanceSession, AttendanceRecord, Lecturer, CourseRep, VerificationAuditLog } from './types';
import { ShieldAlert, BookOpen, Fingerprint, Award, CheckSquare, HelpCircle, Loader2 } from 'lucide-react';
import {
  getStudentsFromDb,
  saveStudentToDb,
  deleteStudentFromDb,
  getCoursesFromDb,
  saveCourseToDb,
  deleteCourseFromDb,
  deleteAllCoursesFromDb,
  getLecturersFromDb,
  saveLecturerToDb,
  deleteLecturerFromDb,
  getCourseRepsFromDb,
  saveCourseRepToDb,
  deleteCourseRepFromDb,
  getSessionsFromDb,
  saveSessionToDb,
  getRecordsFromDb,
  saveRecordToDb,
  deleteRecordFromDb,
  getAuditLogsFromDb,
  saveAuditLogToDb,
  subscribeToSyncStatus,
  SyncStatus,
} from './api';

export default function App() {
  const [authUser, setAuthUser] = useState<{ role: 'admin' | 'lecturer' | 'student'; name: string; identifier: string } | null>(() => {
    try {
      const saved = localStorage.getItem('coou_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<'student' | 'lecturer' | 'admin'>(() => {
    try {
      const saved = localStorage.getItem('coou_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role;
      }
    } catch (e) {}
    return 'student';
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courseReps, setCourseReps] = useState<CourseRep[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(142); 
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    lastSyncedAt: null
  });

  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>([]);

  // Audit logs are loaded from Neon inside loadData() below

  const handleAddAuditLog = (log: Omit<VerificationAuditLog, 'id' | 'timestamp'>) => {
    const newLog: VerificationAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToDb(newLog).catch(err => console.error("Failed to save audit log", err));
  };

  useEffect(() => {
    return subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
  }, []);

  // Load all data from Neon PostgreSQL on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setDbLoading(true);
        const [
          fbStudents,
          fbCourses,
          fbSessions,
          fbRecords,
          fbLecturers,
          fbCourseReps,
          fbAuditLogs,
        ] = await Promise.all([
          getStudentsFromDb(),
          getCoursesFromDb(),
          getSessionsFromDb(),
          getRecordsFromDb(),
          getLecturersFromDb(),
          getCourseRepsFromDb(),
          getAuditLogsFromDb(),
        ]);

        setStudents(fbStudents);
        setCourses(fbCourses);
        setSessions(fbSessions);
        setRecords(fbRecords);
        setLecturers(fbLecturers);
        setCourseReps(fbCourseReps);
        setAuditLogs(fbAuditLogs);
        setOnlineCount(142 + fbStudents.length);
      } catch (err) {
        console.error("Database load failure:", err);
      } finally {
        setDbLoading(false);
      }
    };

    loadData();
  }, []);

  // Real-time synchronization background polling (checks for new attendance records every 3 seconds)
  useEffect(() => {
    let active = true;
    const pollRealtimeUpdates = async () => {
      try {
        const latestSessions = await getSessionsFromDb();
        const latestRecords = await getRecordsFromDb();
        
        if (!active) return;

        // Check for genuine modifications to minimize re-renders
        setSessions(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(latestSessions)) {
            console.log("[Sync Hook] Synced latest lecture sessions in real time.");
            return latestSessions;
          }
          return prev;
        });

        setRecords(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(latestRecords)) {
            console.log("[Sync Hook] Synced latest attendance logs in real time.");
            return latestRecords;
          }
          return prev;
        });
      } catch (err) {
        console.error("[Sync Hook] Error polling real-time updates:", err);
      }
    };

    const interval = setInterval(pollRealtimeUpdates, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Student registration controller
  const handleRegisterStudent = async (newStudent: Student) => {
    const updated = [...students, newStudent];
    setStudents(updated);
    setOnlineCount(prev => prev + 1);
    try {
      await saveStudentToDb(newStudent);
    } catch (e) {
      console.error("Failed to register student to database", e);
    }
  };

  // Student deletion controller
  const handleDeleteStudent = async (studentId: string) => {
    const updated = students.filter(s => s.id !== studentId);
    setStudents(updated);
    setOnlineCount(prev => Math.max(142, prev - 1));
    try {
      await deleteStudentFromDb(studentId);
    } catch (e) {
      console.error("Failed to delete student from database", e);
    }
  };

  // Student update controller
  const handleUpdateStudent = async (updatedStudent: Student) => {
    const updated = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(updated);
    try {
      await saveStudentToDb(updatedStudent);
    } catch (e) {
      console.error("Failed to update student in database", e);
    }
  };

  // Student mark attendance log controller
  const handleMarkAttendance = async (newRecord: AttendanceRecord) => {
    // Prevent duplicate entries for same session and student
    const exists = records.some(
      r => r.studentId === newRecord.studentId && r.sessionId === newRecord.sessionId
    );
    if (exists) return;

    // Enforce single attendance per day per course
    const todayYMD = new Date().toISOString().split('T')[0];
    const hasAlreadyAttendedToday = records.some(r => {
      const recordYMD = r.timestamp.split('T')[0];
      return r.studentId === newRecord.studentId && 
             r.courseCode === newRecord.courseCode && 
             recordYMD === todayYMD;
    });

    if (hasAlreadyAttendedToday) {
      throw new Error(`Daily course gating restriction lock: You have already marked attendance for ${newRecord.courseCode} today.`);
    }

    const updated = [newRecord, ...records];
    setRecords(updated);
    try {
      await saveRecordToDb(newRecord);
    } catch (e) {
      console.error("Failed to mark attendance in database", e);
    }
  };

  const handleDeleteAttendance = async (recordId: string) => {
    const updated = records.filter(r => r.id !== recordId);
    setRecords(updated);
    try {
      await deleteRecordFromDb(recordId);
    } catch (e) {
      console.error("Failed to delete attendance record", e);
    }
  };

  // Start course session controller
  const handleStartSession = async (newSession: AttendanceSession) => {
    // Shut down previous active sessions of the same course
    const shutDownPrevious = sessions.map(s => {
      if (s.courseCode === newSession.courseCode && s.isActive) {
        const closed = { ...s, isActive: false, endTime: new Date().toTimeString().slice(0, 5) };
        saveSessionToDb(closed).catch(console.error);
        return closed;
      }
      return s;
    });

    const updated = [newSession, ...shutDownPrevious];
    setSessions(updated);
    try {
      await saveSessionToDb(newSession);
    } catch (e) {
      console.error("Failed to start session in database", e);
    }
  };

  // Stop course session controller
  const handleStopSession = async (sessionId: string) => {
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        const closed = { ...s, isActive: false, endTime: new Date().toTimeString().slice(0, 5) };
        saveSessionToDb(closed).catch(console.error);
        return closed;
      }
      return s;
    });
    setSessions(updated);
  };

  // Lecturer enrollment controllers
  const handleRegisterLecturer = async (newLec: Lecturer) => {
    const updated = [...lecturers, newLec];
    setLecturers(updated);
    try {
      await saveLecturerToDb(newLec);
    } catch (e) {
      console.error("Failed to save lecturer to database", e);
    }
  };

  const handleDeleteLecturer = async (id: string) => {
    const updated = lecturers.filter(l => l.id !== id);
    setLecturers(updated);
    try {
      await deleteLecturerFromDb(id);
    } catch (e) {
      console.error("Failed to delete lecturer from database", e);
    }
  };

  // Course registration and semester offering controllers
  const handleRegisterCourse = async (newCourse: Course) => {
    const updated = [...courses.filter(c => c.code !== newCourse.code), newCourse];
    setCourses(updated);
    try {
      await saveCourseToDb(newCourse);
    } catch (e) {
      console.error("Failed to save course to database", e);
    }
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    const updated = courses.map(c => c.code === updatedCourse.code ? updatedCourse : c);
    setCourses(updated);
    try {
      await saveCourseToDb(updatedCourse);
    } catch (e) {
      console.error("Failed to update course in database", e);
    }
  };

  const handleDeleteCourse = async (courseCode: string) => {
    const updated = courses.filter(c => c.code !== courseCode);
    setCourses(updated);
    try {
      await deleteCourseFromDb(courseCode);
    } catch (e) {
      console.error("Failed to delete course from database", e);
    }
  };

  const handleDeleteAllCourses = async () => {
    setCourses([]);
    try {
      await deleteAllCoursesFromDb();
    } catch (e) {
      console.error("Failed to delete all courses from database", e);
    }
  };

  // Course Rep enrollment controllers
  const handleRegisterCourseRep = async (newRep: CourseRep) => {
    const updated = [...courseReps, newRep];
    setCourseReps(updated);
    try {
      await saveCourseRepToDb(newRep);
    } catch (e) {
      console.error("Failed to save course rep to database", e);
    }
  };

  const handleDeleteCourseRep = async (id: string) => {
    const updated = courseReps.filter(r => r.id !== id);
    setCourseReps(updated);
    try {
      await deleteCourseRepFromDb(id);
    } catch (e) {
      console.error("Failed to delete course rep from database", e);
    }
  };

  const handleAuthenticate = (user: { role: 'admin' | 'lecturer' | 'student'; name: string; identifier: string }) => {
    setAuthUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('coou_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    setAuthUser(null);
    try {
      localStorage.removeItem('coou_auth_user');
    } catch (e) {
      console.error(e);
    }
  };

  if (!authUser) {
    return (
      <AuthGate
        onAuthenticate={handleAuthenticate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-900" id="coou-app-root">
      
      {/* Header Banner Header */}
      <Navbar 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole} 
        onlineCount={onlineCount} 
        authUser={authUser}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 pb-12">
        
        {/* HERO TITLE MODULE BAR - INTENTIONAL PAIRINGS & HIGHEST AESTHETICS */}
        <section className="relative mx-auto max-w-7xl px-4 pt-8 md:px-6 lg:px-8" id="coou-hero-header">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border border-blue-800/20 p-6 md:p-8 shadow-xl">
            
            {/* Ambient gold laser line effects overlay */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-1.5 rounded bg-blue-500/15 px-3 py-1 text-xs border border-blue-500/25 text-blue-200">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold tracking-wide uppercase font-mono">FIDO2 SECURED • INSTITUTIONAL ATTENDANCE PERIMETER</span>
              </div>

              <h2 className="text-2xl font-black md:text-3xl tracking-tight text-white uppercase">
                COOU Attendance <span className="text-amber-400">Assurance</span> Terminal
              </h2>

              <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-2xl">
                Welcome to the official Smart Student Attendance system of <strong className="text-amber-200">Chukwuemeka Odumegwu Ojukwu University</strong>. 
                Our platform enforces high-fidelity biometric safeguards via <strong>live webcam facial scanning</strong> combined with 
                <strong>restricted campus GPS boundaries</strong>. Access is strictly authorized for internal <strong>Lecturers and Course Representatives</strong> 
                to coordinate verified student gating and completely eliminate proxy check-ins and student impersonation.
              </p>

              {/* Campus Bullet Tags */}
              <div className="flex max-w-lg pt-2 text-[10px] uppercase font-mono font-bold text-blue-300">
                <div className="flex items-center space-x-2 bg-blue-950/80 px-3.5 py-2 rounded-lg border border-amber-500/30">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 absolute" />
                  <span className="text-white font-black tracking-wider">ULI CAMPUS (COMPUTER SCIENCE DEPT)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CORE INTERACTIVE STAGES ROLE BASED SWITCHER */}
        <section className="relative overflow-hidden w-full">
          <AnimatePresence mode="wait">
            {currentRole === 'student' && (authUser?.role === 'student' || authUser?.role === 'admin') ? (
              <motion.div
                key="student-portal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <StudentPortal 
                  students={students}
                  onRegisterStudent={handleRegisterStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onUpdateStudent={handleUpdateStudent}
                  activeSessions={sessions}
                  onMarkAttendance={handleMarkAttendance}
                  courses={courses}
                  records={records}
                  onAddAuditLog={handleAddAuditLog}
                  lecturers={lecturers}
                />
              </motion.div>
            ) : currentRole === 'lecturer' && (authUser?.role === 'lecturer' || authUser?.role === 'admin') ? (
              <motion.div
                key="lecturer-dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <LecturerDashboard 
                  students={students}
                  courses={courses}
                  activeSessions={sessions}
                  onStartSession={handleStartSession}
                  onStopSession={handleStopSession}
                  records={records}
                  onMarkAttendance={handleMarkAttendance}
                  onDeleteAttendance={handleDeleteAttendance}
                />
              </motion.div>
            ) : currentRole === 'admin' && authUser?.role === 'admin' ? (
              <motion.div
                key="admin-dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <AdminDashboard
                  courses={courses}
                  onRegisterCourse={handleRegisterCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onDeleteAllCourses={handleDeleteAllCourses}
                  lecturers={lecturers}
                  onRegisterLecturer={handleRegisterLecturer}
                  onDeleteLecturer={handleDeleteLecturer}
                  courseReps={courseReps}
                  onRegisterCourseRep={handleRegisterCourseRep}
                  onDeleteCourseRep={handleDeleteCourseRep}
                  auditLogs={auditLogs}
                />
              </motion.div>
            ) : (
              <motion.div
                key="privilege-violation-warning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4"
                id="privilege-violation-warning"
              >
                <div className="h-16 w-16 bg-red-100 text-red-900 rounded-full flex items-center justify-center mx-auto shadow border border-red-200">
                  <ShieldAlert className="h-8 w-8 text-red-900" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-rose-800">Role Privilege Boundary Violation</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Security level mismatch. Your current registered IAM credential under <strong className="text-slate-800">"{authUser?.identifier}"</strong> is not authorized 
                  to explore pages outside of its certified boundary.
                </p>
                <button
                  onClick={handleSignOut}
                  className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg border border-amber-200 transition"
                >
                  Return & Use Another Identity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Elegant Standard humble footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-1">
          <p>© 2026 Chukwuemeka Odumegwu Ojukwu University. All Rights Reserved.</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Smart Attendance Verification Assurance Terminal // System v4.92</p>
        </div>
      </footer>

      {/* Dynamic Offline / Auto-Sync Indicator Panel */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-xs sm:max-w-sm pointer-events-none" id="coou-sync-indicator-wrapper">
        {!syncStatus.isOnline ? (
          <div className="pointer-events-auto flex items-center space-x-2.5 rounded-xl bg-slate-900 border border-amber-500/40 px-4 py-3 text-white shadow-2xl animate-pulse">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
            </span>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 leading-none">Offline Mode Enabled</p>
              <p className="text-[10px] text-slate-300 font-semibold mt-1 leading-tight">
                {syncStatus.pendingCount > 0 
                  ? `Caching ${syncStatus.pendingCount} record(s) locally.`
                  : "All records cached. Auto-sync triggers when online."}
              </p>
            </div>
          </div>
        ) : syncStatus.pendingCount > 0 ? (
          <div className="pointer-events-auto flex items-center space-x-2.5 rounded-xl bg-slate-900 border border-green-500/35 px-4 py-3 text-white shadow-2xl">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent shrink-0" />
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-wider text-green-400 leading-none">Syncing Data...</p>
              <p className="text-[10px] text-slate-300 font-semibold mt-1 leading-tight">
                Transferring {syncStatus.pendingCount} buffered record(s) to cloud-secure database.
              </p>
            </div>
          </div>
        ) : syncStatus.lastSyncedAt ? (
          <div className="pointer-events-auto flex items-center space-x-1.5 rounded bg-slate-900/90 border border-emerald-500/20 px-2.5 py-1 text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[9px] font-mono text-slate-300 select-none">
              Synced: {syncStatus.lastSyncedAt}
            </span>
          </div>
        ) : null}
      </div>

    </div>
  );
}
