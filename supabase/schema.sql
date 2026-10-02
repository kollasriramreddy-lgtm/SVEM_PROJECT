-- ==============================================================================
-- SIDDI VINAYAKA EARTH MOVERS — WORKFORCE, ATTENDANCE, PAYROLL & ACCOUNTS SCHEMA
-- PostgreSQL / Supabase Schema with RLS Policies, Constraints & Audit Triggers
-- Location: Hyderabad, Telangana | Currency: INR (₹) | Timezone: Asia/Kolkata
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'manager', 'owner', 'accountant', 'supervisor', 'site_manager', 'data_entry', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SITES TABLE
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name VARCHAR(255) NOT NULL,
    site_code VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EMPLOYEES (WORKERS & OPERATORS)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    designation VARCHAR(100) NOT NULL,
    worker_type VARCHAR(100) NOT NULL CHECK (worker_type IN (
        'Excavator Operator',
        'JCB Operator',
        'Rock Driller',
        'Machine Operator',
        'Driver',
        'Laborer',
        'Helper',
        'Supervisor',
        'Blasting Assistant'
    )),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leaving_date DATE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    monthly_salary NUMERIC(12, 2) NOT NULL CHECK (monthly_salary >= 0),
    salary_effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SALARY HISTORY
CREATE TABLE IF NOT EXISTS salary_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    previous_salary NUMERIC(12, 2) NOT NULL CHECK (previous_salary >= 0),
    new_salary NUMERIC(12, 2) NOT NULL CHECK (new_salary >= 0),
    effective_from DATE NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MANAGER SITE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS manager_site_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_from DATE NOT NULL DEFAULT CURRENT_DATE,
    assigned_to DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(manager_id, site_id)
);

-- 6. EMPLOYEE SITE ASSIGNMENT HISTORY
CREATE TABLE IF NOT EXISTS employee_site_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assigned_from DATE NOT NULL DEFAULT CURRENT_DATE,
    assigned_to DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Present', 'Absent', 'Sunday Duty', 'Holiday', 'Leave', 'Half Day')),
    shift VARCHAR(50) DEFAULT 'Day' CHECK (shift IN ('Day', 'Night', 'Overtime Shift')),
    overtime_type VARCHAR(50),
    marked_by UUID REFERENCES profiles(id),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks TEXT,
    edited_by UUID REFERENCES profiles(id),
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_employee_date UNIQUE (employee_id, attendance_date)
);

-- 8. PAYROLL PERIODS TABLE
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Calculated', 'Under Review', 'Approved', 'Finalized')),
    generated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES profiles(id),
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES profiles(id),
    reopen_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_period_month_year UNIQUE (month, year)
);

-- 9. PAYROLL RECORDS
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    monthly_salary NUMERIC(12, 2) NOT NULL CHECK (monthly_salary >= 0),
    days_in_month INTEGER NOT NULL CHECK (days_in_month BETWEEN 28 AND 31),
    daily_rate NUMERIC(12, 2) NOT NULL CHECK (daily_rate >= 0),
    base_pay NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (base_pay >= 0),
    sunday_base_pay NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sunday_base_pay >= 0),
    sunday_overtime_pay NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sunday_overtime_pay >= 0),
    absence_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (absence_deductions >= 0),
    sandwich_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sandwich_deductions >= 0),
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
    adjustments NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_pay NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gross_pay >= 0),
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (net_pay >= 0),
    calculation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_period_employee UNIQUE (payroll_period_id, employee_id)
);

-- 10. PAYROLL ADJUSTMENTS
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Bonus', 'Deduction', 'Correction', 'Advance', 'Other')),
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
    reason TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ACCOUNTS & CONTRACTOR MODULE EXTENSIONS
-- ==============================================================================

-- 13. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT NOT NULL,
    gst_number VARCHAR(50),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit_limit NUMERIC(14, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. VENDORS & SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    gst_number VARCHAR(50),
    vendor_category VARCHAR(100) NOT NULL CHECK (vendor_category IN (
        'Explosive Supplier',
        'Drill-bit Supplier',
        'Tooth-point Supplier',
        'Equipment Repair Vendor',
        'Bucket Repair Vendor',
        'Diesel Supplier',
        'Spare-parts Supplier',
        'Compressor Spares',
        'Hydraulic Oil Supplier',
        'Other Material Supplier'
    )),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit_limit NUMERIC(14, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. MACHINES & COMPRESSORS TABLE
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_name VARCHAR(255) NOT NULL,
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    machine_type VARCHAR(50) NOT NULL CHECK (machine_type IN ('Excavator', 'JCB', 'Compressor', 'Rock Drill', 'Tipper', 'Other')),
    reg_number VARCHAR(50),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. MATERIALS CATALOGUE
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'Drill Bits',
        'Tooth Points',
        'Teeth & Adapters',
        'Explosives',
        'Diesel & Oils',
        'Spare Parts',
        'Bucket Repair Items',
        'Compressor Parts',
        'Machine Parts',
        'Other Consumables'
    )),
    unit VARCHAR(50) NOT NULL DEFAULT 'Nos',
    default_purchase_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (default_purchase_rate >= 0),
    default_selling_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (default_selling_rate >= 0),
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(12, 2) NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. DAILY WORK ENTRIES TABLE
CREATE TABLE IF NOT EXISTS daily_work_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_date DATE NOT NULL,
    worker_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    work_category VARCHAR(100) NOT NULL CHECK (work_category IN (
        'Drilling',
        'Compressor work',
        'Rock cutting',
        'Excavation',
        'Blasting',
        'Demolition',
        'Loading',
        'Transport',
        'Machine operation',
        'Repair work',
        'Other'
    )),
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    measurement_unit VARCHAR(50) NOT NULL CHECK (measurement_unit IN (
        'Feet',
        'Meter',
        'Hour',
        'Day',
        'Trip',
        'Square Feet',
        'Cubic Feet',
        'Quantity',
        'Custom Unit'
    )),
    rate_per_unit NUMERIC(12, 2) NOT NULL CHECK (rate_per_unit >= 0),
    gross_amount NUMERIC(14, 2) NOT NULL CHECK (gross_amount >= 0),
    client_rate_per_unit NUMERIC(12, 2) DEFAULT 0,
    client_gross_amount NUMERIC(14, 2) DEFAULT 0,
    estimated_margin NUMERIC(14, 2) DEFAULT 0,
    diesel_litres NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (diesel_litres >= 0),
    diesel_rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (diesel_rate >= 0),
    diesel_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (diesel_amount >= 0),
    diesel_supplied_by VARCHAR(50) NOT NULL DEFAULT 'Company' CHECK (diesel_supplied_by IN ('Company', 'Worker', 'Client', 'Vendor')),
    diesel_source VARCHAR(100),
    cash_advance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cash_advance >= 0),
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
    net_payable NUMERIC(14, 2) NOT NULL,
    notes TEXT,
    photo_url TEXT,
    entered_by UUID REFERENCES profiles(id),
    settlement_status VARCHAR(50) NOT NULL DEFAULT 'unsettled' CHECK (settlement_status IN ('unsettled', 'partially_settled', 'settled')),
    settlement_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ADVANCES TABLE
CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advance_date DATE NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Worker', 'Compressor Operator', 'Client', 'Vendor', 'Supplier', 'Site', 'Other')),
    account_id UUID NOT NULL,
    advance_type VARCHAR(50) NOT NULL CHECK (advance_type IN (
        'Cash advance',
        'Diesel advance',
        'Salary advance',
        'Material advance',
        'Vendor advance',
        'Client advance',
        'Other advance'
    )),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    recovered_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (recovered_amount >= 0),
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'PhonePe', 'Google Pay', 'Bank Transfer', 'Cheque', 'Other')),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    recovery_method TEXT,
    attachment_url TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Partially recovered', 'Fully recovered', 'Cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. PURCHASE BILLS TABLE
CREATE TABLE IF NOT EXISTS purchase_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    additional_charges NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    due_date DATE,
    payment_mode VARCHAR(50),
    attachment_url TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partially_paid', 'unpaid', 'cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. PURCHASE BILL ITEMS
CREATE TABLE IF NOT EXISTS purchase_bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_bill_id UUID NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_rate NUMERIC(12, 2) NOT NULL CHECK (unit_rate >= 0),
    tax_percent NUMERIC(5, 2) DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. MATERIAL TRANSACTIONS
CREATE TABLE IF NOT EXISTS material_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'Purchase',
        'Issue to worker',
        'Issue to worksite',
        'Return',
        'Damage',
        'Consumption',
        'Adjustment',
        'Sale to client'
    )),
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. PAYMENTS TABLE (DOUBLE-ENTRY TRANSACTION LOG)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Worker', 'Compressor Operator', 'Client', 'Vendor', 'Supplier', 'Site', 'Other')),
    account_id UUID NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    payment_direction VARCHAR(50) NOT NULL CHECK (payment_direction IN ('Inward', 'Outward')),
    payment_category VARCHAR(100) NOT NULL CHECK (payment_category IN (
        'Client payment received',
        'Client advance',
        'Vendor payment',
        'Vendor advance',
        'Worker salary',
        'Worker advance',
        'Cash advance',
        'Diesel advance',
        'Material payment',
        'Repair payment',
        'Salary adjustment',
        'Refund',
        'Other payment'
    )),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'PhonePe', 'Google Pay', 'Bank Transfer', 'Cheque', 'Other')),
    reference_number VARCHAR(100),
    description TEXT NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    attachment_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Paid' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Paid', 'Cancelled')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    approval_status VARCHAR(50) DEFAULT 'Approved',
    approved_by UUID REFERENCES profiles(id),
    linked_bill_id UUID REFERENCES purchase_bills(id) ON DELETE SET NULL,
    linked_work_id UUID REFERENCES daily_work_entries(id) ON DELETE SET NULL,
    linked_advance_id UUID REFERENCES advances(id) ON DELETE SET NULL,
    linked_settlement_id UUID,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. WORKER SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_code VARCHAR(50) UNIQUE NOT NULL,
    settlement_date DATE NOT NULL,
    worker_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_work_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_cash_advance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_diesel_advance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_other_deductions NUMERIC(14, 2) NOT NULL DEFAULT 0,
    previous_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payments_already_made NUMERIC(14, 2) NOT NULL DEFAULT 0,
    adjustment_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_settlement_amount NUMERIC(14, 2) NOT NULL,
    settlement_type VARCHAR(50) NOT NULL DEFAULT 'Full Payment' CHECK (settlement_type IN ('Full Payment', 'Partial Payment', 'Carry Forward')),
    amount_paid_now NUMERIC(14, 2) NOT NULL DEFAULT 0,
    remaining_carry_forward NUMERIC(14, 2) NOT NULL DEFAULT 0,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    payment_mode VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. SETTLEMENT ITEMS
CREATE TABLE IF NOT EXISTS settlement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    work_entry_id UUID NOT NULL REFERENCES daily_work_entries(id) ON DELETE RESTRICT,
    work_date DATE NOT NULL,
    gross_amount NUMERIC(14, 2) NOT NULL,
    diesel_amount NUMERIC(12, 2) NOT NULL,
    cash_advance NUMERIC(12, 2) NOT NULL,
    other_deductions NUMERIC(12, 2) NOT NULL,
    net_payable NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. LEDGER ENTRIES (FULL DOUBLE-ENTRY SYSTEM)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_id UUID NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    reference_no VARCHAR(100),
    description TEXT NOT NULL,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('Inward', 'Outward')),
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    running_balance NUMERIC(14, 2) NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    linked_entity_type VARCHAR(50),
    linked_entity_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'danger', 'success')),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(vendor_category);
CREATE INDEX IF NOT EXISTS idx_machines_site_id ON machines(site_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_daily_work_date ON daily_work_entries(work_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_worker ON daily_work_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_site ON daily_work_entries(site_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_client ON daily_work_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_advances_date ON advances(advance_date);
CREATE INDEX IF NOT EXISTS idx_advances_account ON advances(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advances(status);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_vendor ON purchase_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_date ON purchase_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(payment_category);
CREATE INDEX IF NOT EXISTS idx_settlements_worker ON settlements(worker_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to clients" ON clients FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read clients" ON clients FOR SELECT USING (TRUE);

CREATE POLICY "Super admins full access to vendors" ON vendors FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read vendors" ON vendors FOR SELECT USING (TRUE);

CREATE POLICY "Super admins full access to machines" ON machines FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read machines" ON machines FOR SELECT USING (TRUE);

CREATE POLICY "Super admins full access to materials" ON materials FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read materials" ON materials FOR SELECT USING (TRUE);

CREATE POLICY "Super admins full access to daily_work" ON daily_work_entries FOR ALL USING (is_super_admin());
CREATE POLICY "Managers manage daily_work" ON daily_work_entries FOR ALL USING (site_id IN (SELECT get_manager_site_ids()));

CREATE POLICY "Super admins full access to advances" ON advances FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read advances" ON advances FOR SELECT USING (TRUE);
CREATE POLICY "Managers insert advances" ON advances FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Super admins full access to purchase_bills" ON purchase_bills FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to payments" ON payments FOR ALL USING (is_super_admin());
CREATE POLICY "Managers insert payments" ON payments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Managers read payments" ON payments FOR SELECT USING (TRUE);

CREATE POLICY "Super admins full access to settlements" ON settlements FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to ledger_entries" ON ledger_entries FOR ALL USING (is_super_admin());
CREATE POLICY "Managers read ledger_entries" ON ledger_entries FOR SELECT USING (TRUE);
CREATE POLICY "Users read notifications" ON notifications FOR ALL USING (TRUE);
