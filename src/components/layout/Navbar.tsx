import React from 'react';
import {
  Menu,
  Bell,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
  Search,
  CreditCard,
} from 'lucide-react';
import { Profile, CompanySettings } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DemoUserSwitcher } from '../common/DemoUserSwitcher';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { hasPermission } from '../../utils/rbac';

interface NavbarProps {
  currentUser: Profile;
  company: CompanySettings;
  onToggleSidebar: () => void;
  onUserChange: (user: Profile) => void;
  onLogout: () => void;
  currentPageTitle: string;
  onOpenSearch: () => void;
  onOpenPaymentModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  company,
  onToggleSidebar,
  onUserChange,
  onLogout,
  currentPageTitle,
  onOpenSearch,
  onOpenPaymentModal,
}) => {
  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const canCreatePayments = hasPermission(currentUser.role, 'create:payments');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6 shadow-md">
      {/* Left: Mobile Menu Trigger + Brand & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Earthmover Icon / Monogram */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-inner shadow-black/20">
            SV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white sm:text-base hidden sm:inline">
                {company.company_name}
              </span>
              <span className="text-sm font-bold tracking-tight text-white sm:hidden">
                SVEM
              </span>
              <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                Accounts & Work
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="text-slate-200 font-medium">{currentPageTitle}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-400" /> Hyderabad
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center/Right: Global Search, Quick Actions, Switcher, Alerts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Global Entity Search (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden md:inline font-medium">Search accounts...</span>
          <kbd className="hidden lg:inline rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Central Add Payment Button */}
        {canCreatePayments && (
          <button
            onClick={onOpenPaymentModal}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            title="Central Payment Entry"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>+ Payment</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* Current Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>{todayStr}</span>
        </div>

        {/* Demo Fast Switcher */}
        <DemoUserSwitcher currentUser={currentUser} onUserChange={onUserChange} />

        {/* User Info & Role */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
            <div className="mt-0.5">
              <StatusBadge status={currentUser.role} size="sm" />
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
