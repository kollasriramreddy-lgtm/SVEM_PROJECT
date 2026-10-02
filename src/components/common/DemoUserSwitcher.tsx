import React from 'react';
import { UserCheck, Shield, HardHat, ChevronDown } from 'lucide-react';
import { Profile } from '../../types';
import { db } from '../../services/db/database';
import { getRoleConfig, isSuperAdmin } from '../../utils/rbac';

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

  const currentRoleConfig = getRoleConfig(currentUser.role);
  const isAdmin = isSuperAdmin(currentUser.role);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden sm:inline text-slate-400">Role:</span>
        <span className="font-bold text-amber-400">{currentUser.full_name.split(' ')[0]}</span>
        <span className={`hidden sm:inline rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${currentRoleConfig.badgeColor}`}>
          {currentRoleConfig.badge}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Switch Role</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Super Admin or Site Supervisor access</p>
          </div>

          <div className="py-2 space-y-1 px-2">
            {profiles.map((p) => {
              const isSelected = p.id === currentUser.id;
              const config = getRoleConfig(p.role);
              const isAdminProfile = isSuperAdmin(p.role);

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isAdminProfile
                      ? <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                      : <HardHat className="h-4 w-4 text-sky-400 shrink-0" />
                    }
                    <div>
                      <p className="font-bold text-white">{p.full_name}</p>
                      <p className="text-[10px] text-slate-400">{config.title} • {p.email}</p>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {!isAdmin && (
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/40">
              <p className="text-[10px] text-slate-500 text-center">
                Supervisors: use credentials assigned by Super Admin to log in
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
