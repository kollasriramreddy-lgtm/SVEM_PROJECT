import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Building2,
  Trash2,
  CreditCard,
  Check,
  X,
  FileText,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { PurchaseBill, PurchaseBillItem, Vendor, Material, PaymentMode, Profile } from '../types';
import { db } from '../services/db/database';
import { formatINR } from '../services/payroll/payrollEngine';

interface PurchaseBillsPageProps {
  currentUser: Profile;
  onSelectVendorAccount?: (vendorId: string) => void;
}

export const PurchaseBillsPage: React.FC<PurchaseBillsPageProps> = ({
  currentUser,
  onSelectVendorAccount,
}) => {
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Purchase Bill Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [taxAmount, setTaxAmount] = useState('0');
  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<
    { material_id: string; material_name: string; quantity: number; unit_rate: number }[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bills, vList, mList] = await Promise.all([
        db.getPurchaseBills(),
        db.getVendors(),
        db.getMaterials(),
      ]);
      setPurchaseBills(bills);
      setVendors(vList);
      setMaterials(mList);

      if (vList.length > 0) setVendorId(vList[0].id);
      if (mList.length > 0) {
        setItems([
          {
            material_id: mList[0].id,
            material_name: mList[0].material_name,
            quantity: 10,
            unit_rate: mList[0].default_purchase_rate,
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading purchase bills:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (materials.length === 0) return;
    setItems([
      ...items,
      {
        material_id: materials[0].id,
        material_name: materials[0].material_name,
        quantity: 10,
        unit_rate: materials[0].default_purchase_rate,
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'material_id') {
      const mat = materials.find((m) => m.id === value);
      updated[index] = {
        ...updated[index],
        material_id: value,
        material_name: mat ? mat.material_name : '',
        unit_rate: mat ? mat.default_purchase_rate : updated[index].unit_rate,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_rate, 0);
  const totalBillAmount =
    subtotal + (parseFloat(taxAmount) || 0) + (parseFloat(additionalCharges) || 0);
  const numPaid = parseFloat(amountPaid) || 0;
  const creditAmount = Math.max(0, totalBillAmount - numPaid);

  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !billNumber.trim() || items.length === 0) return;

    try {
      const billItems: PurchaseBillItem[] = items.map((i, idx) => ({
        id: `pbi-${idx}`,
        material_id: i.material_id,
        material_name: i.material_name,
        quantity: Number(i.quantity),
        unit_rate: Number(i.unit_rate),
        total_amount: Number(i.quantity) * Number(i.unit_rate),
      }));

      await db.createPurchaseBill({
        vendor_id: vendorId,
        bill_number: billNumber,
        bill_date: billDate,
        subtotal: subtotal,
        tax_amount: parseFloat(taxAmount) || 0,
        additional_charges: parseFloat(additionalCharges) || 0,
        total_amount: totalBillAmount,
        amount_paid: numPaid,
        credit_amount: creditAmount,
        due_date: dueDate,
        payment_mode: paymentMode,
        notes: notes,
        status: creditAmount <= 0 ? 'paid' : numPaid > 0 ? 'partially_paid' : 'unpaid',
        items: billItems,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error creating purchase bill:', err);
    }
  };

  const filteredBills = purchaseBills.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.bill_number.toLowerCase().includes(q) ||
      (b.vendor_name && b.vendor_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vendor Material Purchases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log multi-item supplier bills, automatic stock replenishment & vendor payables
          </p>
        </div>

        <button
          onClick={() => {
            setBillNumber(`INV-${Date.now().toString().slice(-4)}`);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          <span>+ Record Purchase Bill</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, vendor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-[11px] font-bold text-slate-200 uppercase">
              <tr>
                <th className="p-3">Bill Date</th>
                <th className="p-3">Invoice / Bill No</th>
                <th className="p-3">Vendor / Supplier</th>
                <th className="p-3">Items Supplied</th>
                <th className="p-3 text-right">Total Bill Amount</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-right bg-slate-950 text-amber-400">Credit Payable</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{b.bill_date}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{b.bill_number}</td>
                  <td className="p-3 font-bold text-slate-900">{b.vendor_name}</td>
                  <td className="p-3 text-slate-600">
                    {b.items.map((i) => `${i.material_name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">{formatINR(b.total_amount)}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{formatINR(b.amount_paid)}</td>
                  <td className="p-3 text-right font-black text-rose-600 bg-slate-50">
                    {formatINR(b.credit_amount)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        b.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'partially_paid'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Item Purchase Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold">New Material Purchase Consignment Bill</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBill} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Supplier</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.company_name} ({v.vendor_category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill / Invoice Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAX-INV-2026-99"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-2.5 font-bold text-xs text-slate-800 flex justify-between items-center">
                  <span>Purchased Material Items ({items.length})</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add Material Row</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-200 p-2 space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <select
                        value={item.material_id}
                        onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 p-1.5 font-medium"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.material_name} ({m.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 rounded-lg border border-slate-300 p-1.5 font-bold"
                      />

                      <input
                        type="number"
                        step="any"
                        placeholder="Rate ₹"
                        value={item.unit_rate}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded-lg border border-slate-300 p-1.5 font-bold"
                      />

                      <span className="w-28 text-right font-black text-slate-900">
                        {formatINR(item.quantity * item.unit_rate)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Split & Additional Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid Upfront (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Live Balance Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between font-bold">
                <div>
                  <span className="text-slate-500 block font-normal">Total Bill Value:</span>
                  <span className="text-slate-900 font-black text-sm">{formatINR(totalBillAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">Amount Paid:</span>
                  <span className="text-emerald-700">{formatINR(numPaid)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block font-normal">Vendor Credit Payable:</span>
                  <span className="text-rose-600 font-black text-sm">{formatINR(creditAmount)}</span>
                </div>
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
                  Save Purchase Bill & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
