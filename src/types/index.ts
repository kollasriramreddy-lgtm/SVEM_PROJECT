export type UserRole = 'super_admin' | 'manager';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type SiteStatus = 'active' | 'inactive' | 'completed';

export interface Site {
  id: string;
  site_name: string;
  site_code: string;
  client_name: string;
  location: string;
  description?: string;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
}

export type WorkerType =
  | 'Excavator Operator'
  | 'JCB Operator'
  | 'Rock Driller'
  | 'Machine Operator'
  | 'Driver'
  | 'Laborer'
  | 'Helper'
  | 'Supervisor'
  | 'Blasting Assistant';

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  phone?: string;
  designation: string;
  worker_type: WorkerType;
  joining_date: string;
  leaving_date?: string;
  site_id?: string;
  monthly_salary: number;
  salary_effective_from: string;
  status: EmployeeStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields for UI convenience
  site_name?: string;
}

export interface SalaryHistory {
  id: string;
  employee_id: string;
  previous_salary: number;
  new_salary: number;
  effective_from: string;
  changed_by?: string;
  changed_by_name?: string;
  reason: string;
  created_at: string;
}

export interface ManagerSiteAssignment {
  id: string;
  manager_id: string;
  site_id: string;
  assigned_from: string;
  assigned_to?: string;
  status: 'active' | 'inactive';
  created_at: string;
  site?: Site;
  manager?: Profile;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Sunday Duty'
  | 'Holiday'
  | 'Leave'
  | 'Half Day';

export type ShiftType = 'Day' | 'Night' | 'Overtime Shift';

export interface Attendance {
  id: string;
  employee_id: string;
  site_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  shift?: ShiftType;
  overtime_type?: string;
  marked_by?: string;
  marked_by_name?: string;
  marked_at: string;
  remarks?: string;
  edited_by?: string;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  site_name?: string;
}

export type PayrollPeriodStatus =
  | 'Draft'
  | 'Calculated'
  | 'Under Review'
  | 'Approved'
  | 'Finalized';

export interface PayrollPeriod {
  id: string;
  month: number; // 1-12
  year: number;  // 2024, 2025, 2026, ...
  status: PayrollPeriodStatus;
  generated_at?: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  finalized_at?: string;
  finalized_by?: string;
  finalized_by_name?: string;
  reopened_at?: string;
  reopened_by?: string;
  reopen_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationStepExplanation {
  step: string;
  formula: string;
  values: string;
  result: string;
  notes?: string;
}

export interface CalculationMetadata {
  calendarDays: number;
  dailyRate: number;
  activeDaysInMonth: number;
  presentDaysCount: number;
  halfDaysCount: number;
  absentDaysCount: number;
  leaveDaysCount: number;
  holidayDaysCount: number;
  sundaysWorkedCount: number;
  includedSundaysCount: number;
  overtimeSundaysCount: number;
  sundayOvertimeMultiplier: number;
  sundayOvertimePay: number;
  // Specific sandwich & rule triggers
  ruleA_SaturdayAbsentSundays: string[]; // dates
  ruleB_SaturdayAbsentSundayWorked: string[]; // dates
  ruleC_SundayWorkedMondayAbsent: string[]; // dates
  ruleD_FullSandwichCuts: {
    saturday: string;
    sunday: string;
    monday: string;
    deduction: number;
  }[];
  standardAbsenceDeductions: number;
  sandwichDeductionsTotal: number;
  adjustmentsList: {
    type: string;
    amount: number;
    reason: string;
  }[];
  explanationSteps: CalculationStepExplanation[];
}

export interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  monthly_salary: number;
  days_in_month: number;
  daily_rate: number;
  base_pay: number;
  sunday_base_pay: number;
  sunday_overtime_pay: number;
  absence_deductions: number;
  sandwich_deductions: number;
  other_deductions: number;
  adjustments: number;
  gross_pay: number;
  net_pay: number;
  calculation_metadata: CalculationMetadata;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  worker_type?: WorkerType;
  site_id?: string;
  site_name?: string;
}

export type AdjustmentType = 'Bonus' | 'Deduction' | 'Correction' | 'Advance' | 'Other';

export interface PayrollAdjustment {
  id: string;
  payroll_record_id: string;
  type: AdjustmentType;
  amount: number; // positive adds, negative deducts depending on type
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  description: string;
  ip_address?: string;
  created_at: string;
}

export interface CompanySettings {
  company_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
}

export interface PayrollRuleSettings {
  mandatory_sundays: number; // default: 2
  sunday_overtime_multiplier: number; // default: 2.0
  enable_sandwich_rule: boolean; // default: true
  enable_saturday_absent_rule: boolean; // default: true
  enable_monday_absent_rule: boolean; // default: true
  half_day_factor: number; // default: 0.5
}
