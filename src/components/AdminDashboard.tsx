/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lecturer, CourseRep, Course, VerificationAuditLog } from '../types';
import { 
  UserCheck, Users, PlusCircle, Trash2, Mail, Phone, BookOpen, 
  ShieldCheck, GraduationCap, Calendar, Search, Filter, Edit3, 
  Layers, CheckCircle2, AlertCircle, X, Sparkles, Tag, ChevronRight
} from 'lucide-react';

interface AdminDashboardProps {
  courses: Course[];
  onRegisterCourse?: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (courseCode: string) => void;
  onDeleteAllCourses?: () => void;
  lecturers: Lecturer[];
  onRegisterLecturer: (lecturer: Lecturer) => void;
  onDeleteLecturer: (id: string) => void;
  courseReps: CourseRep[];
  onRegisterCourseRep: (courseRep: CourseRep) => void;
  onDeleteCourseRep: (id: string) => void;
  auditLogs?: VerificationAuditLog[];
}

export default function AdminDashboard({
  courses,
  onRegisterCourse,
  onUpdateCourse,
  onDeleteCourse,
  onDeleteAllCourses,
  lecturers,
  onRegisterLecturer,
  onDeleteLecturer,
  courseReps,
  onRegisterCourseRep,
  onDeleteCourseRep,
  auditLogs = []
}: AdminDashboardProps) {
  // Navigation tabs: 'courses' | 'lecturers' | 'reps' | 'audit_logs'
  const [activeTab, setActiveTab] = useState<'courses' | 'lecturers' | 'reps' | 'audit_logs'>('courses');
  
  // Alert message states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= COURSE FORM STATES =================
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSemester, setCourseSemester] = useState<'First Semester' | 'Second Semester'>('First Semester');
  const [courseLevel, setCourseLevel] = useState<string>('400 Level');
  const [courseCreditUnits, setCourseCreditUnits] = useState<number>(3);
  const [courseDepartment, setCourseDepartment] = useState<string>('Computer Science');
  const [courseLecturer, setCourseLecturer] = useState<string>('');
  const [courseCustomLecturer, setCourseCustomLecturer] = useState<string>('');
  const [courseAcademicSession, setCourseAcademicSession] = useState<string>('2025/2026');
  const [courseStatus, setCourseStatus] = useState<'Compulsory' | 'Required' | 'Elective'>('Compulsory');
  const [courseDescription, setCourseDescription] = useState<string>('');

  // Course Filter & Search States
  const [courseSearch, setCourseSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<'All' | 'First Semester' | 'Second Semester'>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isDeletingAllCourses, setIsDeletingAllCourses] = useState<boolean>(false);

  // ================= LECTURER FORM STATES =================
  const [lecName, setLecName] = useState('');
  const [lecId, setLecId] = useState('');
  const [lecEmail, setLecEmail] = useState('');
  const [lecPhone, setLecPhone] = useState('');
  const [lecPassword, setLecPassword] = useState('');
  const [deletingLecturer, setDeletingLecturer] = useState<Lecturer | null>(null);

  // ================= COURSE REP FORM STATES =================
  const [repName, setRepName] = useState('');
  const [repRegNo, setRepRegNo] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repLevel, setRepLevel] = useState('400 Level');
  const [repPassword, setRepPassword] = useState('');
  const [deletingCourseRep, setDeletingCourseRep] = useState<CourseRep | null>(null);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Compute stats for semester offerings
  const courseStats = useMemo(() => {
    const total = courses.length;
    const firstSem = courses.filter(c => c.semester === 'First Semester').length;
    const secondSem = courses.filter(c => c.semester === 'Second Semester').length;
    const totalUnits = courses.reduce((acc, c) => acc + (c.creditUnits || 2), 0);
    return { total, firstSem, secondSem, totalUnits };
  }, [courses]);

  // Filtered courses for display
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = 
        c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.lecturerName.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.department.toLowerCase().includes(courseSearch.toLowerCase());
      
      const matchSemester = semesterFilter === 'All' || c.semester === semesterFilter;
      const matchLevel = levelFilter === 'All' || c.level === levelFilter;
      const matchCategory = categoryFilter === 'All' || c.status === categoryFilter;

      return matchSearch && matchSemester && matchLevel && matchCategory;
    });
  }, [courses, courseSearch, semesterFilter, levelFilter, categoryFilter]);

  // ================= HANDLERS =================

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const formattedCode = courseCode.trim().toUpperCase();
    const formattedTitle = courseTitle.trim();

    if (!formattedCode || !formattedTitle) {
      setErrorMessage('Course Code and Course Title are strictly required.');
      return;
    }

    // Check duplicate course code
    const existing = courses.find(c => c.code.toUpperCase() === formattedCode);
    if (existing) {
      setErrorMessage(`Course code "${formattedCode}" is already registered (${existing.title}).`);
      return;
    }

    const assignedLecturer = courseLecturer === '__CUSTOM__' 
      ? (courseCustomLecturer.trim() || 'Departmental Staff') 
      : (courseLecturer || (lecturers[0]?.name || 'Dr. Charles O. Adesina'));

    const newCourse: Course = {
      code: formattedCode,
      title: formattedTitle,
      department: courseDepartment || 'Computer Science',
      lecturerName: assignedLecturer,
      semester: courseSemester,
      level: courseLevel,
      creditUnits: Number(courseCreditUnits) || 3,
      academicSession: courseAcademicSession || '2025/2026',
      status: courseStatus,
      description: courseDescription.trim() || undefined,
      dateAdded: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    if (onRegisterCourse) {
      onRegisterCourse(newCourse);
      setSuccessMessage(`Course "${formattedCode} - ${formattedTitle}" registered successfully for ${courseSemester}!`);
    }

    // Reset course form
    setCourseCode('');
    setCourseTitle('');
    setCourseDescription('');
    setCourseCustomLecturer('');
  };

  const handleSaveEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    clearMessages();

    if (!editingCourse.title.trim()) {
      setErrorMessage('Course Title cannot be empty.');
      return;
    }

    if (onUpdateCourse) {
      onUpdateCourse(editingCourse);
      setSuccessMessage(`Course ${editingCourse.code} details successfully updated.`);
    }
    setEditingCourse(null);
  };

  const handleCreateLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!lecName || !lecId || !lecEmail) {
      setErrorMessage('Full Name, Course Code, and Email are required.');
      return;
    }

    if (lecturers.some(l => l.employeeId.toLowerCase() === lecId.toLowerCase())) {
      setErrorMessage(`Lecturer for Course Code ${lecId} is already registered.`);
      return;
    }

    const newLec: Lecturer = {
      id: `lec-${Date.now()}`,
      name: lecName,
      employeeId: lecId.toUpperCase(),
      department: 'Computer Science',
      email: lecEmail,
      phone: lecPhone || 'N/A',
      dateRegistered: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      password: lecPassword || 'lecturer123'
    };

    onRegisterLecturer(newLec);
    setSuccessMessage(`Academic Staff ${lecName} registered for ${lecId.toUpperCase()} successfully!`);
    
    setLecName('');
    setLecId('');
    setLecEmail('');
    setLecPhone('');
    setLecPassword('');
  };

  const handleCreateCourseRep = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!repName || !repRegNo || !repEmail || !repPassword) {
      setErrorMessage('Please fill in all required fields, including setting a login password.');
      return;
    }

    if (courseReps.some(r => r.regNo === repRegNo)) {
      setErrorMessage(`Course Representative with Reg No ${repRegNo} is already registered.`);
      return;
    }

    const newRep: CourseRep = {
      id: `rep-${Date.now()}`,
      name: repName,
      regNo: repRegNo,
      department: 'Computer Science',
      email: repEmail,
      phone: repPhone || 'N/A',
      level: repLevel,
      dateRegistered: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      password: repPassword
    };

    onRegisterCourseRep(newRep);
    setSuccessMessage(`Course Representative ${repName} registered successfully!`);

    setRepName('');
    setRepRegNo('');
    setRepEmail('');
    setRepPhone('');
    setRepPassword('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6" id="admin-dashboard-container">
      
      {/* Upper Status & Telemetry Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 border border-blue-800/40 p-5 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold shadow-inner shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">University Academic & Biometric Admin Terminal</h3>
              <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">COOU IAM v5.0</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Department of Computer Science • <strong className="text-amber-300">Uli Campus</strong> • Academic Session 2025/2026
            </p>
          </div>
        </div>
        
        {/* Real-time KPI Stats Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2 text-center">
            <span className="block text-[8.5px] font-bold text-blue-200 uppercase tracking-wider">Total Courses</span>
            <span className="text-lg font-black text-amber-400 font-mono leading-none">{courseStats.total}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2 text-center">
            <span className="block text-[8.5px] font-bold text-cyan-200 uppercase tracking-wider">1st Sem / 2nd Sem</span>
            <span className="text-xs font-black text-cyan-300 font-mono leading-none flex items-center justify-center gap-1 pt-1">
              <span className="text-cyan-400 font-bold">{courseStats.firstSem}</span>
              <span className="text-white/40">/</span>
              <span className="text-amber-300 font-bold">{courseStats.secondSem}</span>
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2 text-center">
            <span className="block text-[8.5px] font-bold text-emerald-200 uppercase tracking-wider">Lecturers</span>
            <span className="text-lg font-black text-emerald-300 font-mono leading-none">{lecturers.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2 text-center">
            <span className="block text-[8.5px] font-bold text-violet-200 uppercase tracking-wider">Course Reps</span>
            <span className="text-lg font-black text-violet-300 font-mono leading-none">{courseReps.length}</span>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-center space-x-2 shadow-sm"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={clearMessages} className="hover:underline text-[10px] text-rose-600 uppercase font-bold px-2 py-0.5 rounded hover:bg-rose-100">Dismiss</button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center space-x-2 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{successMessage}</span>
            <button onClick={clearMessages} className="hover:underline text-[10px] text-emerald-600 uppercase font-bold px-2 py-0.5 rounded hover:bg-emerald-100">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY NAVIGATION TAB BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 grid grid-cols-2 lg:flex shadow-sm gap-1.5 sm:gap-2">
        <button
          onClick={() => { setActiveTab('courses'); clearMessages(); }}
          className={`flex-1 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition min-h-[42px] ${
            activeTab === 'courses' 
              ? 'bg-blue-900 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          id="admin-tab-courses"
        >
          <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="truncate">Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('lecturers'); clearMessages(); }}
          className={`flex-1 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition min-h-[42px] ${
            activeTab === 'lecturers' 
              ? 'bg-blue-900 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          id="admin-tab-lecturers"
        >
          <Users className="h-4 w-4 text-cyan-300 shrink-0" />
          <span className="truncate">Staff ({lecturers.length})</span>
        </button>
        
        <button
          onClick={() => { setActiveTab('reps'); clearMessages(); }}
          className={`flex-1 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition min-h-[42px] ${
            activeTab === 'reps' 
              ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          id="admin-tab-reps"
        >
          <UserCheck className="h-4 w-4 shrink-0" />
          <span className="truncate">Course Reps ({courseReps.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('audit_logs'); clearMessages(); }}
          className={`flex-1 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition min-h-[42px] ${
            activeTab === 'audit_logs' 
              ? 'bg-indigo-950 text-white shadow-md border border-indigo-900' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          id="admin-tab-audit-logs"
        >
          <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="truncate">Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COURSES OFFERED PER SEMESTER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-courses-section">
          
          {/* LEFT: Course Manual Registration Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4 text-amber-500" />
                    <span>Register Course Offered Per Semester</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Add new curriculum courses allocated to 1st or 2nd semester.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  Manual Entry
                </span>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4" id="admin-course-form">
                
                {/* Semester Selector Toggle Buttons */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Semester Allocation <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCourseSemester('First Semester')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 border transition ${
                        courseSemester === 'First Semester'
                          ? 'bg-blue-900 border-blue-900 text-white shadow-sm ring-2 ring-blue-900/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                      <span>First Semester (Harmattan)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCourseSemester('Second Semester')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 border transition ${
                        courseSemester === 'Second Semester'
                          ? 'bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-amber-300 shrink-0" />
                      <span>Second Semester (Rain)</span>
                    </button>
                  </div>
                </div>

                {/* Course Code & Credit Units */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Course Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CSC 411, COS 102"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Credit Units <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={courseCreditUnits}
                      onChange={(e) => setCourseCreditUnits(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value={1}>1 Unit</option>
                      <option value={2}>2 Units</option>
                      <option value={3}>3 Units</option>
                      <option value={4}>4 Units</option>
                      <option value={6}>6 Units</option>
                    </select>
                  </div>
                </div>

                {/* Course Title */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Course Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Compiler Construction & Formal Languages"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Level & Course Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Academic Level <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="500 Level">500 Level</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Course Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="Compulsory">Compulsory (Core)</option>
                      <option value="Required">Required</option>
                      <option value="Elective">Elective</option>
                    </select>
                  </div>
                </div>

                {/* Academic Session & Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Academic Session
                    </label>
                    <select
                      value={courseAcademicSession}
                      onChange={(e) => setCourseAcademicSession(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="2025/2026">2025/2026 Session</option>
                      <option value="2026/2027">2026/2027 Session</option>
                      <option value="2024/2025">2024/2025 Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <select
                      value={courseDepartment}
                      onChange={(e) => setCourseDepartment(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="General Studies">General Studies</option>
                      <option value="Geology">Geology</option>
                    </select>
                  </div>
                </div>

                {/* Assigned Academic Lecturer */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Assigned Course Lecturer
                  </label>
                  <select
                    value={courseLecturer}
                    onChange={(e) => setCourseLecturer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 font-semibold focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                  >
                    <option value="">-- Choose Registered Staff Member --</option>
                    {lecturers.map(l => (
                      <option key={l.id} value={l.name}>
                        {l.name} ({l.employeeId})
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Specify Other Academic Staff Name</option>
                  </select>
                </div>

                {courseLecturer === '__CUSTOM__' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Custom Lecturer Name & Title
                    </label>
                    <input
                      type="text"
                      value={courseCustomLecturer}
                      onChange={(e) => setCourseCustomLecturer(e.target.value)}
                      placeholder="e.g. Prof. Emeka N. Okoye"
                      className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                    />
                  </div>
                )}

                {/* Course Description / Syllabus */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Course Syllabus / Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Brief syllabus outline, laboratory prerequisites, or learning objectives..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  id="submit-register-course-btn"
                  className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold uppercase tracking-widest text-xs flex items-center justify-center space-x-2 transition shadow-md"
                >
                  <PlusCircle className="h-4 w-4 text-amber-400" />
                  <span>Register Course for {courseSemester}</span>
                </button>
              </form>

            </div>
          </div>

          {/* RIGHT: Course Offerings Roster & Filtering Matrix */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[580px] flex flex-col">
              
              {/* Header & Quick Filter Pills */}
              <div className="border-b border-slate-100 pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                      <span>Approved Course Offerings Roster</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Showing active departmental courses configured for attendance & verification.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono bg-blue-100/70 text-blue-900 px-2.5 py-1 rounded-lg font-black">
                      {filteredCourses.length} of {courses.length} Courses
                    </span>
                    {courses.length > 0 && onDeleteAllCourses && (
                      <button
                        type="button"
                        onClick={() => setIsDeletingAllCourses(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                        id="purge-all-courses-btn"
                      >
                        <Trash2 className="h-3 w-3 text-rose-600" />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Control Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                  {/* Search input */}
                  <div className="sm:col-span-5 relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search code, title, lecturer..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-900 transition"
                    />
                  </div>

                  {/* Semester Filter */}
                  <div className="sm:col-span-4">
                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Semesters</option>
                      <option value="First Semester">1st Semester (Harmattan)</option>
                      <option value="Second Semester">2nd Semester (Rain)</option>
                    </select>
                  </div>

                  {/* Level Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Levels</option>
                      <option value="100 Level">100L</option>
                      <option value="200 Level">200L</option>
                      <option value="300 Level">300L</option>
                      <option value="400 Level">400L</option>
                      <option value="500 Level">500L</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Course Cards List */}
              <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[500px] pr-1.5">
                {filteredCourses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-2">
                    <BookOpen className="h-10 w-10 text-slate-300" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">No Matching Courses Found</p>
                    <p className="text-[11px] max-w-xs text-slate-400">
                      Adjust your search query or semester filter, or register a new course using the form on the left.
                    </p>
                  </div>
                ) : (
                  filteredCourses.map((c) => {
                    const isFirstSem = c.semester === 'First Semester';
                    return (
                      <div 
                        key={c.code}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start space-x-3.5 min-w-0">
                          {/* Course Code Box */}
                          <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            isFirstSem 
                              ? 'bg-blue-900 text-cyan-300 border-blue-800' 
                              : 'bg-amber-600 text-white border-amber-700'
                          }`}>
                            <span className="text-[9px] font-bold uppercase leading-none font-mono">
                              {c.creditUnits || 3}U
                            </span>
                            <span className="text-[7.5px] font-black uppercase tracking-tighter opacity-80 mt-0.5">
                              {isFirstSem ? '1ST' : '2ND'}
                            </span>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-blue-950 uppercase tracking-wide bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                                {c.code}
                              </span>
                              
                              <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                isFirstSem 
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                                  : 'bg-amber-50 text-amber-900 border-amber-200'
                              }`}>
                                {c.semester || 'First Semester'}
                              </span>

                              {c.level && (
                                <span className="text-[8.5px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                  {c.level}
                                </span>
                              )}

                              {c.status && (
                                <span className="text-[8px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                  {c.status}
                                </span>
                              )}
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 truncate leading-snug">
                              {c.title}
                            </h5>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 font-medium">
                              <span className="flex items-center space-x-1 text-slate-600">
                                <GraduationCap className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800">{c.lecturerName}</span>
                              </span>
                              <span>•</span>
                              <span className="text-slate-500">{c.department}</span>
                            </div>

                            {c.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                          <button
                            onClick={() => setEditingCourse(c)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition shadow-xs"
                            title="Edit Course Details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setDeletingCourse(c)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-xs"
                            title="Expunge Course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2 & 3 & 4: LECTURERS, COURSE REPS & AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab !== 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Enrollment Forms for Lecturers / Reps */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              
              {activeTab === 'lecturers' ? (
                <form onSubmit={handleCreateLecturer} className="space-y-4" id="admin-lec-form">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest">Academic Staff Credentials</h4>
                    <p className="text-[11px] text-slate-400">Add an academic lecturer to the Computer Science department.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name (including Title)</label>
                      <input
                        type="text"
                        required
                        value={lecName}
                        onChange={(e) => setLecName(e.target.value)}
                        placeholder="e.g. Prof. Chukwuemeka O. Okafor"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Course Code</label>
                        <select
                          required
                          value={lecId}
                          onChange={(e) => setLecId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs text-slate-800 font-mono focus:border-blue-900 focus:outline-none"
                        >
                          <option value="">-- Select Course Code --</option>
                          {courses.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                        <input
                          type="text"
                          readOnly
                          value="Computer Science"
                          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-400 font-bold cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Institutional Email</label>
                      <input
                        type="email"
                        required
                        value={lecEmail}
                        onChange={(e) => setLecEmail(e.target.value)}
                        placeholder="e.g. c.okafor@coou.edu.ng"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone number (Direct Line)</label>
                      <input
                        type="tel"
                        value={lecPhone}
                        onChange={(e) => setLecPhone(e.target.value)}
                        placeholder="e.g. +234 803 000 0000"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Login Password (Default: lecturer123)</label>
                      <input
                        type="password"
                        value={lecPassword}
                        onChange={(e) => setLecPassword(e.target.value)}
                        placeholder="Optional layout override passcode"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-extrabold uppercase tracking-widest text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Register Academic Staff</span>
                  </button>
                </form>
              ) : activeTab === 'reps' ? (
                <form onSubmit={handleCreateCourseRep} className="space-y-4" id="admin-rep-form">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-extrabold text-amber-600 uppercase tracking-widest">Course Representative</h4>
                    <p className="text-[11px] text-slate-400">Designate an authorized student coordinator for biometric check-in.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Coordinator Name</label>
                      <input
                        type="text"
                        required
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="e.g. Chinedu Eze"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reg Number</label>
                        <input
                          type="text"
                          required
                          value={repRegNo}
                          onChange={(e) => setRepRegNo(e.target.value)}
                          placeholder="e.g. 2021024340"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Academic Level</label>
                        <select
                          value={repLevel}
                          onChange={(e) => setRepLevel(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="100 Level">100 Level</option>
                          <option value="200 Level">200 Level</option>
                          <option value="300 Level">300 Level</option>
                          <option value="400 Level">400 Level</option>
                          <option value="Postgraduate">Postgraduate</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Institutional Student Email</label>
                      <input
                        type="email"
                        required
                        value={repEmail}
                        onChange={(e) => setRepEmail(e.target.value)}
                        placeholder="e.g. c.eze@student.coou.edu.ng"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number (Direct Line)</label>
                      <input
                        type="tel"
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        placeholder="e.g. +234 803 000 0000"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Login Password</label>
                      <input
                        type="password"
                        required
                        value={repPassword}
                        onChange={(e) => setRepPassword(e.target.value)}
                        placeholder="Set secure password for course rep"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold uppercase tracking-widest text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Register Course Rep</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 font-sans text-xs">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest text-[11px] leading-tight">Biometric Intelligence</h4>
                    <p className="text-[11px] text-zinc-400">Security event monitors and terminal log telemetry.</p>
                  </div>
                  
                  <div className="space-y-2 bg-slate-950 text-slate-150 p-4 rounded-xl border border-slate-900 shadow-inner">
                    <div className="flex items-center justify-between border-b border-indigo-900/45 pb-2 mb-2">
                      <span className="text-[9px] text-indigo-400 font-mono font-black uppercase tracking-widest">Enforced Protocols</span>
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-900 font-mono font-black px-1.5 py-0.5 rounded animate-pulse">FACIAL_OK</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px] items-center">
                      <span className="text-zinc-400 font-bold uppercase tracking-wide text-[9px]">Verified Sign-Ins:</span>
                      <span className="text-emerald-400 font-black text-xs bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900">{auditLogs.filter(l => l.status === 'SUCCESS').length}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px] items-center">
                      <span className="text-zinc-400 font-bold uppercase tracking-wide text-[9px]">Biometric Failures:</span>
                      <span className={`font-black text-xs bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900 ${auditLogs.filter(l => l.status !== 'SUCCESS').length > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`}>{auditLogs.filter(l => l.status !== 'SUCCESS').length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Lists for Lecturers / Reps / Audit Logs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[480px] flex flex-col">
              
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    {activeTab === 'lecturers' ? 'Certified Departmental Lecturers' : activeTab === 'reps' ? 'Authorized Attendance Course Reps' : 'Comprehensive Biometric Audit Trail'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {activeTab === 'lecturers' ? 'Verifiable academic credentials eligible for COOU terminal orchestration.' : activeTab === 'reps' ? 'Course representative credentials authorized to create attendance sessions.' : 'Live security telemetry logs reporting liveness checks and presentation audits.'}
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">ULI CAMPUS</span>
              </div>

              {/* Active Tab Body */}
              {activeTab === 'lecturers' ? (
                <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[430px] pr-1">
                  {lecturers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-2">
                      <GraduationCap className="h-10 w-10 text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Lecturers Enrolled</p>
                      <p className="text-[11px] max-w-xs">There are no academic staff members registered in local storage database currently.</p>
                    </div>
                  ) : (
                    lecturers.map((lec) => (
                      <div 
                        key={lec.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 flex items-start justify-between transition-all"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black uppercase">{lec.name.split(' ').pop()?.slice(0, 2) || 'Dr'}</span>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-950 truncate leading-tight">{lec.name}</h5>
                            <span className="inline-block bg-blue-100/60 text-blue-850 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1">
                              COURSE: {lec.employeeId}
                            </span>
                            
                            <div className="flex flex-col sm:flex-row gap-x-3 gap-y-0.5 mt-2 text-[10px] text-slate-500">
                              <span className="flex items-center space-x-1 font-mono">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{lec.email}</span>
                              </span>
                              <span className="flex items-center space-x-1 font-mono">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{lec.phone}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch pl-2">
                          <button
                            onClick={() => setDeletingLecturer(lec)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Revoke Credentials"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="text-[8px] text-slate-400 font-mono flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <Calendar className="h-2 w-2 text-slate-400" />
                            <span>{lec.dateRegistered}</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'reps' ? (
                <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[430px] pr-1">
                  {courseReps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-2">
                      <UserCheck className="h-10 w-10 text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Course Reps Authorized</p>
                      <p className="text-[11px] max-w-xs font-bold">Enroll or select a course representative student to authorize active attendance lens creation.</p>
                    </div>
                  ) : (
                    courseReps.map((rep) => (
                      <div 
                        key={rep.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 flex items-start justify-between transition-all"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
                            <UserCheck className="h-4 w-4 text-amber-800" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <h5 className="text-xs font-bold text-slate-950 truncate leading-tight">{rep.name}</h5>
                              <span className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-bold">{rep.level}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className="bg-amber-100 text-amber-900 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                REG: {rep.regNo}
                              </span>
                              {rep.assignedCourseCode ? (
                                <span className="font-mono text-[9px] text-slate-600 flex items-center space-x-1">
                                  <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                                  <strong className="text-blue-900 font-extrabold">{rep.assignedCourseCode}</strong>
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] text-slate-500 flex items-center space-x-1">
                                  <span>General / All Courses</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-x-3 gap-y-0.5 mt-2 text-[10px] text-slate-500">
                              <span className="flex items-center space-x-1 font-mono">
                                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{rep.email}</span>
                              </span>
                              <span className="flex items-center space-x-1 font-mono">
                                <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                <span>{rep.phone || 'N/A'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch pl-2">
                          <button
                            onClick={() => setDeletingCourseRep(rep)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Revoke Assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="text-[8px] text-slate-400 font-mono flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <Calendar className="h-2 w-2 text-slate-400" />
                            <span>{rep.dateRegistered}</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[430px] pr-1">
                  {auditLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-2">
                      <ShieldCheck className="h-10 w-10 text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Security Logs Recorded</p>
                      <p className="text-[11px] max-w-xs font-medium">Verify human presence on biometric enclaves to generate telemetry logs.</p>
                    </div>
                  ) : (
                    [...auditLogs]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log) => {
                        const logTime = new Date(log.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        });
                        
                        const isSuccess = log.status === 'SUCCESS';
                        const isMismatch = log.status === 'MISMATCH';
                        
                        return (
                          <div 
                            key={log.id}
                            className={`p-3 border flex items-start justify-between transition-all font-mono text-[9.5px] rounded-xl ${
                              isSuccess 
                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/70' 
                                : isMismatch 
                                  ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50/70' 
                                  : 'bg-red-50/40 border-red-100 hover:bg-red-50/70'
                            }`}
                          >
                            <div className="flex items-start space-x-3 min-w-0">
                              <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                                isSuccess 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                                  : isMismatch 
                                    ? 'bg-amber-100 text-amber-900 border-amber-200' 
                                    : 'bg-red-100 text-red-900 border-red-200'
                              }`}>
                                <ShieldCheck className={`h-4 w-4 ${isSuccess ? 'text-emerald-700' : isMismatch ? 'text-amber-700' : 'text-red-700'}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-sans font-black text-[11px] text-slate-900 truncate">
                                    {log.studentName}
                                  </span>
                                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black border uppercase ${
                                    isSuccess 
                                      ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200' 
                                      : isMismatch 
                                        ? 'bg-amber-100/60 text-amber-800 border-amber-200' 
                                        : 'bg-red-100/60 text-red-800 border-red-200'
                                  }`}>
                                    {log.status}
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-slate-500 font-semibold font-sans mt-1">
                                  {isSuccess 
                                    ? 'Handshake authenticated & student presence confirmed' 
                                    : log.errorMessage || 'Neural biometric alignment mismatch'}
                                </p>
                                
                                <div className="flex items-center space-x-3 text-[8.5px] text-slate-400 font-bold mt-1">
                                  <span>TYPE: {log.scanType || 'FACIAL'}</span>
                                  <span>TIMESTAMP: {logTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT COURSE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCourse(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              id="edit-course-dialog"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Edit Course: {editingCourse.code}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Update semester offering and academic details</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditCourse} className="space-y-4">
                
                {/* Semester */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Semester Allocation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCourse({ ...editingCourse, semester: 'First Semester' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        editingCourse.semester === 'First Semester'
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      First Semester (Harmattan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCourse({ ...editingCourse, semester: 'Second Semester' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        editingCourse.semester === 'Second Semester'
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Second Semester (Rain)
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                {/* Level & Credit Units */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Academic Level
                    </label>
                    <select
                      value={editingCourse.level || '400 Level'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="500 Level">500 Level</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Credit Units
                    </label>
                    <select
                      value={editingCourse.creditUnits || 3}
                      onChange={(e) => setEditingCourse({ ...editingCourse, creditUnits: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value={1}>1 Unit</option>
                      <option value={2}>2 Units</option>
                      <option value={3}>3 Units</option>
                      <option value={4}>4 Units</option>
                      <option value={6}>6 Units</option>
                    </select>
                  </div>
                </div>

                {/* Lecturer */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Assigned Lecturer
                  </label>
                  <input
                    type="text"
                    value={editingCourse.lecturerName}
                    onChange={(e) => setEditingCourse({ ...editingCourse, lecturerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                {/* Category & Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Course Category
                    </label>
                    <select
                      value={editingCourse.status || 'Compulsory'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="Compulsory">Compulsory (Core)</option>
                      <option value="Required">Required</option>
                      <option value="Elective">Elective</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingCourse.department}
                      onChange={(e) => setEditingCourse({ ...editingCourse, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Course Description / Syllabus
                  </label>
                  <textarea
                    rows={2}
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 py-2.5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-900 hover:bg-blue-800 text-xs font-black uppercase text-white py-2.5 transition shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE COURSE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCourse(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500 bg-white p-6 shadow-2xl z-10 space-y-4"
              id="delete-course-warning-dialog"
            >
              <div className="flex items-center space-x-3 text-rose-600 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-rose-950 leading-tight">
                    Expunge Course Offering?
                  </h4>
                  <span className="text-[10px] font-mono uppercase text-rose-500 font-bold">
                    PERMANENT CURRICULUM REMOVAL
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to completely remove course <strong className="text-slate-950">{deletingCourse.code} - {deletingCourse.title}</strong> offered in <strong className="text-blue-900">{deletingCourse.semester || 'First Semester'}</strong>?
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-900 font-medium space-y-1">
                <span className="block font-bold">⚠️ Warning Safety Notice:</span>
                <span className="block leading-relaxed">
                  Active attendance sessions and course representative assignments linked to this course code will no longer be valid for new check-in lenses.
                </span>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCourse(null)}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteCourse) {
                      onDeleteCourse(deletingCourse.code);
                      setSuccessMessage(`Course ${deletingCourse.code} removed from semester offerings.`);
                    }
                    setDeletingCourse(null);
                  }}
                  id="confirm-delete-course-btn"
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black uppercase text-white py-2.5 transition shadow"
                >
                  Confirm Expunge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE ALL COURSES CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDeletingAllCourses && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeletingAllCourses(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500 bg-white p-6 shadow-2xl z-10 space-y-4"
              id="delete-all-courses-warning-dialog"
            >
              <div className="flex items-center space-x-3 text-rose-650 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-650 shrink-0">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-rose-900 leading-tight">Delete All Registered Courses?</h4>
                  <span className="text-[10px] font-mono uppercase text-rose-600 font-bold">ALL COURSES PURGE ACTION</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete all <strong className="text-slate-950">{courses.length} registered course(s)</strong> from the system database? This action will expunge all course catalog entries.
              </p>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeletingAllCourses(false)}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteAllCourses) {
                      onDeleteAllCourses();
                      setSuccessMessage('All registered courses have been successfully deleted.');
                    }
                    setIsDeletingAllCourses(false);
                  }}
                  id="confirm-purge-all-courses-btn"
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black uppercase text-white py-2.5 transition shadow"
                >
                  Confirm Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE LECTURER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingLecturer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingLecturer(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500 bg-white p-6 shadow-2xl z-10 space-y-4"
              id="delete-lecturer-warning-dialog"
            >
              <div className="flex items-center space-x-3 text-red-650 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-650 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-red-900 leading-tight">Revoke Lecturer Credentials?</h4>
                  <span className="text-[10px] font-mono uppercase text-red-500 font-bold">CRITICAL SYSTEM REVOCATION ACTION</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you absolutely sure you want to completely revoke credentials and delete the profile for lecturer <strong className="text-slate-950">{deletingLecturer.name}</strong> (Course Code: {deletingLecturer.employeeId})?
              </p>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingLecturer(null)}
                  className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLecturer(deletingLecturer.id);
                    setDeletingLecturer(null);
                  }}
                  id="confirm-delete-lecturer-btn"
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-black uppercase text-white py-2.5 transition shadow"
                >
                  Revoke & Expunge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE COURSE REP CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingCourseRep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCourseRep(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500 bg-white p-6 shadow-2xl z-10 space-y-4"
              id="delete-rep-warning-dialog"
            >
              <div className="flex items-center space-x-3 text-amber-650 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-650 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-amber-900 leading-tight">Revoke Course Rep Access?</h4>
                  <span className="text-[10px] font-mono uppercase text-amber-600 font-bold">CRITICAL SECURE ACCESS DISMISSAL</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you absolutely sure you want to revoke authorized student-administrator role for <strong className="text-slate-950">{deletingCourseRep.name}</strong> (REG: {deletingCourseRep.regNo}){deletingCourseRep.assignedCourseCode ? <> for assigned course <strong className="text-blue-900">{deletingCourseRep.assignedCourseCode}</strong></> : ''}?
              </p>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCourseRep(null)}
                  className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 py-2.5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCourseRep(deletingCourseRep.id);
                    setDeletingCourseRep(null);
                  }}
                  id="confirm-delete-rep-btn"
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-black uppercase text-slate-950 py-2.5 transition shadow"
                >
                  Confirm Revocation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
