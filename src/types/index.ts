export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'owner'
  | 'accountant'
  | 'supervisor'
  | 'site_manager'
  | 'data_entry'
  | 'viewer';

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
  year: number; // 2024, 2025, 2026, ...
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
  ruleA_SaturdayAbsentSundays: string[];
  ruleB_SaturdayAbsentSundayWorked: string[];
  ruleC_SundayWorkedMondayAbsent: string[];
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
  amount: number;
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
  reason?: string;
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
  mandatory_sundays: number;
  sunday_overtime_multiplier: number;
  enable_sandwich_rule: boolean;
  enable_saturday_absent_rule: boolean;
  enable_monday_absent_rule: boolean;
  half_day_factor: number;
}

// ==============================================================================
// 1. CLIENT MANAGEMENT TYPES
// ==============================================================================
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: string;
  client_name: string;
  company_name: string;
  phone: string;
  alternate_phone?: string;
  address: string;
  gst_number?: string;
  opening_balance: number; // positive = client owes company
  credit_limit?: number;
  notes?: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
  // Computed summary fields
  total_billed?: number;
  total_paid?: number;
  total_advance?: number;
  total_material_charges?: number;
  current_due?: number;
  last_payment_date?: string;
}

// ==============================================================================
// 2. VENDOR AND SUPPLIER MANAGEMENT TYPES
// ==============================================================================
export type VendorStatus = 'active' | 'inactive';

export type VendorCategory =
  | 'Explosive Supplier'
  | 'Drill-bit Supplier'
  | 'Tooth-point Supplier'
  | 'Equipment Repair Vendor'
  | 'Bucket Repair Vendor'
  | 'Diesel Supplier'
  | 'Spare-parts Supplier'
  | 'Compressor Spares'
  | 'Hydraulic Oil Supplier'
  | 'Other Material Supplier';

export interface Vendor {
  id: string;
  vendor_name: string;
  company_name: string;
  phone: string;
  address: string;
  gst_number?: string;
  vendor_category: VendorCategory;
  opening_balance: number; // positive = company owes vendor
  credit_limit?: number;
  notes?: string;
  status: VendorStatus;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_purchases?: number;
  total_payments_made?: number;
  total_advances?: number;
  current_balance?: number; // >0 payable to vendor, <0 receivable, 0 settled
  balance_type?: 'payable' | 'receivable' | 'settled';
  last_payment_date?: string;
}

// ==============================================================================
// 3. MACHINES & COMPRESSORS
// ==============================================================================
export interface Machine {
  id: string;
  machine_name: string;
  machine_code: string;
  machine_type: 'Excavator' | 'JCB' | 'Compressor' | 'Rock Drill' | 'Tipper' | 'Other';
  reg_number?: string;
  site_id?: string;
  site_name?: string;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 4. DAILY WORK TRACKING & COMPRESSOR WORK
// ==============================================================================
export type WorkMeasurementUnit =
  | 'Feet'
  | 'Meter'
  | 'Hour'
  | 'Day'
  | 'Trip'
  | 'Square Feet'
  | 'Cubic Feet'
  | 'Quantity'
  | 'Custom Unit';

export type WorkCategory =
  | 'Drilling'
  | 'Compressor work'
  | 'Rock cutting'
  | 'Excavation'
  | 'Blasting'
  | 'Demolition'
  | 'Loading'
  | 'Transport'
  | 'Machine operation'
  | 'Repair work'
  | 'Other';

export type DieselSupplierType = 'Company' | 'Worker' | 'Client' | 'Vendor';

export interface DailyWorkEntry {
  id: string;
  work_date: string; // YYYY-MM-DD
  worker_id: string;
  worker_name?: string;
  worker_code?: string;
  worker_type?: string;
  site_id: string;
  site_name?: string;
  client_id?: string;
  client_name?: string;
  machine_id?: string;
  machine_name?: string;
  work_category: WorkCategory;
  quantity: number;
  measurement_unit: WorkMeasurementUnit;
  rate_per_unit: number;
  gross_amount: number; // quantity * rate_per_unit
  // Client Billing Extension
  client_rate_per_unit?: number;
  client_gross_amount?: number; // quantity * client_rate_per_unit
  estimated_margin?: number; // client_gross_amount - worker gross - diesel cost - other deductions
  // Diesel Consumption
  diesel_litres: number;
  diesel_rate: number;
  diesel_amount: number; // litres * rate
  diesel_supplied_by: DieselSupplierType;
  diesel_source?: string;
  // Deductions
  cash_advance: number;
  other_deductions: number;
  net_payable: number; // gross_amount - (if company diesel: diesel_amount else 0) - cash_advance - other_deductions
  notes?: string;
  photo_url?: string;
  entered_by?: string;
  entered_by_name?: string;
  settlement_status: 'unsettled' | 'partially_settled' | 'settled';
  settlement_id?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 5. ADVANCES (WORKER, VENDOR, CLIENT, ETC.)
// ==============================================================================
export type AdvanceType =
  | 'Cash advance'
  | 'Diesel advance'
  | 'Salary advance'
  | 'Material advance'
  | 'Vendor advance'
  | 'Client advance'
  | 'Other advance';

export type AccountType =
  | 'Worker'
  | 'Compressor Operator'
  | 'Client'
  | 'Vendor'
  | 'Supplier'
  | 'Site'
  | 'Other';

export type AdvanceStatus = 'Active' | 'Partially recovered' | 'Fully recovered' | 'Cancelled';

export interface Advance {
  id: string;
  advance_date: string;
  account_type: AccountType;
  account_id: string;
  account_name?: string;
  advance_type: AdvanceType;
  amount: number;
  recovered_amount: number;
  remaining_amount: number;
  payment_mode: PaymentMode;
  site_id?: string;
  site_name?: string;
  reason: string;
  recovery_method?: string;
  attachment_url?: string;
  notes?: string;
  status: AdvanceStatus;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 6. MATERIAL MANAGEMENT & VENDOR MATERIAL PURCHASES
// ==============================================================================
export type MaterialCategory =
  | 'Drill Bits'
  | 'Tooth Points'
  | 'Teeth & Adapters'
  | 'Explosives'
  | 'Diesel & Oils'
  | 'Spare Parts'
  | 'Bucket Repair Items'
  | 'Compressor Parts'
  | 'Machine Parts'
  | 'Other Consumables';

export interface Material {
  id: string;
  material_name: string;
  category: MaterialCategory;
  unit: string; // Nos, Pcs, Litres, Kg, Sets, Metres, etc.
  default_purchase_rate: number;
  default_selling_rate: number;
  current_stock: number;
  min_stock_level: number;
  supplier_id?: string;
  supplier_name?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type MaterialTransactionType =
  | 'Purchase'
  | 'Issue to worker'
  | 'Issue to worksite'
  | 'Return'
  | 'Damage'
  | 'Consumption'
  | 'Adjustment'
  | 'Sale to client';

export interface MaterialTransaction {
  id: string;
  transaction_date: string;
  material_id: string;
  material_name?: string;
  transaction_type: MaterialTransactionType;
  quantity: number;
  unit_rate: number;
  total_amount: number;
  site_id?: string;
  site_name?: string;
  worker_id?: string;
  worker_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  client_id?: string;
  client_name?: string;
  reference_no?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface PurchaseBillItem {
  id: string;
  purchase_bill_id?: string;
  material_id: string;
  material_name?: string;
  quantity: number;
  unit_rate: number;
  tax_percent?: number;
  total_amount: number;
}

export interface PurchaseBill {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  bill_number: string;
  bill_date: string;
  items: PurchaseBillItem[];
  subtotal: number;
  tax_amount: number;
  additional_charges: number;
  total_amount: number;
  amount_paid: number;
  credit_amount: number;
  due_date?: string;
  payment_mode?: PaymentMode;
  attachment_url?: string;
  notes?: string;
  status: 'paid' | 'partially_paid' | 'unpaid' | 'cancelled';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 7. PAYMENT ENTRY & TRANSACTION HISTORY (DOUBLE-ENTRY AUDITABLE)
// ==============================================================================
export type PaymentDirection = 'Inward' | 'Outward'; // Inward = Money Received; Outward = Money Paid

export type PaymentMode =
  | 'Cash'
  | 'UPI'
  | 'PhonePe'
  | 'Google Pay'
  | 'Bank Transfer'
  | 'Cheque'
  | 'Other';

export type PaymentCategory =
  | 'Client payment received'
  | 'Client advance'
  | 'Vendor payment'
  | 'Vendor advance'
  | 'Worker salary'
  | 'Worker advance'
  | 'Cash advance'
  | 'Diesel advance'
  | 'Material payment'
  | 'Repair payment'
  | 'Salary adjustment'
  | 'Refund'
  | 'Other payment';

export type PaymentApprovalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Paid'
  | 'Cancelled';

export interface Payment {
  id: string;
  transaction_id: string; // e.g. TXN-2026-0012
  payment_date: string;
  account_type: AccountType;
  account_id: string;
  account_name: string;
  payment_direction: PaymentDirection;
  payment_category: PaymentCategory;
  amount: number;
  payment_mode: PaymentMode;
  reference_number?: string;
  description: string;
  site_id?: string;
  site_name?: string;
  attachment_url?: string;
  status: PaymentApprovalStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  approval_status?: PaymentApprovalStatus;
  approved_by?: string;
  approved_by_name?: string;
  linked_bill_id?: string;
  linked_work_id?: string;
  linked_advance_id?: string;
  linked_settlement_id?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 8. WORKER SETTLEMENTS
// ==============================================================================
export interface SettlementItem {
  id: string;
  settlement_id: string;
  work_entry_id: string;
  work_date: string;
  gross_amount: number;
  diesel_amount: number;
  cash_advance: number;
  other_deductions: number;
  net_payable: number;
}

export interface Settlement {
  id: string;
  settlement_code: string; // e.g. STL-2026-0001
  settlement_date: string;
  worker_id: string;
  worker_name?: string;
  worker_code?: string;
  site_id?: string;
  site_name?: string;
  from_date: string;
  to_date: string;
  total_work_value: number;
  total_cash_advance: number;
  total_diesel_advance: number;
  total_other_deductions: number;
  previous_balance: number;
  payments_already_made: number;
  adjustment_amount: number;
  net_settlement_amount: number;
  settlement_type: 'Full Payment' | 'Partial Payment' | 'Carry Forward';
  amount_paid_now: number;
  remaining_carry_forward: number;
  payment_id?: string;
  payment_mode?: PaymentMode;
  notes?: string;
  items?: SettlementItem[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

// ==============================================================================
// 9. LEDGER SYSTEM (DOUBLE-ENTRY STYLE)
// ==============================================================================
export interface LedgerEntry {
  id: string;
  entry_date: string;
  account_type: AccountType;
  account_id: string;
  account_name: string;
  transaction_type: string; // 'Work Completed', 'Payment Received', 'Purchase Bill', 'Advance Given', etc.
  reference_no?: string;
  description: string;
  direction: 'Inward' | 'Outward';
  debit: number; // money / value debited
  credit: number; // money / value credited
  running_balance: number;
  site_id?: string;
  site_name?: string;
  linked_entity_type?: 'work' | 'payment' | 'purchase' | 'advance' | 'settlement' | 'opening';
  linked_entity_id?: string;
  status: 'active' | 'cancelled';
  created_by?: string;
  created_at: string;
}

// ==============================================================================
// 10. NOTIFICATIONS AND SYSTEM ALERTS
// ==============================================================================
export type NotificationSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface AppNotification {
  id: string;
  type:
    | 'client_overdue'
    | 'vendor_due'
    | 'worker_settlement_pending'
    | 'advance_unrecovered'
    | 'credit_limit_exceeded'
    | 'low_material_stock'
    | 'missing_daily_work'
    | 'missing_diesel_entry'
    | 'unsettled_work';
  title: string;
  message: string;
  severity: NotificationSeverity;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

// ==============================================================================
// 11. DASHBOARD & REPORTING MODELS
// ==============================================================================
export interface AccountsDashboardSummary {
  totalClientReceivables: number;
  totalVendorPayables: number;
  totalWorkerEarnings: number;
  totalCashAdvances: number;
  totalDieselAdvances: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  totalOutstandingBalance: number;
  todayWorkValue: number;
  todayFeetCompleted: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  thisMonthNetMargin: number;
  overdueClientsCount: number;
  overdueVendorsCount: number;
  unsettledWorkersCount: number;
}

export interface DashboardFilter {
  dateRange: 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  clientId?: string;
  vendorId?: string;
  workerId?: string;
  siteId?: string;
  paymentType?: string;
  paymentStatus?: string;
  searchQuery?: string;
}

