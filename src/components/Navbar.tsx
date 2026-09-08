/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { School, User, ClipboardList, ShieldAlert, Wifi, LogOut } from 'lucide-react';

export interface AuthUser {
  role: 'admin' | 'lecturer' | 'student';
  name: string;
  identifier: string;
}

interface NavbarProps {
  currentRole: 'student' | 'lecturer' | 'admin';
  onRoleChange: (role: 'student' | 'lecturer' | 'admin') => void;
  onlineCount: number;
  authUser: AuthUser | null;
  onSignOut: () => void;
}

export default function Navbar({ currentRole, onRoleChange, onlineCount, authUser, onSignOut }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Nigerian time is UTC + 1
      const localTime = new Date(now.getTime() + (now.getTimezoneOffset() + 60) * 60000);
      
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      };
      setCurrentTime(localTime.toLocaleString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-amber-500 bg-blue-900 text-white backdrop-blur shadow-lg">
      <div className="mx-auto flex min-h-[4rem] sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-0 gap-2 sm:gap-4">
        
        {/* University Brand Logo & Title */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-900 shadow-md">
            <School className="h-5 w-5 sm:h-6 sm:w-6 text-blue-900" id="coou-logo-icon" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">COOU System</span>
              <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-blue-400" />
              <span className="hidden sm:inline-block text-[10px] text-blue-200 font-mono">Uli & Igbariam</span>
            </div>
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white uppercase leading-tight truncate">
              <span className="sm:hidden">COOU Biometrics</span>
              <span className="hidden sm:inline">Chukwuemeka Odumegwu Ojukwu University</span>
            </h1>
            <p className="hidden text-[10px] text-blue-200 uppercase font-semibold tracking-wider md:block leading-none mt-0.5">
              Attendance & Biometric Verification System
            </p>
          </div>
        </div>

        {/* Live Clock & Server Indicator (Desktop & Tablet) */}
        <div className="hidden items-center space-x-3 md:flex shrink-0">
          <div className="flex items-center space-x-1.5 rounded-lg bg-blue-950/70 px-2.5 py-1 text-xs border border-blue-700/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span className="text-blue-100 text-[11px] font-mono font-medium">{currentTime}</span>
          </div>

          <div className="flex items-center space-x-1.5 rounded-lg bg-blue-950/70 px-2.5 py-1 text-xs border border-blue-700/60 text-amber-400">
            <Wifi className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] font-semibold">{onlineCount} Scanner Nodes</span>
          </div>
        </div>

        {/* Authorized Mode Display with Integrated Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 animate-fade-in">
          {authUser ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 bg-blue-950/80 border border-blue-800/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-inner">
              <div className="text-right hidden lg:block">
                <span className="block text-[8px] font-black uppercase text-amber-400 tracking-wider leading-none">
                  {authUser.role === 'admin' ? 'Super Admin' : authUser.role === 'lecturer' ? 'Lecturer' : 'Course Rep'}
                </span>
                <span className="block text-[11px] font-extrabold text-white truncate max-w-[120px] leading-tight">
                  {authUser.name}
                </span>
              </div>
              
              <div className="inline-flex rounded-lg bg-blue-900/90 p-0.5 border border-blue-800">
                {authUser.role === 'admin' ? (
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    <button
                      id="admin-view-student-btn"
                      onClick={() => onRoleChange('student')}
                      className={`flex items-center space-x-1 rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                        currentRole === 'student'
                          ? 'bg-amber-500 text-slate-900 shadow font-black'
                          : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
                      }`}
                      title="Switch to Course Rep view"
                    >
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Rep</span>
                    </button>
                    <button
                      id="admin-view-lecturer-btn"
                      onClick={() => onRoleChange('lecturer')}
                      className={`flex items-center space-x-1 rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                        currentRole === 'lecturer'
                          ? 'bg-amber-500 text-slate-900 shadow font-black'
                          : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
                      }`}
                      title="Switch to Lecturer view"
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Lecturer</span>
                    </button>
                    <button
                      id="admin-view-admin-btn"
                      onClick={() => onRoleChange('admin')}
                      className={`flex items-center space-x-1 rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                        currentRole === 'admin'
                          ? 'bg-amber-500 text-slate-900 shadow font-black'
                          : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
                      }`}
                      title="Switch to Admin Dashboard"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Admin</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {authUser.role === 'student' && (
                      <div className="flex items-center space-x-1 sm:space-x-1.5 rounded bg-amber-500 text-slate-900 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                        <User className="h-3.5 w-3.5 animate-pulse shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-none">Course Rep</span>
                      </div>
                    )}
                    {authUser.role === 'lecturer' && (
                      <div className="flex items-center space-x-1 sm:space-x-1.5 rounded bg-amber-500 text-slate-900 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                        <ClipboardList className="h-3.5 w-3.5 animate-pulse shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-none">Lecturer</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="p-1.5 rounded-lg bg-rose-955/40 hover:bg-rose-900 hover:text-white border border-rose-800 text-rose-200 transition-all cursor-pointer flex items-center justify-center shrink-0 min-h-[32px] min-w-[32px]"
                title="Sign Out of Portal"
                aria-label="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-[10px] sm:text-xs text-blue-200 uppercase font-bold tracking-widest px-2">
              🔒 Locked
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
