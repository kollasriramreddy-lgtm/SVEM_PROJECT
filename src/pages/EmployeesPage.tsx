import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  TrendingUp,
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Profile, Site, Employee, WorkerType } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { StatusBadge } from '../components/common/StatusBadge';
import { SalaryRevisionModal } from '../components/common/SalaryRevisionModal';

interface EmployeesPageProps {
  currentUser: Profile;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('ALL');
  const [selectedWorkerType, setSelectedWorkerType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [salaryRevisionEmployee, setSalaryRevisionEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    phone: '',
    designation: '',
    worker_type: 'Excavator Operator' as WorkerType,
    site_id: '',
    monthly_salary: 28000,
    joining_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEmp, allSites, assignments] = await Promise.all([
        db.getEmployees(),
        db.getSites(),
        db.getManagerSiteAssignments(),
      ]);

      const mySiteIds = isSuperAdmin
        ? allSites.map((s) => s.id)
        : assignments.filter((a) => a.manager_id === currentUser.id).map((a) => a.site_id);

      setSites(allSites.filter((s) => isSuperAdmin || mySiteIds.includes(s.id)));
      setEmployees(allEmp.filter((e) => isSuperAdmin || (e.site_id && mySiteIds.includes(e.site_id))));
    } catch (e) {
      console.error('Error loading employees:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const nextCodeNum = employees.length + 1;
    setFormData({
      employee_code: `SVEM-EMP-00${nextCodeNum}`,
      full_name: '',
      phone: '+91 ',
      designation: 'Excavator Operator',
      worker_type: 'Excavator Operator',
      site_id: sites[0]?.id || '',
      monthly_salary: 28000,
      joining_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      phone: emp.phone || '',
      designation: emp.designation,
      worker_type: emp.worker_type,
      site_id: emp.site_id || '',
      monthly_salary: emp.monthly_salary,
      joining_date: emp.joining_date,
      notes: emp.notes || '',
    });
    setFormError(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setFormError('Employee full name is required.');
      return;
    }
    if (!formData.employee_code.trim()) {
      setFormError('Employee code is required.');
      return;
    }
    if (formData.monthly_salary <= 0) {
      setFormError('Monthly salary must be a positive number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingEmployee) {
        await db.updateEmployee(editingEmployee.id, {
          employee_code: formData.employee_code,
          full_name: formData.full_name,
          phone: formData.phone,
          designation: formData.designation,
          worker_type: formData.worker_type,
          site_id: formData.site_id,
          notes: formData.notes,
        });
        setEditingEmployee(null);
      } else {
        await db.createEmployee({
          employee_code: formData.employee_code,
          full_name: formData.full_name,
          phone: formData.phone,
          designation: formData.designation,
          worker_type: formData.worker_type,
          site_id: formData.site_id,
          monthly_salary: formData.monthly_salary,
          salary_effective_from: formData.joining_date,
          joining_date: formData.joining_date,
          status: 'active',
          notes: formData.notes,
        });
        setIsAddModalOpen(false);
      }

      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save employee record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    const actionWord = nextStatus === 'active' ? 'activate' : 'deactivate';
    if (window.confirm(`Are you sure you want to ${actionWord} ${emp.full_name}?`)) {
      await db.updateEmployee(emp.id, { status: nextStatus });
      await loadData();
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.phone && e.phone.includes(searchQuery)) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSite = selectedSiteId === 'ALL' || e.site_id === selectedSiteId;
    const matchesType = selectedWorkerType === 'ALL' || e.worker_type === selectedWorkerType;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesSite && matchesType && matchesStatus;
  });

  const workerTypes: WorkerType[] = [
    'Excavator Operator',
    'JCB Operator',
    'Rock Driller',
    'Machine Operator',
    'Driver',
    'Laborer',
    'Helper',
    'Supervisor',
    'Blasting Assistant',
  ];

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900">
                WORKFORCE & HEAVY EQUIPMENT OPERATORS
              </h2>
              <p className="text-xs text-slate-500">
                Master employee directory with compensation, site allocations & active statuses
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Operator / Worker
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Project Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.site_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedWorkerType}
              onChange={(e) => setSelectedWorkerType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Worker Types</option>
              {workerTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Master Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-3">Worker Code & Name</th>
                <th className="p-3">Designation / Role</th>
                <th className="p-3">Assigned Site</th>
                {isSuperAdmin && <th className="p-3">Monthly Salary</th>}
                <th className="p-3">Contact</th>
                <th className="p-3">Status</th>
                {isSuperAdmin && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No workforce records matched your query.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-sm">{emp.full_name}</div>
                      <div className="text-[11px] font-mono text-amber-700">{emp.employee_code}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{emp.designation}</div>
                      <div className="text-[10px] text-slate-500">{emp.worker_type}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {emp.site_name || 'Unassigned'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3 font-mono font-bold text-slate-900 text-sm">
                        {formatINR(emp.monthly_salary)}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">
                          Eff: {emp.salary_effective_from || emp.joining_date}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {emp.phone || '-'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={emp.status} size="sm" />
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSalaryRevisionEmployee(emp)}
                            title="Revise Salary"
                            className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300 hover:bg-amber-100"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Salary
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Profile"
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                            className={`rounded-lg p-1.5 border ${
                              emp.status === 'active'
                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {emp.status === 'active' ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || editingEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold text-white">
                {editingEmployee ? `Edit Operator Profile: ${editingEmployee.employee_code}` : 'Add New Operator / Laborer'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEmployee(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Ramesh Nayak"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Lead Excavator Operator"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Worker Category
                  </label>
                  <select
                    value={formData.worker_type}
                    onChange={(e) => setFormData({ ...formData, worker_type: e.target.value as WorkerType })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    {workerTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Assigned Project Site
                  </label>
                  <select
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.site_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98490 00000"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Monthly Salary in INR (₹)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={formData.monthly_salary}
                      onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Machinery Experience / Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Certified on CAT 320D, hydraulic rock breaker and trenching attachment"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Worker' : 'Create Worker Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Revision Modal */}
      {salaryRevisionEmployee && (
        <SalaryRevisionModal
          employee={salaryRevisionEmployee}
          onClose={() => setSalaryRevisionEmployee(null)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
