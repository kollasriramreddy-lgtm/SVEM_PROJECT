import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Building2,
  Edit2,
  Check,
  X,
  Tag,
  DollarSign,
  Fuel,
  Wrench,
  Boxes,
} from 'lucide-react';
import { Material, MaterialCategory, Vendor, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';

interface MaterialsPageProps {
  currentUser: Profile;
  onOpenPurchases?: () => void;
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Drill Bits',
  'Tooth Points',
  'Teeth & Adapters',
  'Explosives',
  'Diesel & Oils',
  'Spare Parts',
  'Bucket Repair Items',
  'Compressor Parts',
  'Machine Parts',
  'Other Consumables',
];

export const MaterialsPage: React.FC<MaterialsPageProps> = ({
  currentUser,
  onOpenPurchases,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [formData, setFormData] = useState({
    material_name: '',
    category: 'Drill Bits' as MaterialCategory,
    unit: 'Nos',
    default_purchase_rate: '0',
    default_selling_rate: '0',
    current_stock: '0',
    min_stock_level: '5',
    supplier_id: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const [mList, vList] = await Promise.all([db.getMaterials(), db.getVendors()]);
      setMaterials(mList);
      setVendors(vList);
    } catch (e) {
      console.error('Error loading materials:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mat?: Material) => {
    if (mat) {
      setEditingMaterial(mat);
      setFormData({
        material_name: mat.material_name,
        category: mat.category,
        unit: mat.unit,
        default_purchase_rate: String(mat.default_purchase_rate),
        default_selling_rate: String(mat.default_selling_rate),
        current_stock: String(mat.current_stock),
        min_stock_level: String(mat.min_stock_level),
        supplier_id: mat.supplier_id || '',
        notes: mat.notes || '',
        status: mat.status,
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        material_name: '',
        category: 'Drill Bits',
        unit: 'Nos',
        default_purchase_rate: '0',
        default_selling_rate: '0',
        current_stock: '0',
        min_stock_level: '5',
        supplier_id: vendors[0]?.id || '',
        notes: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await db.updateMaterial({
          ...editingMaterial,
          ...formData,
          default_purchase_rate: parseFloat(formData.default_purchase_rate) || 0,
          default_selling_rate: parseFloat(formData.default_selling_rate) || 0,
          current_stock: parseFloat(formData.current_stock) || 0,
          min_stock_level: parseFloat(formData.min_stock_level) || 0,
        });
      } else {
        await db.createMaterial({
          ...formData,
          default_purchase_rate: parseFloat(formData.default_purchase_rate) || 0,
          default_selling_rate: parseFloat(formData.default_selling_rate) || 0,
          current_stock: parseFloat(formData.current_stock) || 0,
          min_stock_level: parseFloat(formData.min_stock_level) || 0,
        });
      }
      setIsModalOpen(false);
      loadMaterials();
    } catch (err) {
      console.error('Error saving material:', err);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplier_name && m.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = materials.filter((m) => m.current_stock <= m.min_stock_level).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Materials & Stock Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Button drill bits, tooth points, heavy machinery consumables, explosives & diesel stocks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {onOpenPurchases && (
            <button
              onClick={onOpenPurchases}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Boxes className="h-4 w-4 text-amber-500" />
              <span>Purchase Bills</span>
            </button>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Material</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Material Items
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{materials.length} Items</p>
          <span className="text-[11px] text-slate-400">Catalogue items</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Low Stock Alerts
          </span>
          <p
            className={`text-2xl font-black mt-1 ${
              lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount} Items Low
          </p>
          <span className="text-[11px] text-slate-400">Below reorder threshold</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Stock Value
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {formatINR(
              materials.reduce((sum, m) => sum + m.current_stock * m.default_purchase_rate, 0)
            )}
          </p>
          <span className="text-[11px] text-slate-400">Inventory valuation</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search material, category, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-slate-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories ({materials.length})</option>
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
              <tr>
                <th className="p-3">Material Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Purchase Rate</th>
                <th className="p-3">Selling Rate</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3">Stock Health</th>
                <th className="p-3">Preferred Supplier</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMaterials.map((mat) => {
                const isLow = mat.current_stock <= mat.min_stock_level;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{mat.material_name}</td>
                    <td className="p-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {mat.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{mat.unit}</td>
                    <td className="p-3 font-semibold">{formatINR(mat.default_purchase_rate)}</td>
                    <td className="p-3 font-semibold text-emerald-700">
                      {formatINR(mat.default_selling_rate)}
                    </td>
                    <td className="p-3 text-right font-black text-sm text-slate-900">
                      {mat.current_stock} {mat.unit}
                    </td>
                    <td className="p-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                          <AlertTriangle className="h-3 w-3" /> Low Stock (Min: {mat.min_stock_level})
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Optimal Stock
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{mat.supplier_name || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenModal(mat)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h2 className="text-base font-bold">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Material Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 32mm Tungsten Carbide Button Bit"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as MaterialCategory })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  >
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="Nos / Sets / Litres / Kg"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Purchase Rate (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.default_purchase_rate}
                    onChange={(e) => setFormData({ ...formData, default_purchase_rate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling / Client Rate (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.default_selling_rate}
                    onChange={(e) => setFormData({ ...formData, default_selling_rate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Supplier Vendor</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                >
                  <option value="">None</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.company_name} ({v.vendor_category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
