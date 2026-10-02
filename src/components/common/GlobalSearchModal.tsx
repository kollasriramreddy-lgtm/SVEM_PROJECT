import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Building2,
  Users,
  HardHat,
  CreditCard,
  FileSpreadsheet,
  Package,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/db/database';
import { formatINR } from '../../services/payroll/payrollEngine';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (tabId: string, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clients: any[];
    vendors: any[];
    employees: any[];
    payments: any[];
    purchaseBills: any[];
    materials: any[];
    sites: any[];
  }>({
    clients: [],
    vendors: [],
    employees: [],
    payments: [],
    purchaseBills: [],
    materials: [],
    sites: [],
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({
        clients: [],
        vendors: [],
        employees: [],
        payments: [],
        purchaseBills: [],
        materials: [],
        sites: [],
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const res = await db.globalSearch(query);
        setResults(res);
      } else {
        setResults({
          clients: [],
          vendors: [],
          employees: [],
          payments: [],
          purchaseBills: [],
          materials: [],
          sites: [],
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits =
    results.clients.length +
    results.vendors.length +
    results.employees.length +
    results.payments.length +
    results.purchaseBills.length +
    results.materials.length +
    results.sites.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 pt-16 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
          <Search className="h-5 w-5 text-amber-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search clients, vendors, workers, transactions, bills, sites..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all operational & financial modules.
            </div>
          )}

          {query.trim().length >= 2 && totalHits === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching accounts, transactions or entities found for "{query}".
            </div>
          )}

          {/* Clients */}
          {results.clients.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Clients ({results.clients.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {results.clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectEntity('clients', c.id);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between p-2.5 text-xs hover:bg-amber-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-bold text-slate-900">{c.company_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {c.client_name} • Phone: {c.phone}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {results.vendors.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Vendors & Suppliers ({results.vendors.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {results.vendors.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelectEntity('vendors', v.id);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between p-2.5 text-xs hover:bg-amber-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <div>
                        <p className="font-bold text-slate-900">{v.company_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {v.vendor_category} • Phone: {v.phone}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workers & Operators */}
          {results.employees.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Workers & Machine Operators ({results.employees.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {results.employees.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      onSelectEntity('employees', w.id);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between p-2.5 text-xs hover:bg-amber-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <HardHat className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="font-bold text-slate-900">{w.full_name}</p>
                        <p className="text-[10px] text-slate-500">
                          {w.employee_code} • {w.worker_type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {results.payments.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Payments & Vouchers ({results.payments.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {results.payments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectEntity('payments', p.id);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between p-2.5 text-xs hover:bg-amber-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-900">
                          {p.transaction_id} — {p.account_name} ({p.payment_direction})
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {p.payment_date} • {p.payment_mode} • {p.description}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">{formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
