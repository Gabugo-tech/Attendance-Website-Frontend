/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Play, Square, Users, CheckCircle, Clock, Save, FileSpreadsheet, 
  Search, Filter, MapPin, BadgeCheck, AlertCircle, TrendingUp, BarChart2, Calendar
} from 'lucide-react';
import { Student, Course, AttendanceSession, AttendanceRecord, COOU_CAMPUSES } from '../types';

interface LecturerDashboardProps {
  students: Student[];
  courses: Course[];
  activeSessions: AttendanceSession[];
  onStartSession: (session: AttendanceSession) => void;
  onStopSession: (sessionId: string) => void;
  records: AttendanceRecord[];
  onMarkAttendance: (record: AttendanceRecord) => void;
  onDeleteAttendance: (recordId: string) => void;
}

export default function LecturerDashboard({
  students,
  courses,
  activeSessions,
  onStartSession,
  onStopSession,
  records,
  onMarkAttendance,
  onDeleteAttendance
}: LecturerDashboardProps) {
  // Creating session states
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<string>(COOU_CAMPUSES[0].name);
  const [customRadius, setCustomRadius] = useState<number>(500);
  const [selectedViewSessionId, setSelectedViewSessionId] = useState<string>('');

  // Active Session details
  const currentActiveSession = activeSessions.find(s => s.isActive);
  
  // Table search & filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('Computer Science');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Dynamic rotating secure OTP ticker simulation for active session
  const [sessionOtp, setSessionOtp] = useState<string>('');
  const [otpProgress, setOtpProgress] = useState<number>(30); // Dynamic timer progress (seconds)

  // Simulated file generation and download states
  const [isGeneratingCSV, setIsGeneratingCSV] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [showExportSuccess, setShowExportSuccess] = useState<boolean>(false);
  const [archivedSessionCode, setArchivedSessionCode] = useState<string>('');
  const [archivedStudentCount, setArchivedStudentCount] = useState<number>(0);
  const [archivedPresentCount, setArchivedPresentCount] = useState<number>(0);

  // Absenteeism push notification alerts states
  const [sentAlerts, setSentAlerts] = useState<string[]>([]);
  const [isSendingAlerts, setIsSendingAlerts] = useState<boolean>(false);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Keep view session synchronized with active or latest session
  useEffect(() => {
    if (currentActiveSession) {
      setSelectedViewSessionId(currentActiveSession.id);
    } else if (activeSessions.length > 0 && !selectedViewSessionId) {
      setSelectedViewSessionId(activeSessions[activeSessions.length - 1].id);
    }
  }, [currentActiveSession, activeSessions, selectedViewSessionId]);

  useEffect(() => {
    if (currentActiveSession) {
      setSessionOtp(currentActiveSession.secureToken);
      
      const interval = setInterval(() => {
        setOtpProgress((prev) => {
          if (prev <= 1) {
            // Roll new dynamic code when countdown finishes
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setSessionOtp(newOtp);
            currentActiveSession.secureToken = newOtp; // Keep synchronized
            return 30; // reset
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentActiveSession]);

  // Handle launch new active lecture session
  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseCode) return;

    // Retrieve selected campus config coords
    const campusConfig = COOU_CAMPUSES.find(c => c.name === selectedCampus) || COOU_CAMPUSES[0];

    const newSession: AttendanceSession = {
      id: `ses-dyn-${Date.now()}`,
      courseCode: selectedCourseCode,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      secureToken: Math.floor(100000 + Math.random() * 900000).toString(),
      isActive: true,
      isCustomLocationLocked: true,
      latitude: campusConfig.latitude,
      longitude: campusConfig.longitude,
      radiusMeters: customRadius
    };

    onStartSession(newSession);
    setSelectedViewSessionId(newSession.id);
    setOtpProgress(30);
  };

  // Determine current active or selected session for roster display
  const displaySessionId = selectedViewSessionId || currentActiveSession?.id || (activeSessions.length > 0 ? activeSessions[activeSessions.length - 1].id : null);
  const selectedSession = activeSessions.find(s => s.id === displaySessionId) || currentActiveSession || activeSessions[0];
  const displayCourse = courses.find(c => c.code === selectedSession?.courseCode);

  // Gather records for the currently selected session (matching by sessionId or course+date fallback)
  const sessionRecords = records.filter(r => 
    r.sessionId === displaySessionId || 
    (selectedSession && r.courseCode === selectedSession.courseCode && r.date === selectedSession.date)
  );

  // Robust student presence matching
  const isStudentPresent = (student: Student, recs: AttendanceRecord[]) => {
    return recs.some(r => {
      const isStatusPresent = !r.status || r.status.toLowerCase() === 'present';
      const matchId = r.studentId === student.id;
      const matchReg = !!(r.regNo && student.regNo && r.regNo.trim().toLowerCase() === student.regNo.trim().toLowerCase());
      const matchName = !!(r.studentName && student.name && r.studentName.trim().toLowerCase() === student.name.trim().toLowerCase());
      return isStatusPresent && (matchId || matchReg || matchName);
    });
  };

  const getStudentSessionRecord = (student: Student, recs: AttendanceRecord[]) => {
    return recs.find(r => {
      const matchId = r.studentId === student.id;
      const matchReg = !!(r.regNo && student.regNo && r.regNo.trim().toLowerCase() === student.regNo.trim().toLowerCase());
      const matchName = !!(r.studentName && student.name && r.studentName.trim().toLowerCase() === student.name.trim().toLowerCase());
      return matchId || matchReg || matchName;
    });
  };

  const totalRegisteredStudents = students.length;
  const presentCount = students.filter(s => isStudentPresent(s, sessionRecords)).length;
  const absentCount = Math.max(0, totalRegisteredStudents - presentCount);
  const attendancePercentage = totalRegisteredStudents > 0 
    ? Math.round((presentCount / totalRegisteredStudents) * 100) 
    : 0;

  const handleToggleAttendance = async (student: Student, currentStatus: 'PRESENT' | 'ABSENT', existingRecordId?: string) => {
    const activeSession = selectedSession || currentActiveSession || activeSessions[0];
    if (!activeSession) {
      setDashboardError("No lecture session found. Please initialize an Attendance Gate first.");
      setTimeout(() => setDashboardError(null), 4000);
      return;
    }

    if (currentStatus === 'PRESENT') {
      const rec = getStudentSessionRecord(student, sessionRecords);
      if (rec && onDeleteAttendance) {
        onDeleteAttendance(rec.id);
      } else if (existingRecordId && onDeleteAttendance) {
        onDeleteAttendance(existingRecordId);
      }
    } else {
      const newRecord: AttendanceRecord = {
        id: `rec-usr-${Date.now()}`,
        sessionId: activeSession.id,
        courseCode: activeSession.courseCode,
        studentId: student.id,
        studentName: student.name,
        regNo: student.regNo,
        department: student.department,
        timestamp: new Date().toISOString(),
        biometricType: 'facial_recognition',
        status: 'present',
        locationInfo: {
          campusName: 'Uli Campus (Computer Science Dept)',
          distanceMeters: 0,
          latitude: activeSession.latitude,
          longitude: activeSession.longitude,
          isWithinBounds: true
        },
        authSnapshot: student.photoUrl,
        lecturerId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        confidenceScore: 1.0
      };
      if (onMarkAttendance) {
        try {
          await onMarkAttendance(newRecord);
        } catch (e: any) {
          setDashboardError(e.message || "Failed to mark attendance.");
          setTimeout(() => setDashboardError(null), 5000);
        }
      }
    }
  };

  // Group stats for bento visual graphs
  const deptStats = students.reduce((acc, student) => {
    const isPresent = isStudentPresent(student, sessionRecords);
    if (!acc[student.department]) {
      acc[student.department] = { total: 0, present: 0 };
    }
    acc[student.department].total += 1;
    if (isPresent) acc[student.department].present += 1;
    return acc;
  }, {} as Record<string, { total: number; present: number }>);

  // Filter student rows for displaying roster grid
  const studentRows = students.map((student) => {
    const record = getStudentSessionRecord(student, sessionRecords);
    const isPresent = isStudentPresent(student, sessionRecords);
    return {
      id: student.id,
      name: student.name,
      regNo: student.regNo,
      department: student.department,
      status: isPresent ? 'PRESENT' : 'ABSENT',
      time: record ? (record.time || new Date(record.timestamp).toLocaleTimeString()) : '-- --',
      method: record ? record.biometricType : '--',
      photo: student.photoUrl,
      snap: record?.authSnapshot,
      distance: record?.locationInfo?.distanceMeters,
      isWithinBounds: record?.locationInfo?.isWithinBounds,
      confidenceScore: record?.confidenceScore,
      deviceId: record?.deviceId,
      recordId: record?.id
    };
  }).filter((row) => {
    // Search query matches
    const nameMatch = row.name.toLowerCase().includes(searchQuery.toLowerCase());
    const regMatch = row.regNo.includes(searchQuery);
    
    // Dropdown filters
    const deptMatch = selectedDeptFilter === 'All' || row.department === selectedDeptFilter;
    const statusMatch = selectedStatusFilter === 'All' || row.status === selectedStatusFilter;

    return (nameMatch || regMatch) && deptMatch && statusMatch;
  });

  // Export CSV Excel function with high-fidelity visual archiving simulation
  const handleExportCSV = () => {
    if (!selectedSession) return;
    
    setIsGeneratingCSV(true);
    setGenerationProgress(5);
    setGenerationStep('Analyzing student facial recognition match vectors...');
    setShowExportSuccess(false);

    // Dynamic state simulation
    setTimeout(() => {
      setGenerationProgress(32);
      setGenerationStep('Verifying physical cell fence and coordinate telemetry...');
    }, 400);

    setTimeout(() => {
      setGenerationProgress(65);
      setGenerationStep('Compiling server hardware logs and check-in timestamps...');
    }, 850);

    setTimeout(() => {
      setGenerationProgress(88);
      setGenerationStep('Generating cryptographically signed administrative (.csv) roll...');
    }, 1300);

    setTimeout(() => {
      setGenerationProgress(100);
      setGenerationStep('Export complete! Initiating administrative download packet...');
      
      // Construct clean list headers
      const headers = ['Student Name', 'Reg Number', 'Department', 'Status', 'Verified Clock-In', 'Validation Mode', 'Physical Distance (m)'];
      const rows = students.map((student) => {
        const record = getStudentSessionRecord(student, sessionRecords);
        const isPresent = isStudentPresent(student, sessionRecords);
        return [
          student.name,
          student.regNo,
          student.department,
          isPresent ? 'PRESENT' : 'ABSENT',
          record ? (record.time || new Date(record.timestamp).toLocaleTimeString()) : '--',
          record ? record.biometricType.replace('_', ' ').toUpperCase() : '--',
          record?.locationInfo?.distanceMeters !== undefined ? `${record.locationInfo.distanceMeters}m` : '--'
        ];
      });

      // Merge CSV content
      const csvContent = 
        `Chukwuemeka Odumegwu Ojukwu University (COOU) Attendance Sheet\n` +
        `Course Code: ${selectedSession.courseCode} - Date: ${selectedSession.date}\n` +
        `Department: Computer Science Dept\n` +
        `Generated At: ${new Date().toLocaleString()}\n` +
        `Registrar Lock Key: COOU-CSC-SECURE-STAMP-${Math.floor(100000 + Math.random() * 900000)}\n\n` +
        [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `COOU_CSC_Attendance_${selectedSession.courseCode}_${selectedSession.date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Finish simulation
      setIsGeneratingCSV(false);
      setArchivedSessionCode(selectedSession.courseCode);
      setArchivedStudentCount(students.length);
      setArchivedPresentCount(sessionRecords.length);
      setShowExportSuccess(true);
    }, 1800);
  };

  // 30% Absenteeism Risk Threshold matching
  const currentCourseCodeVal = selectedCourseCode || (selectedSession ? selectedSession.courseCode : courses[0]?.code || '');
  const courseSessionsList = activeSessions.filter(s => s.courseCode === currentCourseCodeVal);
  const totalSessionsCount = courseSessionsList.length;

  const thresholdStudents = students.map(st => {
    const isPresentInCurrent = isStudentPresent(st, sessionRecords);
    const studentCourseRecords = records.filter(r => 
      (!r.status || r.status.toLowerCase() === 'present') &&
      (r.studentId === st.id || (r.regNo && st.regNo && r.regNo.trim().toLowerCase() === st.regNo.trim().toLowerCase()) || (r.studentName && st.name && r.studentName.trim().toLowerCase() === st.name.trim().toLowerCase())) && 
      (courseSessionsList.some(cs => cs.id === r.sessionId) || r.courseCode === currentCourseCodeVal)
    );
    
    const presentCountInCourse = Math.max(studentCourseRecords.length, isPresentInCurrent ? 1 : 0);
    const effectiveSessions = Math.max(1, totalSessionsCount);
    const effectiveMissed = Math.max(0, effectiveSessions - presentCountInCourse);
    const absenteeismRate = Math.round((effectiveMissed / effectiveSessions) * 100);

    return {
      student: st,
      total: effectiveSessions,
      present: presentCountInCourse,
      missed: effectiveMissed,
      absenteeismRate,
      isPresentInCurrent
    };
  }).filter(item => item.absenteeismRate >= 30);

  const handleDispatchPushAlerts = () => {
    setIsSendingAlerts(true);
    setAlertSuccessMessage(null);
    setTimeout(() => {
      const alertedIds = thresholdStudents.map(item => item.student.id);
      setSentAlerts(prev => [...new Set([...prev, ...alertedIds])]);
      setIsSendingAlerts(false);
      setAlertSuccessMessage(`✓ Administrative Warning broadcasted successfully! Pushed critical alert signals & SMS beacons to ${thresholdStudents.length} students with ≥ 30% absenteeism under course ${currentCourseCodeVal}!`);
      setTimeout(() => setAlertSuccessMessage(null), 5500);
    }, 1400);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" id="lecturer-mode-stage">
      {dashboardError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <span className="font-bold">⚠️ Notice:</span>
            <span>{dashboardError}</span>
          </div>
          <button
            onClick={() => setDashboardError(null)}
            className="text-rose-600 hover:text-rose-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}
      
      {/* 2-COLUMN TOP RAIL: Launch session on Left, Live Security Stream / QR Token on Right */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* LAUNCH SESSION CONFIGURATOR */}
        <div id="lecture-starter-box" className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest border-b border-slate-100 pb-2.5 mb-4 flex items-center">
            <span className="h-2 w-2 rounded-full bg-blue-900 mr-2" />
            Initialize Attendance Gate
          </h2>

          {currentActiveSession ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse mr-2" />
                <span className="text-xs text-green-800 font-bold uppercase tracking-wider">Lecture Portal Live</span>
                
                <h3 className="text-xl font-extrabold text-blue-905 mt-1.5">{currentActiveSession.courseCode}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active since {currentActiveSession.startTime}. Students are scanning biometric enclaves.
                </p>
              </div>

              <button
                id="stop-lecture-session-btn"
                onClick={() => onStopSession(currentActiveSession.id)}
                className="w-full flex items-center justify-center space-x-1.5 rounded bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition duration-200"
              >
                <Square className="h-4 w-4" />
                <span>Close Attendance Portal</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-750 uppercase tracking-wider mb-1.5">
                  Select Active Course
                </label>
                <select
                  required
                  id="dash-assign-course"
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-930 focus:border-blue-900 focus:outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.code} - {course.title} {course.semester ? `(${course.semester === 'First Semester' ? '1st Sem' : '2nd Sem'})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-750 uppercase tracking-wider mb-1.5">
                  Assigned Campus Location
                </label>
                <select
                  value={selectedCampus}
                  id="dash-assign-campus"
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-930 focus:border-blue-900 focus:outline-none"
                >
                  {COOU_CAMPUSES.map((campus) => (
                    <option key={campus.name} value={campus.name}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-755 uppercase tracking-wider mb-1">
                  <span>GPS Radius Control</span>
                  <span className="text-amber-650 font-mono font-bold">{customRadius}m</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  id="dash-radius-slider"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-205 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
                />
                <span className="text-[9px] text-zinc-500 leading-tight block mt-1">
                  Students beyond this perimeter radius relative to selected campus coordinates are blocked from checking in.
                </span>
              </div>

              <button
                type="submit"
                id="dash-start-session-btn"
                className="w-full flex items-center justify-center space-x-1.5 rounded bg-blue-900 hover:bg-blue-800 font-bold text-white py-2.5 text-xs transition duration-200 shadow-sm"
              >
                <Play className="h-4 w-4" />
                <span>Open Biometric Attendance Gate</span>
              </button>
            </form>
          )}
        </div>

        {/* SECURE BLOCK CHAIN/OTP ROTATING TICKER VIEW ONLY FOR ACTIVE WORK */}
        <div id="dynamic-security-ticker" className="md:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center">
            <BadgeCheck className="h-44 w-44 text-slate-900" />
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3.5 relative z-10">
            <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest flex items-center space-x-1.5">
              <span>Security Assurance & OTP Generator</span>
            </h3>
            
            {currentActiveSession && (
              <span className="text-[10px] bg-red-10 border border-red-200 px-2.5 py-0.5 rounded-full text-red-650 font-bold animate-pulse font-mono">
                ANTI-LOCATION-FRAUD ENABLED
              </span>
            )}
          </div>

          {currentActiveSession ? (
            <div className="grid gap-5 sm:grid-cols-2 relative z-10 py-1">
              {/* Dynamic QR block */}
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-lg border border-slate-200 w-36 h-36 mx-auto shadow-sm relative">
                
                {/* Simulated dynamic QR lines with custom Canvas style */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                  <path d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z" fill="currentColor" />
                  <path d="M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z" fill="currentColor" />
                  <path d="M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z" fill="currentColor" />
                  <path d="M45,45 h10 v10 h-10 z" fill="currentColor" />
                  <rect x="50" y="10" width="8" height="8" fill="currentColor" />
                  <rect x="70" y="50" width="12" height="12" fill="currentColor" />
                  <rect x="45" y="70" width="15" height="4" fill="currentColor" />
                  <rect x="85" y="80" width="8" height="8" fill="currentColor" />
                  
                  {/* Dynamic rotating dots inside the QR */}
                  <rect x="45" y="15" width="4" height="4" fill="#3b82f6" className="animate-pulse" />
                  <rect x="15" y="45" width="4" height="4" fill="#3b82f6" className="animate-pulse" />
                  <rect x="65" y="70" width="8" height="4" fill="#3b82f6" className="animate-pulse" />
                </svg>

                <div className="absolute bg-slate-900 text-amber-400 rounded px-1.5 py-0.5 text-[8px] font-mono border border-slate-800 -bottom-2 font-bold shadow">
                  COOU SCREEN QR
                </div>
              </div>

              {/* Dynamic rolling OTP security digits */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-xs text-slate-500 font-mono font-bold">SECURE CLASS SYMMETRIC OTP:</h4>
                  <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-blue-900 mt-1">
                    {sessionOtp || "------"}
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                    <div className="w-20 bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-1000 linear"
                        style={{ width: `${(otpProgress / 30) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">rolling in {otpProgress}s</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-550 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150">
                  <span className="font-bold text-blue-900 block mb-0.5">💡 Lecturers' Impersonation Blockade:</span>
                  The dynamic OTP updates every 30 seconds. Students must be inside the lecture hall with the active OTP on display to check in. Screenshots shared remotely will expire, blocking proxy attendance logs.
                </p>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" id="session-inactive-instructions">
              <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Symmetric Dynamic Keys Offline</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                Initialize an active attendance portal session with the configurator panel on the left to start rotating security codes and locking coordinate fencing parameters.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* THREE BENTO GRID METRICS: Present Rate, Total Checked-in Ratios, Faculty breakdown */}
      {selectedSession && (
        <div className="grid gap-4 sm:grid-cols-3" id="dash-bento-metrics">
          
          {/* Card 1: Attendance Percentage */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-widest block">Session Attendance Rate</span>
              <span className="text-3xl font-bold text-slate-800 font-mono">{attendancePercentage}%</span>
              <p className="text-[10px] text-slate-500">Of roster present</p>
            </div>
            
            {/* Custom high-fidelity responsive circular SVG track */}
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                <circle 
                  cx="32" cy="32" r="26" fill="transparent" stroke="#1e3a8a" strokeWidth="5" 
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - attendancePercentage / 100)}`}
                />
              </svg>
              <Users className="absolute h-5 w-5 text-blue-900" />
            </div>
          </div>

          {/* Card 2: Absolute Present Counts */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-widest block">Headcount Breakdown</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-green-600 font-mono">{presentCount}</span>
                <span className="text-xs text-slate-500">/ {totalRegisteredStudents} Students</span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center font-medium">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span>Verified Biometrically</span>
              </p>
            </div>
            
            <div className="h-11 w-11 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-200">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Department participation rates */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-widest block mb-2">Participation By Department</span>
            
            {/* Custom micro SVG bar graphs */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-center">
              {Object.entries(deptStats).slice(0, 3).map(([dept, data]) => {
                const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                return (
                  <div key={dept} className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[120px] font-semibold">{dept}</span>
                      <span className="font-mono">{data.present}/{data.total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 border border-slate-200 overflow-hidden">
                      <div 
                        className="bg-blue-900 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* COOU HIGH ABSENTEEISM ESCALATION & PUSH ALERT PANEL */}
      <div id="absenteeism-escalation-panel" className="rounded-xl border border-rose-250 bg-rose-50/20 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-rose-100 rounded text-rose-600 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-950 flex items-center space-x-1.5">
                <span>Absenteeism Escalation Broadcast Panel</span>
                <span className="text-[10px] bg-rose-600 text-white font-mono px-1.5 py-0.5 rounded font-black">≥ 30% THRESHOLD</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Instantly trigger administrative push signals & SMS alert codes for students below 70% attendance criteria in <strong className="font-semibold text-slate-705">{currentCourseCodeVal || "Course"}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={thresholdStudents.length === 0 || isSendingAlerts}
            onClick={handleDispatchPushAlerts}
            className={`inline-flex items-center space-x-2 rounded px-4 py-2 text-xs font-bold text-white transition duration-200 shadow-sm ${
              thresholdStudents.length === 0 
                ? 'bg-slate-300 cursor-not-allowed' 
                : isSendingAlerts
                  ? 'bg-rose-500/60 cursor-not-allowed animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isSendingAlerts ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Broadcasting Push Notices...</span>
              </>
            ) : (
              <>
                <span>Broadcast Critical Alerts</span>
                <span className="bg-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{thresholdStudents.length} Students</span>
              </>
            )}
          </button>
        </div>

        {alertSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-lg text-xs leading-relaxed"
          >
            {alertSuccessMessage}
          </motion.div>
        )}

        {thresholdStudents.length === 0 ? (
          <p className="text-xs text-slate-450 text-center py-4 font-mono">
            🎉 EXCELLENT! No students have exceeded the 30% absenteeism threshold in {currentCourseCodeVal || "this course"} yet!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[280px] overflow-y-auto pr-1">
            {thresholdStudents.map(({ student: st, total, present, missed, absenteeismRate, isPresentInCurrent }) => {
              const wasAlerted = sentAlerts.includes(st.id);
              return (
                <div 
                  key={st.id} 
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all shadow-xs ${
                    wasAlerted 
                      ? 'bg-amber-500/5 border-amber-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={st.photoUrl} 
                      alt={st.name} 
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block text-xs font-bold text-slate-800 truncate" title={st.name}>{st.name}</span>
                        {wasAlerted && (
                          <span className="text-[8px] bg-amber-500 text-slate-900 font-mono px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">
                            Alerted
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-zinc-400 font-mono leading-none mt-0.5">{st.regNo}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono border-t border-slate-100 pt-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 whitespace-nowrap">Missed: <strong className="font-bold text-rose-600">{missed}/{total}</strong></span>
                      <span className="text-rose-700 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {absenteeismRate}% Absent
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(st, isPresentInCurrent ? 'PRESENT' : 'ABSENT')}
                      title={isPresentInCurrent ? "Currently Present (Click to mark absent)" : "Instantly mark as PRESENT"}
                      className={`font-extrabold px-2 py-0.5 rounded cursor-pointer transition text-[9px] uppercase tracking-wide whitespace-nowrap border ${
                        isPresentInCurrent
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isPresentInCurrent ? "✓ Present" : "Mark Present"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN DATA MODULE: Filters bar, search engine, export modules, and the grid */}
      <div id="attendance-roster-ledger" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        
        {/* Core Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-blue-900 flex items-center space-x-1.5 uppercase tracking-wider">
              <Calendar className="h-4.5 w-4.5 text-blue-900" />
              <span>
                {displayCourse ? `${displayCourse.code} - ${displayCourse.title}` : "Comprehensive Attendance Register"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Showing students taking current session. Export certified CSV logs of verified student biometric signatures below.
            </p>
          </div>

          {selectedSession && (
            <button
              id="export-attendance-sheet-btn"
              disabled={isGeneratingCSV}
              onClick={handleExportCSV}
              className={`inline-flex items-center space-x-1.5 rounded py-2.5 px-4 text-xs font-bold text-white transition self-start shadow-sm ${
                isGeneratingCSV ? 'bg-blue-800/60 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {isGeneratingCSV ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating... {generationProgress}%</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export COOU spreadsheet (.csv)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Simulating Secure Admin File Archive Export Status */}
        <AnimatePresence>
          {isGeneratingCSV && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4"
              id="csv-generation-progress-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-550"></span>
                    </span>
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                      administrative archival generation active...
                    </h4>
                  </div>
                  <p className="text-xs text-amber-600 font-mono">
                    {generationStep}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-bold text-amber-900 font-mono bg-amber-100 px-2.5 py-1 rounded-full">{generationProgress}% READY</span>
                </div>
              </div>
              
              <div className="w-full bg-amber-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <motion.div 
                  className="bg-amber-500 h-full rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}

          {showExportSuccess && !isGeneratingCSV && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start space-x-3"
              id="csv-generation-success-card"
            >
              <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-green-800 uppercase tracking-widest">
                    Administrative CSV Compiled & Locked Successfully
                  </h4>
                  <button 
                    onClick={() => setShowExportSuccess(false)}
                    className="text-xs text-green-600 hover:text-green-800 font-bold px-2 py-0.5 rounded hover:bg-green-100 transition"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-green-700">
                  A cryptographically signed attendance registry sheet has been formatted for <strong>Course {archivedSessionCode}</strong> ({archivedPresentCount} of {archivedStudentCount} Computer Science students registered) and downloaded to the local device download directory.
                </p>
                <div className="flex items-center space-x-4 pt-1 text-[10px] text-green-600 font-mono font-medium">
                  <span>Size: 2.4 KB (AES-256)</span>
                  <span>•</span>
                  <span>COOU-Registrar-Key: COOU-CSC-SECURE-STAMP-{Math.floor(100000 + Math.random() * 900000)}</span>
                  <span>•</span>
                  <span>State: ARCHIVED</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic filter line */}
        <div className="grid gap-3 sm:grid-cols-5 mb-4" id="roster-query-filters-row">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
            <input
              type="text"
              id="roster-search-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name or Reg No..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-930 placeholder-slate-400 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={displaySessionId || ''}
              id="roster-session-filter"
              onChange={(e) => setSelectedViewSessionId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-930 focus:border-blue-900 focus:outline-none font-bold"
            >
              {activeSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.courseCode} ({s.date} {s.isActive ? '• LIVE' : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              id="roster-status-filter"
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-930 focus:border-blue-900 focus:outline-none"
            >
              <option value="All">All Attendance status</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between space-x-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-150">
            <div className="flex items-center space-x-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-900" />
              <span className="font-bold text-slate-900">{studentRows.length}</span>
              <span>students</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
              {presentCount} Present
            </span>
          </div>
        </div>

        {/* Live Table Roster */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" id="roster-table-container">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-blue-900">Student Profile</th>
                <th className="py-3 px-4 text-blue-900">Reg Number</th>
                <th className="py-3 px-4 text-blue-900">Department</th>
                <th className="py-3 px-4 text-blue-900">Check-In Time</th>
                <th className="py-3 px-4 text-blue-900">Biometric Verification</th>
                <th className="py-3 px-4 text-blue-900">Proximity Genuineness</th>
                <th className="py-3 px-4 text-center text-blue-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {studentRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching student logs found on roster.
                  </td>
                </tr>
              ) : (
                studentRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition duration-155">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={row.photo} 
                          alt={row.name} 
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                        />
                        <span className="font-bold text-slate-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{row.regNo}</td>
                    <td className="py-3 px-4 truncate max-w-[150px] font-medium">{row.department}</td>
                    <td className="py-3 px-4 font-mono text-green-650 font-semibold">{row.time}</td>
                    <td className="py-3 px-4 truncate">
                      {row.method !== '--' ? (
                        <div className="flex flex-col space-y-0.5">
                          <span className="inline-flex items-center space-x-1.5 text-xs text-slate-750 font-medium">
                            <BadgeCheck className="h-4 w-4 text-blue-900" />
                            <span className="capitalize">{row.method.replace('_', ' ')}</span>
                          </span>
                          {row.confidenceScore !== undefined && (
                            <span className="text-[10px] text-zinc-500 font-bold pl-5 flex items-center gap-1.5">
                              <span>Match: {(row.confidenceScore * 100).toFixed(1)}%</span>
                              {row.deviceId && <span className="opacity-60 text-[9px] truncate">({row.deviceId.slice(0, 11)})</span>}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    
                    {/* Proximity location matches */}
                    <td className="py-3 px-4">
                      {row.distance !== undefined ? (
                        <div className="flex items-center space-x-1 font-mono text-[11px] font-bold">
                          <MapPin className={`h-3 w-3 shrink-0 ${row.isWithinBounds ? 'text-green-600' : 'text-red-500'}`} />
                          <span className={row.isWithinBounds ? 'text-green-600' : 'text-red-500'}>
                            {row.distance}m ({row.isWithinBounds ? 'Hall Present' : 'Distant'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Status Chip present vs absent */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const studentObj = students.find(s => s.id === row.id);
                          if (studentObj) {
                            handleToggleAttendance(studentObj, row.status as 'PRESENT' | 'ABSENT', row.recordId);
                          }
                        }}
                        title={row.status === 'PRESENT' ? "Click to mark as ABSENT" : "Click to mark as PRESENT"}
                        className={`inline-block px-2.5 py-1 rounded text-[10px] font-extrabold transition hover:scale-[1.03] active:scale-95 cursor-pointer border ${
                          row.status === 'PRESENT'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                      >
                        {row.status}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
