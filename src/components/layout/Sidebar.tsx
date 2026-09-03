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
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
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
  const isSuperAdmin = userRole === 'super_admin';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck, badge: 'Field' },
    { id: 'attendance-history', label: 'Attendance History', icon: History },
    { id: 'sites', label: isSuperAdmin ? 'Sites Management' : 'My Assigned Sites', icon: MapPin },
    { id: 'employees', label: isSuperAdmin ? 'Employees & Operators' : 'Assigned Workers', icon: Users },
    { id: 'managers', label: 'Site Supervisors', icon: HardHat, adminOnly: true },
    { id: 'payroll', label: 'Payroll Engine', icon: Calculator, adminOnly: true, badge: 'Core' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, adminOnly: true },
    { id: 'audit-logs', label: 'Audit Trail', icon: ShieldAlert, adminOnly: true },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
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

      {/* Sidebar Drawer / Aside */}
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
              Access restricted to your assigned operational excavation sites.
            </p>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations & Management
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
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
            );
          })}
        </nav>

        {/* Footer Company Identity */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/40">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">Siddi Vinayaka Earth Movers</p>
              <p className="text-[10px] text-slate-500">v2.4 Production • Hyderabad</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
