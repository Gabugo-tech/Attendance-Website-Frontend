/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, School, Fingerprint, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { loginUser } from '../api';

interface AuthGateProps {
  onAuthenticate: (user: { role: 'admin' | 'lecturer' | 'student'; name: string; identifier: string }) => void;
}

export default function AuthGate({ onAuthenticate }: AuthGateProps) {
  const [credentialInput, setCredentialInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeniedMessage(null);

    if (lockoutRemaining > 0) {
      setDeniedMessage(`Too many failed attempts. Terminal is locked for security. Try again in ${lockoutRemaining}s.`);
      return;
    }

    const credential = credentialInput.trim();
    const password = passwordInput.trim();

    if (!credential) { setDeniedMessage('Please enter a registered email address or phone number.'); return; }
    if (!password)   { setDeniedMessage('Please enter your login password or passcode.'); return; }

    const handleAuthFailure = (msg: string) => {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      setPasswordInput('');
      if (next >= 5) {
        setLockoutRemaining(30);
        setDeniedMessage('Security Alert: 5 consecutive failed attempts. Terminal locked for 30 seconds.');
      } else {
        setDeniedMessage(`${msg} (Attempt ${next} of 5 before lockout)`);
      }
    };

    setLoading(true);
    try {
      const user = await loginUser(credential, password);
      setFailedAttempts(0);
      onAuthenticate(user);
    } catch (err: any) {
      handleAuthFailure(err.message || 'Verifiable credentials not found in the university database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-between py-6 sm:py-12 px-3 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-900" id="coou-auth-gate-wrapper">

      {/* University crest */}
      <div className="flex flex-col items-center space-y-2 sm:space-y-4 my-2 sm:my-0">
        <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white text-blue-900 shadow-xl border-2 sm:border-4 border-amber-500">
          <School className="h-6 w-6 sm:h-8 sm:w-8 text-blue-900" />
        </div>
        <div className="text-center px-2">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">COOU Institutional IAM Network</span>
          <h1 className="text-lg font-black tracking-tight text-white uppercase sm:text-2xl mt-0.5 sm:mt-1 leading-tight">
            Chukwuemeka Odumegwu Ojukwu University
          </h1>
          <p className="text-[10px] sm:text-xs text-blue-300 uppercase font-semibold tracking-wider mt-0.5">
            Attendance Assurance & Identity Verification Terminal
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-blue-800/30 p-5 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden my-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-5 sm:space-y-6">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-950/80 text-amber-400 border border-blue-800/40 flex items-center justify-center">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">Security Verification Gate</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Only registered academic personnel and course administrators are cleared to request active scanner sessions.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="auth-credential" className="block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1.5">
                Registered Institutional Email / Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <input
                  id="auth-credential"
                  type="text"
                  required
                  value={credentialInput}
                  onChange={e => setCredentialInput(e.target.value)}
                  placeholder="Enter registered email or phone"
                  className="w-full bg-slate-950/80 border border-blue-800/40 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:border-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1.5">
                Institutional Login Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-slate-950/80 border border-blue-800/40 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:border-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            {deniedMessage && (
              <div className="p-3 bg-rose-950/70 border border-rose-900/60 rounded-xl text-xs text-rose-300 font-semibold flex items-start space-x-2.5">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{deniedMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0}
              className="w-full cursor-pointer py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg min-h-[44px]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Verifying...</span></>
              ) : (
                <><span>Initiate Secure Match</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-[10px] sm:text-[11px] text-slate-400 font-mono py-2">
        <p>© 2026 Chukwuemeka Odumegwu Ojukwu University.</p>
        <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
          Smart Biometrics Gateway • Certified FIDO2 Perimeter Access Node
        </p>
      </footer>
    </div>
  );
}
