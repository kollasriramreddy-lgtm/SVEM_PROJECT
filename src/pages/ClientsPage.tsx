import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ArrowUpRight,
  Edit2,
  Eye,
  Check,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Client, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';
import { StatusBadge } from '../components/common/StatusBadge';

interface ClientsPageProps {
  currentUser: Profile;
  onSelectClientAccount: (clientId: string) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  currentUser,
  onSelectClientAccount,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    client_name: '',
    company_name: '',
    phone: '',
    alternate_phone: '',
    address: '',
    gst_number: '',
    opening_balance: '0',
    credit_limit: '1000000',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await db.getClients();
      setClients(data);
    } catch (e) {
      console.error('Error loading clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        client_name: client.client_name,
        company_name: client.company_name,
        phone: client.phone,
        alternate_phone: client.alternate_phone || '',
        address: client.address,
        gst_number: client.gst_number || '',
        opening_balance: String(client.opening_balance),
        credit_limit: String(client.credit_limit || 0),
        notes: client.notes || '',
        status: client.status,
      });
    } else {
      setEditingClient(null);
      setFormData({
        client_name: '',
        company_name: '',
        phone: '',
        alternate_phone: '',
        address: '',
        gst_number: '',
        opening_balance: '0',
        credit_limit: '1000000',
        notes: '',
        status: 'active',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.phone || !formData.address) {
      setError('Please fill in company name, phone and address.');
      return;
    }

    try {
      if (editingClient) {
        await db.updateClient({
          ...editingClient,
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          credit_limit: parseFloat(formData.credit_limit) || 0,
        });
      } else {
        await db.createClient({
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          credit_limit: parseFloat(formData.credit_limit) || 0,
        });
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to save client.');
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.gst_number && c.gst_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReceivables = clients.reduce((sum, c) => sum + Math.max(0, c.current_due || 0), 0);
  const totalBilled = clients.reduce((sum, c) => sum + (c.total_billed || 0), 0);
  const totalPaid = clients.reduce((sum, c) => sum + (c.total_paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clients & Customer Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage project principals, work billing ledger, running balances & collections
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Client</span>
          </button>
        )}
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Client Receivables
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatINR(totalReceivables)}</p>
          <span className="text-[11px] text-slate-400">Net uncollected balance</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Work Billed
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(totalBilled)}</p>
          <span className="text-[11px] text-slate-400">Cumulative site billing</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payments Collected
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalPaid)}</p>
          <span className="text-[11px] text-slate-400">Total received to date</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, phone, GST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Clients ({clients.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const currentDue = client.current_due || 0;
          return (
            <div
              key={client.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 font-black">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {client.company_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{client.client_name}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      client.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{client.phone}</span>
                    {client.alternate_phone && (
                      <span className="text-slate-400">/ {client.alternate_phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.gst_number && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-700">GST: {client.gst_number}</span>
                    </div>
                  )}
                </div>

                {/* Financial Overview Box */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Total Billed:</span>
                    <span className="font-bold text-slate-900">{formatINR(client.total_billed || 0)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Total Paid:</span>
                    <span className="font-bold text-emerald-600">{formatINR(client.total_paid || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200 mt-1 font-black">
                    <span className="text-slate-700">Current Due:</span>
                    <span className={currentDue > 0 ? 'text-rose-600 text-sm' : 'text-emerald-700'}>
                      {formatINR(currentDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenModal(client)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => onSelectClientAccount(client.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                  <span>View Account Ledger →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold">
                  {editingClient ? 'Edit Client Details' : 'Add New Client Profile'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aparna Infra Projects"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Venkatesh Rao (Director)"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98490 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    placeholder="Optional phone"
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Billing & Office Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street, Area, City, Telangana PIN"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="36AAAAA0000A1Z5"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Scope Details</label>
                <input
                  type="text"
                  placeholder="e.g. Major contract for cellar excavation & controlled blasting"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingClient ? 'Save Changes' : 'Create Client Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
