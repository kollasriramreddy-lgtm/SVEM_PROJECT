import React from 'react';
import { UserRole } from '../types';

export type Permission =
  // Dashboard & Financials
  | 'view:dashboard'
  | 'view:financial_metrics'
  | 'view:executive_summary'
  // Daily Work & Field
  | 'view:daily_work'
  | 'create:daily_work'
  | 'edit:daily_work'
  | 'delete:daily_work'
  // Clients & Ledgers
  | 'view:clients'
  | 'create:clients'
  | 'edit:clients'
  | 'delete:clients'
  | 'settle:client_account'
  // Vendors & Ledgers
  | 'view:vendors'
  | 'create:vendors'
  | 'edit:vendors'
  | 'delete:vendors'
  | 'settle:vendor_account'
  // Payments & Receipts
  | 'view:payments'
  | 'create:payments'
  | 'print:receipts'
  | 'delete:payments'
  // Advances
  | 'view:advances'
  | 'create:advances'
  | 'settle:advances'
  // Materials & Stock
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
  // Workforce & Workers
  | 'view:employees'
  | 'create:employees'
  | 'edit:employees'
  | 'delete:employees'
  | 'view:worker_salary'
  | 'settle:worker_account'
  // Supervisors / Managers
  | 'view:supervisors'
  | 'manage:supervisors'
  | 'assign:sites'
  // Sites
  | 'view:sites'
  | 'manage:sites'
  // Payroll Engine
  | 'view:payroll'
  | 'calculate:payroll'
  | 'approve:payroll'
  | 'lock:payroll'
  // Administration & Security
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
  'view:dashboard',
  'view:financial_metrics',
  'view:executive_summary',
  'view:daily_work',
  'create:daily_work',
  'edit:daily_work',
  'delete:daily_work',
  'view:clients',
  'create:clients',
  'edit:clients',
  'delete:clients',
  'settle:client_account',
  'view:vendors',
  'create:vendors',
  'edit:vendors',
  'delete:vendors',
  'settle:vendor_account',
  'view:payments',
  'create:payments',
  'print:receipts',
  'delete:payments',
  'view:advances',
  'create:advances',
  'settle:advances',
  'view:materials',
  'create:materials',
  'edit:materials',
  'view:purchase_bills',
  'create:purchase_bills',
  'pay:purchase_bills',
  'view:attendance',
  'mark:attendance',
  'edit:attendance_history',
  'view:employees',
  'create:employees',
  'edit:employees',
  'delete:employees',
  'view:worker_salary',
  'settle:worker_account',
  'view:supervisors',
  'manage:supervisors',
  'assign:sites',
  'view:sites',
  'manage:sites',
  'view:payroll',
  'calculate:payroll',
  'approve:payroll',
  'lock:payroll',
  'view:reports',
  'export:reports',
  'view:audit_logs',
  'manage:system_settings',
  'manage:user_roles',
];

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    role: 'super_admin',
    title: 'Super Admin (Owner)',
    badge: 'Super Admin',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Complete unrestricted access across all financial, operational, and system settings.',
    defaultTab: 'dashboard',
    permissions: ALL_PERMISSIONS,
  },
  owner: {
    role: 'owner',
    title: 'Business Owner',
    badge: 'Owner',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Full executive control, financial approvals, ledger settlements, and audit monitoring.',
    defaultTab: 'dashboard',
    permissions: ALL_PERMISSIONS,
  },
  accountant: {
    role: 'accountant',
    title: 'Chief Accountant & Cashier',
    badge: 'Accountant',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Financial management, client/vendor ledgers, vouchers, purchase bills, payments, and payroll calculation.',
    defaultTab: 'dashboard',
    permissions: [
      'view:dashboard',
      'view:financial_metrics',
      'view:executive_summary',
      'view:daily_work',
      'view:clients',
      'create:clients',
      'edit:clients',
      'settle:client_account',
      'view:vendors',
      'create:vendors',
      'edit:vendors',
      'settle:vendor_account',
      'view:payments',
      'create:payments',
      'print:receipts',
      'view:advances',
      'create:advances',
      'settle:advances',
      'view:materials',
      'create:materials',
      'edit:materials',
      'view:purchase_bills',
      'create:purchase_bills',
      'pay:purchase_bills',
      'view:attendance',
      'view:employees',
      'view:worker_salary',
      'settle:worker_account',
      'view:sites',
      'view:payroll',
      'calculate:payroll',
      'view:reports',
      'export:reports',
    ],
  },
  manager: {
    role: 'manager',
    title: 'Site Operations Manager',
    badge: 'Site Manager',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Site management, machine dispatching, field work entries, workforce attendance & local advance recording.',
    defaultTab: 'daily-work',
    permissions: [
      'view:dashboard',
      'view:daily_work',
      'create:daily_work',
      'edit:daily_work',
      'view:clients',
      'view:vendors',
      'view:payments',
      'print:receipts',
      'view:advances',
      'create:advances',
      'view:materials',
      'view:purchase_bills',
      'create:purchase_bills',
      'view:attendance',
      'mark:attendance',
      'edit:attendance_history',
      'view:employees',
      'view:sites',
    ],
  },
  site_manager: {
    role: 'site_manager',
    title: 'Site Project Manager',
    badge: 'Site Manager',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Field project supervisor responsible for site progress, attendance, and work metrics.',
    defaultTab: 'daily-work',
    permissions: [
      'view:dashboard',
      'view:daily_work',
      'create:daily_work',
      'edit:daily_work',
      'view:clients',
      'view:vendors',
      'view:advances',
      'create:advances',
      'view:materials',
      'view:purchase_bills',
      'create:purchase_bills',
      'view:attendance',
      'mark:attendance',
      'view:employees',
      'view:sites',
    ],
  },
  supervisor: {
    role: 'supervisor',
    title: 'Field Supervisor / Foreman',
    badge: 'Supervisor',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'On-site operations, daily machine hours tracking, worker attendance, and fuel consumption.',
    defaultTab: 'daily-work',
    permissions: [
      'view:daily_work',
      'create:daily_work',
      'view:attendance',
      'mark:attendance',
      'view:employees',
      'view:sites',
      'view:advances',
      'create:advances',
      'view:materials',
    ],
  },
  data_entry: {
    role: 'data_entry',
    title: 'Data Entry Operator',
    badge: 'Data Entry',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Data entry for work slips, attendance registers, advance logs, and purchase receipts.',
    defaultTab: 'daily-work',
    permissions: [
      'view:daily_work',
      'create:daily_work',
      'view:clients',
      'view:vendors',
      'view:advances',
      'create:advances',
      'view:purchase_bills',
      'create:purchase_bills',
      'view:attendance',
      'mark:attendance',
      'view:employees',
      'view:sites',
      'view:materials',
    ],
  },
  viewer: {
    role: 'viewer',
    title: 'Auditor / Viewer (Read Only)',
    badge: 'Viewer',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    description: 'Read-only access to verify reports, audit logs, ledger balances, and attendance records.',
    defaultTab: 'dashboard',
    permissions: [
      'view:dashboard',
      'view:financial_metrics',
      'view:daily_work',
      'view:clients',
      'view:vendors',
      'view:payments',
      'view:advances',
      'view:materials',
      'view:purchase_bills',
      'view:attendance',
      'view:employees',
      'view:sites',
      'view:payroll',
      'view:reports',
      'export:reports',
      'view:audit_logs',
    ],
  },
};

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.permissions.includes(permission);
}

/**
 * Map tab ID to the required permission to view it
 */
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

/**
 * Check if a role can access a specific tab
 */
export function canAccessTab(role: UserRole, tabId: string): boolean {
  const requiredPermission = TAB_PERMISSIONS[tabId];
  if (!requiredPermission) return true;
  return hasPermission(role, requiredPermission);
}

/**
 * Get default starting tab for a given role
 */
export function getDefaultTabForRole(role: UserRole): string {
  const config = ROLE_CONFIGS[role];
  if (config && canAccessTab(role, config.defaultTab)) {
    return config.defaultTab;
  }
  return 'daily-work';
}

/**
 * Role Check Helpers
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'owner';
}

export function isAccountantOrAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'owner' || role === 'accountant';
}

export function isFieldSupervisor(role: UserRole): boolean {
  return role === 'manager' || role === 'site_manager' || role === 'supervisor';
}

export function isReadOnly(role: UserRole): boolean {
  return role === 'viewer';
}

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS.super_admin;
}

/**
 * React Component for Conditional RBAC Rendering
 */
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

  if (checkPermissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? checkPermissions.every((p) => hasPermission(role, p))
    : checkPermissions.some((p) => hasPermission(role, p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
