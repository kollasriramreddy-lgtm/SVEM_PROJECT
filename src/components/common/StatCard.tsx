import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'amber',
  onClick,
}) => {
  const accentStyles = {
    amber: 'border-amber-400/40 bg-amber-50/20 text-amber-600',
    emerald: 'border-emerald-400/40 bg-emerald-50/20 text-emerald-600',
    blue: 'border-blue-400/40 bg-blue-50/20 text-blue-600',
    purple: 'border-purple-400/40 bg-purple-50/20 text-purple-600',
    rose: 'border-rose-400/40 bg-rose-50/20 text-rose-600',
    slate: 'border-slate-300/60 bg-slate-100/40 text-slate-700',
  }[accentColor];

  const iconBgStyles = {
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    rose: 'bg-rose-100 text-rose-800',
    slate: 'bg-slate-200 text-slate-800',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-amber-400' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-3 ${iconBgStyles}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs last month</span>
        </div>
      )}

      {/* Decorative top accent line */}
      <div className={`absolute left-0 top-0 h-1 w-full ${accentStyles.split(' ')[0]}`} />
    </div>
  );
};
