-- ==============================================================================
-- SIDDI VINAYAKA EARTH MOVERS — INITIAL REALISTIC SEED DATA (HYDERABAD)
-- ==============================================================================

-- 1. SYSTEM SETTINGS
INSERT INTO system_settings (key, value) VALUES
('company_profile', '{
    "company_name": "Siddi Vinayaka Earth Movers",
    "tagline": "Excavation, Blasting, Rock Cutting & Heavy Equipment Operations",
    "address": "Plot 42, Industrial Development Area, Uppal, Hyderabad, Telangana 500039",
    "phone": "+91 98490 12345",
    "email": "operations@svem.in",
    "gstin": "36AABCS1234F1Z8",
    "currency": "INR",
    "currency_symbol": "₹",
    "timezone": "Asia/Kolkata"
}'::jsonb),
('payroll_rules', '{
    "mandatory_sundays": 2,
    "sunday_overtime_multiplier": 2.0,
    "enable_sandwich_rule": true,
    "enable_saturday_absent_rule": true,
    "enable_monday_absent_rule": true,
    "half_day_factor": 0.5
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. PROFILES (SUPER ADMIN & MANAGERS)
INSERT INTO profiles (id, full_name, email, phone, role, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'K. Sri Ram Reddy', 'admin@svem.in', '+91 98490 12345', 'super_admin', 'active'),
('a0000000-0000-0000-0000-000000000002', 'Ramesh Goud (Supervisor)', 'ramesh.supervisor@svem.in', '+91 98480 23456', 'manager', 'active'),
('a0000000-0000-0000-0000-000000000003', 'Suresh Rao (Supervisor)', 'suresh.supervisor@svem.in', '+91 98480 34567', 'manager', 'active')
ON CONFLICT (email) DO NOTHING;

-- 3. SITES
INSERT INTO sites (id, site_name, site_code, client_name, location, description, status) VALUES
('s0000000-0000-0000-0000-000000000001', 'Outer Ring Road Rock Cutting & Blasting Site', 'SVEM-SITE-ORR', 'HMDA Infrastructure Ltd', 'ORR Exit 12, Hyderabad', 'Controlled rock cutting and heavy boulder excavation for expressway expansion', 'active'),
('s0000000-0000-0000-0000-000000000002', 'Gachibowli Commercial Foundation Excavation', 'SVEM-SITE-GCB', 'Aparna Infra Projects', 'Financial District, Gachibowli, Hyderabad', 'Deep cellar excavation (4 basements) and heavy earthmoving', 'active'),
('s0000000-0000-0000-0000-000000000003', 'HITEC City Demolition & Land Clearing Project', 'SVEM-SITE-HTC', 'Phoenix Tech Zone', 'HITEC City Phase 2, Madhapur, Hyderabad', 'Building demolition, concrete crushing and muck transport', 'active')
ON CONFLICT (site_code) DO NOTHING;

-- 4. MANAGER SITE ASSIGNMENTS
INSERT INTO manager_site_assignments (manager_id, site_id, status) VALUES
('a0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', 'active'),
('a0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'active'),
('a0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', 'active')
ON CONFLICT DO NOTHING;

-- 5. EMPLOYEES (WORKERS WITH REALISTIC HYDERABAD ROLES & COMPENSATION)
INSERT INTO employees (id, employee_code, full_name, phone, designation, worker_type, joining_date, site_id, monthly_salary, salary_effective_from, status, notes) VALUES
('e0000000-0000-0000-0000-000000000001', 'SVEM-EMP-001', 'Ravi Kumar', '+91 97010 11001', 'Lead Excavator Operator', 'Excavator Operator', '2024-01-10', 's0000000-0000-0000-0000-000000000001', 30000, '2024-01-10', 'active', 'Expert in CAT 320D hydraulic excavator'),
('e0000000-0000-0000-0000-000000000002', 'SVEM-EMP-002', 'Mahesh Yadav', '+91 97010 11002', 'Senior JCB 3DX Operator', 'JCB Operator', '2024-02-15', 's0000000-0000-0000-0000-000000000001', 26000, '2024-02-15', 'active', 'Skilled in trenching and backfilling'),
('e0000000-0000-0000-0000-000000000003', 'SVEM-EMP-003', 'Ramesh Nayak', '+91 97010 11003', 'Master Rock Driller', 'Rock Driller', '2024-03-01', 's0000000-0000-0000-0000-000000000001', 28000, '2024-03-01', 'active', 'Specialist in pneumatic drill rigs and blasting holes'),
('e0000000-0000-0000-0000-000000000004', 'SVEM-EMP-004', 'Prakash Reddy', '+91 97010 11004', 'Heavy Tipper Driver (10-Tyre)', 'Driver', '2024-04-01', 's0000000-0000-0000-0000-000000000002', 22000, '2024-04-01', 'active', 'Muck shifting & quarry transport'),
('e0000000-0000-0000-0000-000000000005', 'SVEM-EMP-005', 'Suresh Varma', '+91 97010 11005', 'Site Laborer & Grade Checker', 'Laborer', '2024-05-10', 's0000000-0000-0000-0000-000000000002', 18000, '2024-05-10', 'active', 'Site leveling, signalman & manual clearance'),
('e0000000-0000-0000-0000-000000000006', 'SVEM-EMP-006', 'Venkat Ramana', '+91 97010 11006', 'Hydraulic Breaker Operator', 'Machine Operator', '2024-06-01', 's0000000-0000-0000-0000-000000000003', 27000, '2024-06-01', 'active', 'Secondary boulder breaking and demolition'),
('e0000000-0000-0000-0000-000000000007', 'SVEM-EMP-007', 'Kishore G', '+91 97010 11007', 'Mechanical Maintenance Helper', 'Helper', '2024-07-01', 's0000000-0000-0000-0000-000000000003', 16000, '2024-07-01', 'active', 'Greasing, refueling and hydraulic hose check')
ON CONFLICT (employee_code) DO NOTHING;
