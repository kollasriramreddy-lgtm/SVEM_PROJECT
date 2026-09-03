import React from 'react';
import { UserCheck, Shield, HardHat, RefreshCw } from 'lucide-react';
import { Profile } from '../../types';
import { db } from '../../services/db/database';

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400">Switch Role:</span>
        <span className="font-semibold text-amber-400">{currentUser.full_name.split(' ')[0]} ({currentUser.role === 'super_admin' ? 'Owner' : 'Supervisor'})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-2 text-slate-200">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Live Role-Based Testing
            </p>
            <p className="text-[11px] text-slate-500">
              Switch role to test site supervisor mobile vs super admin owner permissions.
            </p>
          </div>

          <div className="py-1 space-y-1">
            {profiles.map((p) => {
              const isSelected = p.id === currentUser.id;
              const isSuper = p.role === 'super_admin';

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSuper ? (
                      <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <HardHat className="h-4 w-4 text-sky-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-white">{p.full_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {isSuper ? 'Super Admin / Owner (Full System Access)' : 'Site Manager (Assigned Sites Only)'}
                      </p>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />}
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
              Reset Seed Data to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
