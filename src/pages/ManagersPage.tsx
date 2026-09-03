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
} from 'lucide-react';
import { Profile, Site, ManagerSiteAssignment } from '../types';
import { db } from '../services/db/database';
import { StatusBadge } from '../components/common/StatusBadge';

export const ManagersPage: React.FC = () => {
  const [managers, setManagers] = useState<Profile[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assignments, setAssignments] = useState<ManagerSiteAssignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedManagerForAssignment, setSelectedManagerForAssignment] = useState<Profile | null>(null);
  const [selectedSiteIdToAssign, setSelectedSiteIdToAssign] = useState<string>('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProfiles, allSites, allAssign] = await Promise.all([
        db.getProfiles(),
        db.getSites(),
        db.getManagerSiteAssignments(),
      ]);

      setManagers(allProfiles.filter((p) => p.role === 'manager'));
      setSites(allSites);
      setAssignments(allAssign);
    } catch (e) {
      console.error('Error loading managers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await db.createProfile({
        full_name: formData.full_name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: 'manager',
        status: 'active',
      });
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', phone: '' });
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create supervisor account');
    } finally {
      setIsSubmitting(false);
    }
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
    if (window.confirm('Remove this site assignment for the supervisor?')) {
      await db.removeManagerSiteAssignment(assignmentId);
      await loadData();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <HardHat className="h-5 w-5 text-sky-500" />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              SITE SUPERVISORS & ACCESS ALLOCATION
            </h2>
            <p className="text-xs text-slate-500">
              Field managers authorized to record attendance for specific excavation sites
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({ full_name: '', email: '', phone: '+91 ' });
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          Create Supervisor Account
        </button>
      </div>

      {/* Managers Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {managers.map((mgr) => {
          const mgrAssignments = assignments.filter((a) => a.manager_id === mgr.id);

          return (
            <div
              key={mgr.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-sky-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold text-sm">
                    {mgr.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{mgr.full_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {mgr.email}</span>
                      {mgr.phone && <span className="flex items-center gap-1 font-mono">• {mgr.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={mgr.status} size="sm" />
                  <button
                    onClick={() => handleToggleStatus(mgr)}
                    title={mgr.status === 'active' ? 'Deactivate' : 'Activate'}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    {mgr.status === 'active' ? <XCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  </button>
                </div>
              </div>

              {/* Assigned Sites Tag Container */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Assigned Operational Sites ({mgrAssignments.length})
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
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 border border-slate-200 text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-semibold text-slate-800">
                            {assign.site?.site_name || 'Site'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            ({assign.site?.site_code})
                          </span>
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

      {/* Add Supervisor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold text-white">Create Site Supervisor Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateManager} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Goud"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email ID</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh.supervisor@svem.in"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98480 00000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Site Modal */}
      {selectedManagerForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold text-white">
                Assign Site to {selectedManagerForAssignment.full_name}
              </h3>
              <button onClick={() => setSelectedManagerForAssignment(null)} className="rounded-lg p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Select Project Site
                </label>
                <select
                  value={selectedSiteIdToAssign}
                  onChange={(e) => setSelectedSiteIdToAssign(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.site_name} ({s.site_code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedManagerForAssignment(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSite}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow-sm"
                >
                  Confirm Site Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
