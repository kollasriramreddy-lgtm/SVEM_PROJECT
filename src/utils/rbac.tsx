import React from 'react';
import { UserRole } from '../types';

export type Permission =
  // Dashboard
  | 'view:dashboard'
  | 'view:financial_metrics'
  // Daily Work
  | 'view:daily_work'
  | 'create:daily_work'
  | 'edit:daily_work'
  // Clients
  | 'view:clients'
  | 'create:clients'
  | 'edit:clients'
  | 'delete:clients'
  | 'settle:client_account'
  // Vendors
  | 'view:vendors'
  | 'create:vendors'
  | 'edit:vendors'
  | 'delete:vendors'
  | 'settle:vendor_account'
  // Payments
  | 'view:payments'
  | 'create:payments'
  | 'print:receipts'
  | 'delete:payments'
  // Advances
  | 'view:advances'
  | 'create:advances'
  | 'settle:advances'
  // Materials
  | 'view:materials'
  | 'create:materials'
  | 'edit:materials'
  // Purchase Bills
  | 'view:purchase_bills'
  | 'create:purchase_bills'
  | 'pay:purchase_bills'
  // Attendance
  | 'view:attendance'
  | 'mark:attendance'
  | 'edit:attendance_history'
  // Workforce
  | 'view:employees'
  | 'create:employees'
  | 'edit:employees'
  | 'delete:employees'
  | 'view:worker_salary'
  | 'settle:worker_account'
  // Supervisors management
  | 'view:supervisors'
  | 'manage:supervisors'
  | 'assign:sites'
  // Sites
  | 'view:sites'
  | 'manage:sites'
  // Payroll
  | 'view:payroll'
  | 'calculate:payroll'
  | 'approve:payroll'
  | 'lock:payroll'
  // Admin
  | 'view:reports'
  | 'export:reports'
  | 'view:audit_logs'
  | 'manage:system_settings'
  | 'manage:user_roles';

export interface RoleConfig {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  defaultTab: string;
  permissions: Permission[];
}

const ALL_PERMISSIONS: Permission[] = [
  'view:dashboard', 'view:financial_metrics',
  'view:daily_work', 'create:daily_work', 'edit:daily_work',
  'view:clients', 'create:clients', 'edit:clients', 'delete:clients', 'settle:client_account',
  'view:vendors', 'create:vendors', 'edit:vendors', 'delete:vendors', 'settle:vendor_account',
  'view:payments', 'create:payments', 'print:receipts', 'delete:payments',
  'view:advances', 'create:advances', 'settle:advances',
  'view:materials', 'create:materials', 'edit:materials',
  'view:purchase_bills', 'create:purchase_bills', 'pay:purchase_bills',
  'view:attendance', 'mark:attendance', 'edit:attendance_history',
  'view:employees', 'create:employees', 'edit:employees', 'delete:employees',
  'view:worker_salary', 'settle:worker_account',
  'view:supervisors', 'manage:supervisors', 'assign:sites',
  'view:sites', 'manage:sites',
  'view:payroll', 'calculate:payroll', 'approve:payroll', 'lock:payroll',
  'view:reports', 'export:reports', 'view:audit_logs',
  'manage:system_settings', 'manage:user_roles',
];

// Permissions for a Site Supervisor (field role)
const SUPERVISOR_PERMISSIONS: Permission[] = [
  'view:daily_work', 'create:daily_work', 'edit:daily_work',
  'view:attendance', 'mark:attendance', 'edit:attendance_history',
  'view:employees',
  'view:sites',
  'view:advances', 'create:advances',
  'view:materials',
  'view:purchase_bills', 'create:purchase_bills',
];

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    role: 'super_admin',
    title: 'Super Admin (Owner)',
    badge: 'Super Admin',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Full unrestricted access. Manages supervisor accounts, site assignments, payroll, and all financial operations.',
    defaultTab: 'dashboard',
    permissions: ALL_PERMISSIONS,
  },
  owner: {
    role: 'owner',
    title: 'Business Owner',
    badge: 'Owner',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Full unrestricted access. Equivalent to Super Admin.',
    defaultTab: 'dashboard',
    permissions: ALL_PERMISSIONS,
  },
  manager: {
    role: 'manager',
    title: 'Site Supervisor',
    badge: 'Site Supervisor',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Field supervisor: daily work entry, attendance marking, advance recording for assigned sites.',
    defaultTab: 'daily-work',
    permissions: SUPERVISOR_PERMISSIONS,
  },
  // These roles are kept for type compatibility but not used in the simplified system
  site_manager: {
    role: 'site_manager',
    title: 'Site Supervisor',
    badge: 'Site Supervisor',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Field supervisor with limited access.',
    defaultTab: 'daily-work',
    permissions: SUPERVISOR_PERMISSIONS,
  },
  supervisor: {
    role: 'supervisor',
    title: 'Site Supervisor',
    badge: 'Site Supervisor',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Field supervisor with limited access.',
    defaultTab: 'daily-work',
    permissions: SUPERVISOR_PERMISSIONS,
  },
  accountant: {
    role: 'accountant',
    title: 'Accountant',
    badge: 'Accountant',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Finance and accounts management.',
    defaultTab: 'dashboard',
    permissions: SUPERVISOR_PERMISSIONS,
  },
  data_entry: {
    role: 'data_entry',
    title: 'Data Entry',
    badge: 'Data Entry',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Data entry operator.',
    defaultTab: 'daily-work',
    permissions: SUPERVISOR_PERMISSIONS,
  },
  viewer: {
    role: 'viewer',
    title: 'Viewer',
    badge: 'Viewer',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    description: 'Read-only viewer.',
    defaultTab: 'dashboard',
    permissions: ['view:dashboard', 'view:attendance', 'view:daily_work', 'view:sites', 'view:employees'],
  },
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.permissions.includes(permission);
}

export const TAB_PERMISSIONS: Record<string, Permission> = {
  'dashboard': 'view:dashboard',
  'daily-work': 'view:daily_work',
  'clients': 'view:clients',
  'vendors': 'view:vendors',
  'payment-history': 'view:payments',
  'advances': 'view:advances',
  'materials': 'view:materials',
  'purchases': 'view:purchase_bills',
  'attendance': 'view:attendance',
  'attendance-history': 'view:attendance',
  'sites': 'view:sites',
  'employees': 'view:employees',
  'managers': 'manage:supervisors',
  'payroll': 'view:payroll',
  'reports': 'view:reports',
  'audit-logs': 'view:audit_logs',
  'settings': 'manage:system_settings',
};

export function canAccessTab(role: UserRole, tabId: string): boolean {
  const requiredPermission = TAB_PERMISSIONS[tabId];
  if (!requiredPermission) return true;
  return hasPermission(role, requiredPermission);
}

export function getDefaultTabForRole(role: UserRole): string {
  const config = ROLE_CONFIGS[role];
  if (config && canAccessTab(role, config.defaultTab)) {
    return config.defaultTab;
  }
  return 'daily-work';
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'owner';
}

export function isSupervisor(role: UserRole): boolean {
  return role === 'manager' || role === 'site_manager' || role === 'supervisor';
}

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS.manager;
}

interface PermissionGuardProps {
  role: UserRole;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  role,
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null,
}) => {
  const checkPermissions = permission ? [permission, ...permissions] : permissions;
  if (checkPermissions.length === 0) return <>{children}</>;
  const hasAccess = requireAll
    ? checkPermissions.every((p) => hasPermission(role, p))
    : checkPermissions.some((p) => hasPermission(role, p));
  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
};
