import React from 'react';
import { AttendanceStatus, PayrollPeriodStatus, UserRole } from '../../types';

interface StatusBadgeProps {
  status: AttendanceStatus | PayrollPeriodStatus | UserRole | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Attendance Statuses
    case 'Present':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Absent':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Sunday Duty':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      break;
    case 'Half Day':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    case 'Leave':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Holiday':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;

    // Payroll Period Statuses
    case 'Draft':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'Calculated':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Under Review':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'Approved':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      break;
    case 'Finalized':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-300 font-bold';
      break;

    // Roles
    case 'super_admin':
      colorClasses = 'bg-amber-500 text-slate-950 font-bold border-amber-600';
      break;
    case 'manager':
      colorClasses = 'bg-sky-100 text-sky-800 border-sky-300 font-semibold';
      break;

    // Active/Inactive
    case 'active':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'inactive':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const formatText = (text: string) => {
    if (text === 'super_admin') return 'Super Admin';
    if (text === 'manager') return 'Site Supervisor';
    return text;
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-medium uppercase tracking-wider ${sizeClasses} ${colorClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatText(status)}
    </span>
  );
};
