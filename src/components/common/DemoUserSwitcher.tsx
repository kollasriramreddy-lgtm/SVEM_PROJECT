import React from 'react';
import { UserCheck, Shield, HardHat, RefreshCw, CreditCard, FileText, Eye, ChevronDown } from 'lucide-react';
import { Profile, UserRole } from '../../types';
import { db } from '../../services/db/database';
import { getRoleConfig } from '../../utils/rbac';

interface DemoUserSwitcherProps {
  currentUser: Profile;
  onUserChange: (user: Profile) => void;
}

export const DemoUserSwitcher: React.FC<DemoUserSwitcherProps> = ({
  currentUser,
  onUserChange,
}) => {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    db.getProfiles().then(setProfiles);
  }, []);

  const handleSelect = async (profile: Profile) => {
    await db.setCurrentUser(profile);
    onUserChange(profile);
    setIsOpen(false);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset database to clean Hyderabad operations seed data?')) {
      await db.resetDemoData();
      window.location.reload();
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
      case 'owner':
        return <Shield className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'accountant':
        return <CreditCard className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'manager':
      case 'site_manager':
      case 'supervisor':
        return <HardHat className="h-4 w-4 text-sky-400 shrink-0" />;
      case 'data_entry':
        return <FileText className="h-4 w-4 text-purple-400 shrink-0" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-slate-400 shrink-0" />;
      default:
        return <Shield className="h-4 w-4 text-amber-400 shrink-0" />;
    }
  };

  const currentRoleConfig = getRoleConfig(currentUser.role);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400 hidden sm:inline">Role:</span>
        <span className="font-bold text-amber-400">{currentUser.full_name.split(' ')[0]}</span>
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${currentRoleConfig.badgeColor}`}>
          {currentRoleConfig.badge}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-2 text-slate-200">
          <div className="px-3 py-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Live RBAC Role Switcher
              </p>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                {profiles.length} Roles
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Switch roles to experience instant permission & UI adaptation.
            </p>
          </div>

          <div className="py-1.5 space-y-1 max-h-80 overflow-y-auto">
            {profiles.map((p) => {
              const isSelected = p.id === currentUser.id;
              const config = getRoleConfig(p.role);

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">{getRoleIcon(p.role)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white truncate">{p.full_name}</p>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${config.badgeColor}`}>
                          {config.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="h-4 w-4 text-amber-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-800 px-2 pb-1">
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] text-slate-400 hover:text-rose-300 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Demo Data to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
