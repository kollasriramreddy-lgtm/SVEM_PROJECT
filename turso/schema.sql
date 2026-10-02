-- ==============================================================================
-- SIDDI VINAYAKA EARTH MOVERS — TURSO / LIBSQL SQLITE SCHEMA
-- Location: Hyderabad, Telangana | Currency: INR (₹) | Timezone: Asia/Kolkata
-- ==============================================================================

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    auth_user_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'owner', 'accountant', 'supervisor', 'site_manager', 'data_entry', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. SITES TABLE
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    site_name TEXT NOT NULL,
    site_code TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. EMPLOYEES (WORKERS & OPERATORS)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    designation TEXT NOT NULL,
    worker_type TEXT NOT NULL,
    joining_date TEXT NOT NULL DEFAULT (date('now')),
    leaving_date TEXT,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    monthly_salary REAL NOT NULL CHECK (monthly_salary >= 0),
    salary_effective_from TEXT NOT NULL DEFAULT (date('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. SALARY HISTORY
CREATE TABLE IF NOT EXISTS salary_history (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    previous_salary REAL NOT NULL CHECK (previous_salary >= 0),
    new_salary REAL NOT NULL CHECK (new_salary >= 0),
    effective_from TEXT NOT NULL,
    changed_by TEXT REFERENCES profiles(id),
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. MANAGER SITE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS manager_site_assignments (
    id TEXT PRIMARY KEY,
    manager_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_from TEXT NOT NULL DEFAULT (date('now')),
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(manager_id, site_id)
);

-- 6. EMPLOYEE SITE ASSIGNMENT HISTORY
CREATE TABLE IF NOT EXISTS employee_site_assignments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_from TEXT NOT NULL DEFAULT (date('now')),
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    attendance_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Sunday Duty', 'Holiday', 'Leave', 'Half Day')),
    shift TEXT DEFAULT 'Day' CHECK (shift IN ('Day', 'Night', 'Overtime Shift')),
    overtime_type TEXT,
    marked_by TEXT REFERENCES profiles(id),
    marked_at TEXT NOT NULL DEFAULT (datetime('now')),
    remarks TEXT,
    edited_by TEXT REFERENCES profiles(id),
    edited_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (employee_id, attendance_date)
);

-- 8. PAYROLL PERIODS TABLE
CREATE TABLE IF NOT EXISTS payroll_periods (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    period_start_date TEXT NOT NULL,
    period_end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'locked', 'paid')),
    processed_at TEXT,
    processed_by TEXT REFERENCES profiles(id),
    locked_at TEXT,
    locked_by TEXT REFERENCES profiles(id),
    total_gross_amount REAL DEFAULT 0.00,
    total_deductions_amount REAL DEFAULT 0.00,
    total_net_amount REAL DEFAULT 0.00,
    employee_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (month, year)
);

-- 9. PAYROLL RECORDS TABLE
CREATE TABLE IF NOT EXISTS payroll_records (
    id TEXT PRIMARY KEY,
    payroll_period_id TEXT NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    monthly_salary REAL NOT NULL,
    base_daily_rate REAL NOT NULL,
    total_days_in_month INTEGER NOT NULL,
    present_days REAL NOT NULL DEFAULT 0,
    absent_days REAL NOT NULL DEFAULT 0,
    sunday_duty_days REAL NOT NULL DEFAULT 0,
    holiday_days REAL NOT NULL DEFAULT 0,
    leave_days REAL NOT NULL DEFAULT 0,
    payable_days REAL NOT NULL DEFAULT 0,
    earned_basic_salary REAL NOT NULL DEFAULT 0,
    sunday_duty_allowance REAL NOT NULL DEFAULT 0,
    overtime_pay REAL NOT NULL DEFAULT 0,
    gross_pay REAL NOT NULL DEFAULT 0,
    total_advances REAL NOT NULL DEFAULT 0,
    other_deductions REAL NOT NULL DEFAULT 0,
    total_deductions REAL NOT NULL DEFAULT 0,
    net_payable_salary REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    payment_date TEXT,
    payment_mode TEXT,
    payment_reference TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (payroll_period_id, employee_id)
);

-- 10. PAYROLL ADJUSTMENTS TABLE
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id TEXT PRIMARY KEY,
    payroll_record_id TEXT NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'incentive', 'advance_deduction', 'damage_penalty', 'late_deduction', 'other')),
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    applied_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id),
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. COMPANY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL DEFAULT 'Siddi Vinayaka Earth Movers',
    short_name TEXT NOT NULL DEFAULT 'SVEM',
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Hyderabad',
    state TEXT NOT NULL DEFAULT 'Telangana',
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gstin TEXT,
    pan TEXT,
    logo_url TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. PAYROLL RULE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS payroll_rule_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    salary_cycle_start_day INTEGER NOT NULL DEFAULT 1,
    daily_rate_calculation_basis TEXT NOT NULL DEFAULT 'actual_days_in_month',
    sunday_duty_multiplier REAL NOT NULL DEFAULT 1.00,
    enable_sunday_duty_extra_pay INTEGER NOT NULL DEFAULT 1,
    enable_overtime_pay INTEGER NOT NULL DEFAULT 1,
    overtime_multiplier REAL NOT NULL DEFAULT 1.00,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    opening_balance REAL NOT NULL DEFAULT 0.00,
    current_balance REAL NOT NULL DEFAULT 0.00,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 15. VENDORS TABLE
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Diesel', 'Machinery & Spare Parts', 'Maintenance & Repairs', 'Blasting Material', 'Transport', 'General Hardware', 'Other')),
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    opening_balance REAL NOT NULL DEFAULT 0.00,
    current_balance REAL NOT NULL DEFAULT 0.00,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. MACHINES TABLE
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    machine_name TEXT NOT NULL,
    machine_code TEXT UNIQUE NOT NULL,
    machine_type TEXT NOT NULL CHECK (machine_type IN ('Excavator', 'JCB / Backhoe', 'Tractor', 'Drilling Rig', 'Tipper / Truck', 'Compressor', 'Breaker', 'Generator', 'Other')),
    model_number TEXT,
    registration_number TEXT,
    hourly_rate REAL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'breakdown', 'retired')),
    current_site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    material_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    default_unit_price REAL DEFAULT 0.00,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. DAILY WORK ENTRIES TABLE
CREATE TABLE IF NOT EXISTS daily_work_entries (
    id TEXT PRIMARY KEY,
    work_date TEXT NOT NULL,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
    operator_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('Hourly', 'Brass', 'Trips', 'Fixed')),
    hours_worked REAL DEFAULT 0.00,
    brass_quantity REAL DEFAULT 0.00,
    trips_count INTEGER DEFAULT 0,
    unit_rate REAL NOT NULL DEFAULT 0.00,
    total_amount REAL NOT NULL DEFAULT 0.00,
    fuel_consumed_liters REAL DEFAULT 0.00,
    work_description TEXT,
    remarks TEXT,
    recorded_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. ADVANCES TABLE
CREATE TABLE IF NOT EXISTS advances (
    id TEXT PRIMARY KEY,
    advance_date TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('worker', 'site', 'vendor', 'other')),
    entity_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    given_by TEXT REFERENCES profiles(id),
    payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque')),
    reference_no TEXT,
    purpose TEXT NOT NULL,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    payroll_period_id TEXT REFERENCES payroll_periods(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'given' CHECK (status IN ('given', 'adjusted', 'recovered', 'settled', 'cancelled')),
    adjusted_in_record_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. PURCHASE BILLS TABLE
CREATE TABLE IF NOT EXISTS purchase_bills (
    id TEXT PRIMARY KEY,
    bill_number TEXT NOT NULL,
    bill_date TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Diesel', 'Machinery Spare', 'Maintenance Repair', 'Blasting Explosives', 'Transport Trip', 'Hardware & Tools', 'Other')),
    item_description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1.00,
    unit TEXT NOT NULL DEFAULT 'units',
    unit_price REAL NOT NULL DEFAULT 0.00,
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    paid_amount REAL NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    pending_amount REAL NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit')),
    payment_reference TEXT,
    remarks TEXT,
    bill_photo_url TEXT,
    recorded_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 21. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    payment_date TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INCOMING', 'OUTGOING')),
    category TEXT NOT NULL CHECK (category IN ('client_receipt', 'vendor_payment', 'worker_salary', 'worker_advance', 'site_expense', 'machinery_diesel', 'machinery_repair', 'other_expense', 'other_income')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'vendor', 'worker', 'site', 'other')),
    entity_id TEXT,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Draft')),
    reference_no TEXT,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    related_bill_id TEXT REFERENCES purchase_bills(id) ON DELETE SET NULL,
    related_payroll_id TEXT REFERENCES payroll_periods(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    notes TEXT,
    recorded_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 22. SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    settlement_number TEXT UNIQUE NOT NULL,
    settlement_date TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('client', 'vendor', 'worker')),
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_payable_amount REAL NOT NULL DEFAULT 0.00,
    total_received_or_paid REAL NOT NULL DEFAULT 0.00,
    previous_balance REAL NOT NULL DEFAULT 0.00,
    net_settlement_amount REAL NOT NULL DEFAULT 0.00,
    paid_now_amount REAL NOT NULL DEFAULT 0.00,
    closing_balance REAL NOT NULL DEFAULT 0.00,
    payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Adjusted')),
    payment_reference TEXT,
    status TEXT NOT NULL DEFAULT 'finalized' CHECK (status IN ('draft', 'finalized', 'cancelled')),
    notes TEXT,
    settled_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 23. SETTLEMENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS settlement_items (
    id TEXT PRIMARY KEY,
    settlement_id TEXT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    item_date TEXT NOT NULL,
    item_type TEXT NOT NULL,
    reference_id TEXT,
    description TEXT NOT NULL,
    debit_amount REAL NOT NULL DEFAULT 0.00,
    credit_amount REAL NOT NULL DEFAULT 0.00,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 24. LEDGER ENTRIES TABLE
CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    entry_date TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('client', 'vendor', 'worker', 'site')),
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    reference_id TEXT,
    reference_number TEXT,
    description TEXT NOT NULL,
    debit REAL NOT NULL DEFAULT 0.00,
    credit REAL NOT NULL DEFAULT 0.00,
    running_balance REAL NOT NULL DEFAULT 0.00,
    site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
    recorded_by TEXT REFERENCES profiles(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 25. APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS app_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'danger')),
    is_read INTEGER NOT NULL DEFAULT 0,
    link TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_employees_site_id ON employees(site_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_site_date ON attendance(site_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_date ON daily_work_entries(work_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_client ON daily_work_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_site ON daily_work_entries(site_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_vendor ON purchase_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_status ON purchase_bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_entity ON payments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_advances_entity ON advances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_type, account_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON app_notifications(user_id, is_read);
