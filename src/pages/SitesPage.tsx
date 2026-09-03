import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Users, Building, AlertCircle, HardHat } from 'lucide-react';
import { Profile, Site, Employee, ManagerSiteAssignment } from '../types';
import { db } from '../services/db/database';
import { StatusBadge } from '../components/common/StatusBadge';

interface SitesPageProps {
  currentUser: Profile;
}

export const SitesPage: React.FC<SitesPageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ManagerSiteAssignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [formData, setFormData] = useState({
    site_name: '',
    site_code: '',
    client_name: '',
    location: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSites, allEmp, allAssign] = await Promise.all([
        db.getSites(),
        db.getEmployees(),
        db.getManagerSiteAssignments(),
      ]);

      const mySiteIds = isSuperAdmin
        ? allSites.map((s) => s.id)
        : allAssign.filter((a) => a.manager_id === currentUser.id).map((a) => a.site_id);

      setSites(allSites.filter((s) => isSuperAdmin || mySiteIds.includes(s.id)));
      setEmployees(allEmp);
      setAssignments(allAssign);
    } catch (e) {
      console.error('Error loading sites:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const codeNum = sites.length + 1;
    setFormData({
      site_name: '',
      site_code: `SVEM-SITE-00${codeNum}`,
      client_name: '',
      location: 'Hyderabad, Telangana',
      description: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      site_name: site.site_name,
      site_code: site.site_code,
      client_name: site.client_name,
      location: site.location,
      description: site.description || '',
    });
    setFormError(null);
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site_name.trim() || !formData.site_code.trim()) {
      setFormError('Site Name and Site Code are mandatory.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingSite) {
        await db.updateSite(editingSite.id, formData);
        setEditingSite(null);
      } else {
        await db.createSite({
          ...formData,
          status: 'active',
        });
        setIsAddModalOpen(false);
      }

      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save site');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              PROJECT SITES & EXCAVATION LOCATIONS
            </h2>
            <p className="text-xs text-slate-500">
              Active blasting, rock drilling, cellar excavation and demolition projects
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Project Site
          </button>
        )}
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => {
          const siteWorkers = employees.filter((e) => e.site_id === site.id && e.status === 'active');
          const siteSupervisors = assignments.filter((a) => a.site_id === site.id);

          return (
            <div
              key={site.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {site.site_code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={site.status} size="sm" />
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleOpenEdit(site)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit site"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{site.site_name}</h3>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Client: <strong className="text-slate-800">{site.client_name}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {site.location}
                </p>

                {site.description && (
                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {site.description}
                  </p>
                )}
              </div>

              {/* Footer Site Counts */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="font-bold">{siteWorkers.length}</span> Active Workers
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <HardHat className="h-4 w-4 text-sky-600" />
                  <span>{siteSupervisors.length} Supervisor(s)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingSite) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold text-white">
                {editingSite ? `Edit Site: ${editingSite.site_code}` : 'Add Project Site'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSite(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSite} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Site Name</label>
                <input
                  type="text"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="e.g. Outer Ring Road Rock Cutting & Blasting Site"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Site Code</label>
                  <input
                    type="text"
                    value={formData.site_code}
                    onChange={(e) => setFormData({ ...formData, site_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="e.g. HMDA Infra"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Location Address</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. ORR Exit 12, Hyderabad"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Operational Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Pneumatic drilling, controlled blasting, 20-ton CAT excavator muck loading"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSite(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSite ? 'Update Site' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
