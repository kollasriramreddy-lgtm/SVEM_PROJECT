import React, { useState, useEffect } from 'react';
import {
  HardHat,
  Plus,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  CheckCheck,
  UserCog,
  X,
} from 'lucide-react';
import { Profile, Site, ManagerSiteAssignment } from '../types';
import { db } from '../services/db/database';
import { StatusBadge } from '../components/common/StatusBadge';

// Password storage: we use localStorage key pattern svem_pwd_{userId}
const getPwd = (userId: string): string => localStorage.getItem(`svem_pwd_${userId}`) ?? '(not set)';
const setPwd = (userId: string, pwd: string) => localStorage.setItem(`svem_pwd_${userId}`, pwd);

export const ManagersPage: React.FC = () => {
  const [managers, setManagers] = useState<Profile[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assignments, setAssignments] = useState<ManagerSiteAssignment[]>([]);

  // Create supervisor modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '+91 ',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change password modal
  const [changePwdFor, setChangePwdFor] = useState<Profile | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Assign site modal
  const [selectedManagerForAssignment, setSelectedManagerForAssignment] = useState<Profile | null>(null);
  const [selectedSiteIdToAssign, setSelectedSiteIdToAssign] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProfiles, allSites, allAssign] = await Promise.all([
        db.getProfiles(),
        db.getSites(),
        db.getManagerSiteAssignments(),
      ]);
      setManagers(allProfiles.filter((p) => p.role === 'manager' || p.role === 'site_manager' || p.role === 'supervisor'));
      setSites(allSites);
      setAssignments(allAssign);
    } catch (e) {
      console.error('Error loading supervisors:', e);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    // Check email uniqueness
    const existing = managers.find((m) => m.email.toLowerCase() === formData.email.toLowerCase().trim());
    if (existing) {
      setFormError('A supervisor with this email already exists.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const newProfile = await db.createProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        role: 'manager',
        status: 'active',
      });
      // Store password in localStorage
      setPwd(newProfile.id, formData.password);
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', phone: '+91 ', password: '' });
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create supervisor account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = () => {
    if (!changePwdFor || !newPwd || newPwd.length < 6) return;
    setPwd(changePwdFor.id, newPwd);
    setChangePwdFor(null);
    setNewPwd('');
    alert(`Password updated for ${changePwdFor.full_name}`);
  };

  const handleToggleStatus = async (manager: Profile) => {
    const nextStatus = manager.status === 'active' ? 'inactive' : 'active';
    if (window.confirm(`Change ${manager.full_name} status to ${nextStatus}?`)) {
      await db.updateProfile(manager.id, { status: nextStatus });
      await loadData();
    }
  };

  const handleAssignSite = async () => {
    if (!selectedManagerForAssignment || !selectedSiteIdToAssign) return;
    try {
      await db.assignManagerToSite(selectedManagerForAssignment.id, selectedSiteIdToAssign);
      setSelectedManagerForAssignment(null);
      setSelectedSiteIdToAssign('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign site');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (window.confirm('Remove this site assignment?')) {
      await db.removeManagerSiteAssignment(assignmentId);
      await loadData();
    }
  };

  const handleCopyCredentials = (mgr: Profile) => {
    const pwd = getPwd(mgr.id);
    const text = `Supervisor Login Credentials\nName: ${mgr.full_name}\nEmail: ${mgr.email}\nPassword: ${pwd}\nPortal: SVEM Operations Portal`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(mgr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
            <HardHat className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              SITE SUPERVISOR ACCOUNT MANAGEMENT
            </h2>
            <p className="text-xs text-slate-500">
              Only Super Admin can create, manage, and assign supervisor accounts
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({ full_name: '', email: '', phone: '+91 ', password: '' });
            setFormError(null);
            setShowPassword(false);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          Create Supervisor Account
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-bold mb-0.5">Two-Role System Active</p>
          <p>This portal operates with exactly two roles: <strong>Super Admin (Owner)</strong> with full access, and <strong>Site Supervisors</strong> with field-only access (attendance, daily work, site advances). Supervisors log in using the email & password set here.</p>
        </div>
      </div>

      {/* Supervisors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-xs">Loading supervisors...</div>
      ) : managers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <HardHat className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No Supervisors Created Yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Create Supervisor Account" to add your first site supervisor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {managers.map((mgr) => {
            const mgrAssignments = assignments.filter((a) => a.manager_id === mgr.id);
            const pwd = getPwd(mgr.id);

            return (
              <div
                key={mgr.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-sky-300 hover:shadow-md transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white font-bold text-sm shadow">
                      {mgr.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{mgr.full_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {mgr.email}</span>
                        {mgr.phone && <span className="flex items-center gap-1 font-mono"><Phone className="h-3 w-3" /> {mgr.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={mgr.status} size="sm" />
                    <button
                      onClick={() => handleToggleStatus(mgr)}
                      title={mgr.status === 'active' ? 'Deactivate' : 'Activate'}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                    >
                      {mgr.status === 'active'
                        ? <XCircle className="h-4 w-4 text-rose-500" />
                        : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </button>
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div className="rounded-xl bg-slate-900 p-3.5 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <KeyRound className="h-3 w-3" /> Login Credentials
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyCredentials(mgr)}
                        title="Copy credentials"
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                      >
                        {copiedId === mgr.id ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedId === mgr.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => { setChangePwdFor(mgr); setNewPwd(''); setShowNewPwd(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
                      >
                        <UserCog className="h-3 w-3" /> Change Pwd
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500 text-[10px] mb-0.5">Email / Login ID</p>
                      <p className="text-white font-mono font-semibold break-all">{mgr.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] mb-0.5">Password</p>
                      <p className="text-emerald-400 font-mono font-bold tracking-widest">{pwd}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Sites */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Assigned Sites ({mgrAssignments.length})
                    </span>
                    <button
                      onClick={() => {
                        setSelectedManagerForAssignment(mgr);
                        setSelectedSiteIdToAssign(sites[0]?.id || '');
                      }}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Assign Site
                    </button>
                  </div>

                  {mgrAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No project sites assigned yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {mgrAssignments.map((assign) => (
                        <div
                          key={assign.id}
                          className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 border border-slate-200 text-xs shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-semibold text-slate-800">{assign.site?.site_name || 'Site'}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">({assign.site?.site_code})</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assign.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove assignment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Supervisor Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <HardHat className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Site Supervisor Account</h3>
                  <p className="text-[10px] text-slate-400">Set login credentials for the new supervisor</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManager} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Goud"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email ID (Login Username) *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh.supervisor@svem.in"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98480 00000"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className={`h-1.5 flex-1 rounded-full ${formData.password.length >= 10 ? 'bg-emerald-500' : formData.password.length >= 8 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span className={`text-[10px] font-bold ${formData.password.length >= 10 ? 'text-emerald-600' : formData.password.length >= 8 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {formData.password.length >= 10 ? 'Strong' : formData.password.length >= 8 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              {/* Permission summary */}
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800">
                <p className="font-bold mb-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Supervisor Access Includes:</p>
                <ul className="space-y-0.5 list-disc list-inside text-sky-700">
                  <li>Daily work entry & tracking</li>
                  <li>Attendance marking & editing</li>
                  <li>Local advance recording</li>
                  <li>View materials & raise purchase bills</li>
                  <li>Access to assigned sites only</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 shadow"
                >
                  {isSubmitting ? 'Creating...' : (
                    <><HardHat className="h-3.5 w-3.5 text-amber-400" /> Create Supervisor</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {changePwdFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-white">Change Password</h3>
                <p className="text-[11px] text-slate-400">{changePwdFor.full_name} • {changePwdFor.email}</p>
              </div>
              <button onClick={() => setChangePwdFor(null)} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
                      const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                      setNewPwd(pwd);
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setChangePwdFor(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={!newPwd || newPwd.length < 6}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-40"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Site Modal ── */}
      {selectedManagerForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4">
              <h3 className="text-sm font-bold text-white">
                Assign Site — {selectedManagerForAssignment.full_name}
              </h3>
              <button onClick={() => setSelectedManagerForAssignment(null)} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Project Site
                </label>
                <select
                  value={selectedSiteIdToAssign}
                  onChange={(e) => setSelectedSiteIdToAssign(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">— Select a site —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.site_name} ({s.site_code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedManagerForAssignment(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSite}
                  disabled={!selectedSiteIdToAssign}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow-sm disabled:opacity-40 flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5" /> Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
