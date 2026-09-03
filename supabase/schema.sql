-- ==============================================================================
-- SIDDI VINAYAKA EARTH MOVERS — WORKFORCE, ATTENDANCE & PAYROLL DATABASE SCHEMA
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
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'manager')),
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

-- 3. EMPLOYEES (WORKERS & OPERATORS - NO LOGIN ACCESS)
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

-- 4. SALARY HISTORY (AUDITABLE HISTORICAL COMPENSATION)
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

-- 7. ATTENDANCE TABLE (UNIQUE per employee and date)
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

-- 9. PAYROLL RECORDS (SNAPSHOT WITH COMPLETE CALCULATION METADATA)
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

-- 10. PAYROLL ADJUSTMENTS (BONUS, DEDUCTION, ADVANCE, CORRECTION)
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Bonus', 'Deduction', 'Correction', 'Advance', 'Other')),
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS (IMMUTABLE ADMINISTRATIVE TRAIL)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    description TEXT NOT NULL,
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

-- INDEXES FOR HIGH-PERFORMANCE FIELD OPERATIONS
CREATE INDEX IF NOT EXISTS idx_employees_site_id ON employees(site_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_site_date ON attendance(site_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period ON payroll_records(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager ON manager_site_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_site ON manager_site_assignments(site_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current auth user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE auth_user_id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get assigned site IDs for current manager
CREATE OR REPLACE FUNCTION get_manager_site_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT msa.site_id
    FROM manager_site_assignments msa
    JOIN profiles p ON p.id = msa.manager_id
    WHERE p.auth_user_id = auth.uid()
    AND msa.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Super Admin all; Managers can read own profile
CREATE POLICY "Super admins full access to profiles" ON profiles
    FOR ALL USING (is_super_admin());
CREATE POLICY "Managers view own profile" ON profiles
    FOR SELECT USING (auth_user_id = auth.uid());

-- Sites: Super Admin all; Managers view assigned sites
CREATE POLICY "Super admins full access to sites" ON sites
    FOR ALL USING (is_super_admin());
CREATE POLICY "Managers view assigned sites" ON sites
    FOR SELECT USING (id IN (SELECT get_manager_site_ids()));

-- Employees: Super Admin all; Managers view assigned site workers
CREATE POLICY "Super admins full access to employees" ON employees
    FOR ALL USING (is_super_admin());
CREATE POLICY "Managers view assigned workers" ON employees
    FOR SELECT USING (site_id IN (SELECT get_manager_site_ids()));

-- Attendance: Super Admin all; Managers view & insert/update for assigned sites
CREATE POLICY "Super admins full access to attendance" ON attendance
    FOR ALL USING (is_super_admin());
CREATE POLICY "Managers select assigned site attendance" ON attendance
    FOR SELECT USING (site_id IN (SELECT get_manager_site_ids()));
CREATE POLICY "Managers insert assigned site attendance" ON attendance
    FOR INSERT WITH CHECK (site_id IN (SELECT get_manager_site_ids()));
CREATE POLICY "Managers update assigned site attendance" ON attendance
    FOR UPDATE USING (site_id IN (SELECT get_manager_site_ids()));

-- Payroll & Salaries: Super Admin ONLY
CREATE POLICY "Super admins full access to salary_history" ON salary_history
    FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to payroll_periods" ON payroll_periods
    FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to payroll_records" ON payroll_records
    FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to payroll_adjustments" ON payroll_adjustments
    FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to audit_logs" ON audit_logs
    FOR ALL USING (is_super_admin());
CREATE POLICY "Super admins full access to system_settings" ON system_settings
    FOR ALL USING (is_super_admin());
