import React from 'react';
import {
  LayoutDashboard,
  Users,
  HardHat,
  MapPin,
  CalendarCheck,
  History,
  Calculator,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  X,
  ChevronRight,
  TrendingUp,
  Building2,
  CreditCard,
  HandCoins,
  Package,
  Boxes,
  Activity,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
  category?: string;
}

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isOpen,
  onClose,
}) => {
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'owner';

  const navItems: NavItem[] = [
    // 1. Dashboard & Core Work
    { id: 'dashboard', label: 'Accounts Dashboard', icon: LayoutDashboard, category: 'Core Accounts' },
    { id: 'daily-work', label: 'Daily Work Tracking', icon: Activity, badge: 'Field', category: 'Core Accounts' },
    
    // 2. Financial Accounts & Ledger
    { id: 'clients', label: 'Clients & Customers', icon: Building2, category: 'Accounts & Ledger' },
    { id: 'vendors', label: 'Vendors & Suppliers', icon: Building2, category: 'Accounts & Ledger' },
    { id: 'payment-history', label: 'Payment History', icon: CreditCard, badge: 'Vouchers', category: 'Accounts & Ledger' },
    { id: 'advances', label: 'Advances Register', icon: HandCoins, category: 'Accounts & Ledger' },
    { id: 'materials', label: 'Materials & Stock', icon: Package, category: 'Accounts & Ledger' },
    { id: 'purchases', label: 'Purchase Bills', icon: Boxes, category: 'Accounts & Ledger' },

    // 3. Workforce & Attendance
    { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck, badge: 'Field', category: 'Workforce & Sites' },
    { id: 'attendance-history', label: 'Attendance Matrix', icon: History, category: 'Workforce & Sites' },
    { id: 'sites', label: isSuperAdmin ? 'Sites Management' : 'My Assigned Sites', icon: MapPin, category: 'Workforce & Sites' },
    { id: 'employees', label: isSuperAdmin ? 'Workforce & Operators' : 'Assigned Workers', icon: Users, category: 'Workforce & Sites' },
    { id: 'managers', label: 'Site Supervisors', icon: HardHat, adminOnly: true, category: 'Workforce & Sites' },

    // 4. Payroll & Administration
    { id: 'payroll', label: 'Payroll Engine', icon: Calculator, adminOnly: true, badge: 'Core', category: 'Reports & Admin' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, adminOnly: true, category: 'Reports & Admin' },
    { id: 'audit-logs', label: 'Security Audit Trail', icon: ShieldAlert, adminOnly: true, category: 'Reports & Admin' },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true, category: 'Reports & Admin' },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isSuperAdmin);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 lg:hidden">
          <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
            Navigation Menu
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Operational Scope Banner for Manager */}
        {!isSuperAdmin && (
          <div className="mx-3 mt-4 rounded-xl border border-sky-800/40 bg-sky-950/40 p-3 text-xs text-sky-200">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
              <HardHat className="h-4 w-4" />
              Supervisor Field Mode
            </div>
            <p className="text-[11px] text-sky-300/80">
              Access enabled for field work entry, attendance & assigned sites.
            </p>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {visibleItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const prevItem = visibleItems[idx - 1];
            const isNewCategory = !prevItem || prevItem.category !== item.category;

            return (
              <React.Fragment key={item.id}>
                {isNewCategory && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.category}
                  </div>
                )}

                <button
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                          isActive
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-950" />}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer Company Identity */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/40">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">Siddi Vinayaka Earth Movers</p>
              <p className="text-[10px] text-slate-500">v3.0 Contractor Accounts & Work</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
