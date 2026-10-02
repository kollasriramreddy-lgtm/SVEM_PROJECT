import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Edit2,
  Eye,
  Check,
  X,
  AlertCircle,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { Vendor, VendorCategory, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';

interface VendorsPageProps {
  currentUser: Profile;
  onSelectVendorAccount: (vendorId: string) => void;
}

const VENDOR_CATEGORIES: VendorCategory[] = [
  'Explosive Supplier',
  'Drill-bit Supplier',
  'Tooth-point Supplier',
  'Equipment Repair Vendor',
  'Bucket Repair Vendor',
  'Diesel Supplier',
  'Spare-parts Supplier',
  'Compressor Spares',
  'Hydraulic Oil Supplier',
  'Other Material Supplier',
];

export const VendorsPage: React.FC<VendorsPageProps> = ({
  currentUser,
  onSelectVendorAccount,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
    vendor_name: '',
    company_name: '',
    phone: '',
    address: '',
    gst_number: '',
    vendor_category: 'Drill-bit Supplier' as VendorCategory,
    opening_balance: '0',
    credit_limit: '500000',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await db.getVendors();
      setVendors(data);
    } catch (e) {
      console.error('Error loading vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        vendor_name: vendor.vendor_name,
        company_name: vendor.company_name,
        phone: vendor.phone,
        address: vendor.address,
        gst_number: vendor.gst_number || '',
        vendor_category: vendor.vendor_category,
        opening_balance: String(vendor.opening_balance),
        credit_limit: String(vendor.credit_limit || 0),
        notes: vendor.notes || '',
        status: vendor.status,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        vendor_name: '',
        company_name: '',
        phone: '',
        address: '',
        gst_number: '',
        vendor_category: 'Drill-bit Supplier',
        opening_balance: '0',
        credit_limit: '500000',
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
      if (editingVendor) {
        await db.updateVendor({
          ...editingVendor,
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          credit_limit: parseFloat(formData.credit_limit) || 0,
        });
      } else {
        await db.createVendor({
          ...formData,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          credit_limit: parseFloat(formData.credit_limit) || 0,
        });
      }
      setIsModalOpen(false);
      loadVendors();
    } catch (err: any) {
      setError(err.message || 'Failed to save vendor.');
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery) ||
      (v.gst_number && v.gst_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || v.vendor_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPayables = vendors.reduce(
    (sum, v) => sum + (v.balance_type === 'payable' ? v.current_balance || 0 : 0),
    0
  );
  const totalPurchases = vendors.reduce((sum, v) => sum + (v.total_purchases || 0), 0);
  const totalPaidOut = vendors.reduce((sum, v) => sum + (v.total_payments_made || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vendors & Suppliers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explosives, Drill Bits, Diesel, Tooth Points, Machinery Spares & Maintenance Accounts
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Vendor</span>
          </button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Vendor Payables
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">{formatINR(totalPayables)}</p>
          <span className="text-[11px] text-slate-400">Net outstanding unpaid bills</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Material Purchases
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatINR(totalPurchases)}</p>
          <span className="text-[11px] text-slate-400">Total invoice supplies</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payments Made
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalPaidOut)}</p>
          <span className="text-[11px] text-slate-400">Disbursed via bank / cash</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, category, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories ({vendors.length})</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.map((vendor) => {
          const currentBal = vendor.current_balance || 0;
          return (
            <div
              key={vendor.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600 font-black">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {vendor.company_name}
                      </h3>
                      <span className="mt-0.5 inline-block rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                        {vendor.vendor_category}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      vendor.balance_type === 'payable'
                        ? 'bg-amber-100 text-amber-800'
                        : vendor.balance_type === 'receivable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {vendor.balance_type === 'payable'
                      ? 'Payable'
                      : vendor.balance_type === 'receivable'
                      ? 'Advance Receivable'
                      : 'Settled'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                  {vendor.gst_number && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">GST: {vendor.gst_number}</span>
                    </div>
                  )}
                </div>

                {/* Balance Summary Box */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Purchases:</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(vendor.total_purchases || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Payments Made:</span>
                    <span className="font-bold text-emerald-600">
                      {formatINR(vendor.total_payments_made || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200 mt-1 font-black">
                    <span className="text-slate-700">Remaining Balance:</span>
                    <span className={currentBal > 0 ? 'text-amber-700 text-sm' : 'text-slate-800'}>
                      {formatINR(currentBal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenModal(vendor)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => onSelectVendorAccount(vendor.id)}
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

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold">
                  {editingVendor ? 'Edit Vendor Details' : 'Add New Vendor / Supplier'}
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
                    Company / Trade Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maxwell Mining Supplies"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vendor Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.vendor_category}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_category: e.target.value as VendorCategory })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar (Manager)"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98495 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor Address / Shop Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street, Industrial Area, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="36AAAAA0000A1Z5"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Payable (₹)</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Consignment Details</label>
                <input
                  type="text"
                  placeholder="e.g. Authorized distributor for carbide drill button bits"
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
                  <span>{editingVendor ? 'Save Changes' : 'Create Vendor Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
