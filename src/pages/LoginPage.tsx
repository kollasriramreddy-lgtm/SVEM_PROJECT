import React, { useState } from 'react';
import { HardHat, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CreditCard, FileText, Eye } from 'lucide-react';
import { db } from '../services/db/database';
import { Profile } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: Profile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@svem.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const user = await db.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    try {
      setIsLoading(true);
      setError(null);
      const user = await db.login(demoEmail, 'password123');
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 border border-amber-300">
            SV
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
          SIDDI VINAYAKA EARTH MOVERS
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-amber-400">
          Internal Workforce, Attendance & Payroll Portal
        </p>
        <p className="mt-0.5 text-center text-[11px] text-slate-400">
          Hyderabad Operations • Excavation & Heavy Equipment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-950/50 border border-rose-800 p-3.5 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff Email ID
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="name@svem.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Secure Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                Remember this device
              </label>
              <span className="text-slate-500 cursor-not-allowed">Forgot Password?</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Sign-In Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click RBAC Role Demonstration
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@svem.in')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors col-span-1 sm:col-span-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Super Admin (Owner)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('accountant@svem.in')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Chief Accountant
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ramesh.supervisor@svem.in')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold transition-colors"
              >
                <HardHat className="h-4 w-4" />
                Site Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('dataentry@svem.in')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-colors"
              >
                <FileText className="h-4 w-4" />
                Data Entry Operator
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@svem.in')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <Eye className="h-4 w-4" />
                Auditor / Viewer
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-slate-500">
              Note: Workers and machine operators have zero login access in accordance with security policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
