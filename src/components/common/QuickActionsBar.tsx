import React from 'react';
import { Plus, CreditCard, HardHat, HandCoins, Building2, ShoppingBag, Calculator, Sparkles } from 'lucide-react';

interface QuickActionsBarProps {
  onOpenWorkToday: () => void;
  onOpenPayment: () => void;
  onOpenAdvance: () => void;
  onOpenSettlement: () => void;
  onOpenAddClient?: () => void;
  onOpenAddVendor?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenWorkToday,
  onOpenPayment,
  onOpenAdvance,
  onOpenSettlement,
  onOpenAddClient,
  onOpenAddVendor,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Work Done Today - Prominent Button */}
      <button
        onClick={onOpenWorkToday}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-[1.02]"
      >
        <HardHat className="h-4 w-4" />
        <span>Work Done Today</span>
      </button>

      {/* Add Payment */}
      <button
        onClick={onOpenPayment}
        className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-colors"
      >
        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
        <span>+ Add Payment</span>
      </button>

      {/* Add Advance */}
      <button
        onClick={onOpenAdvance}
        className="flex items-center gap-1.5 rounded-xl border border-sky-600/40 bg-sky-950/40 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-900/60 hover:text-white transition-colors"
      >
        <HandCoins className="h-3.5 w-3.5 text-sky-400" />
        <span>+ Issue Advance</span>
      </button>

      {/* Create Settlement */}
      <button
        onClick={onOpenSettlement}
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <Calculator className="h-3.5 w-3.5 text-amber-400" />
        <span>Worker Settlement</span>
      </button>

      {onOpenAddClient && (
        <button
          onClick={onOpenAddClient}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>+ Client</span>
        </button>
      )}

      {onOpenAddVendor && (
        <button
          onClick={onOpenAddVendor}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>+ Vendor</span>
        </button>
      )}
    </div>
  );
};
