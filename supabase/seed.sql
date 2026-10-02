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

-- 2. PROFILES (SUPER ADMIN, MANAGERS, ACCOUNTANT)
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

-- 4. CLIENTS
INSERT INTO clients (id, client_name, company_name, phone, address, gst_number, opening_balance, credit_limit, notes, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'HMDA Project Division', 'HMDA Infrastructure Ltd', '+91 94401 12233', 'Tarnaka, Hyderabad, Telangana', '36AAACH1234A1ZT', 500000, 2000000, 'Govt expressway widening project with high volume rock-drilling', 'active'),
('c0000000-0000-0000-0000-000000000002', 'Venkatesh Rao (Director)', 'Aparna Infra Projects', '+91 98492 44556', 'Road No 36, Jubilee Hills, Hyderabad', '36AAPCA5678B1ZR', 250000, 1500000, 'Commercial high-rise basement deep excavation contractor', 'active'),
('c0000000-0000-0000-0000-000000000003', 'Sanjay Gupta', 'Phoenix Tech Zone', '+91 99887 77665', 'Financial District, Nanakramguda, Hyderabad', '36AAECP9988C1ZQ', 0, 1000000, 'Demolition and site preparation for IT Park Phase 3', 'active')
ON CONFLICT DO NOTHING;

-- 5. VENDORS & SUPPLIERS
INSERT INTO vendors (id, vendor_name, company_name, phone, address, gst_number, vendor_category, opening_balance, credit_limit, notes, status) VALUES
('v0000000-0000-0000-0000-000000000001', 'Maxwell Mining Supplies', 'Maxwell Rock Cutting Tools Ltd', '+91 98495 55667', 'Autonagar, Vijayawada & Jeedimetla, Hyderabad', '36AABCM4433D1ZS', 100000, 500000, 'Primary vendor for 32mm button drill bits, shank rods and cutter accessories', 'active'),
('v0000000-0000-0000-0000-000000000002', 'Sri Balaji Fuel Station', 'Telangana Diesel & Lubricants', '+91 98491 88990', 'Hayathnagar Highway, Hyderabad', '36AAFTD1122E1ZX', 50000, 300000, 'Bulk diesel bowser delivery for onsite compressors and excavators', 'active'),
('v0000000-0000-0000-0000-000000000003', 'Deccan Mining Chemicals', 'Deccan Explosives Corp', '+91 97003 44556', 'Nacharam Industrial Area, Hyderabad', '36AABCD7788F1ZV', 75000, 400000, 'Licensed commercial explosive supplier & electric detonators', 'active'),
('v0000000-0000-0000-0000-000000000004', 'Sri Sai Machine Works', 'Sri Sai Hydraulic Equipment Services', '+91 98480 99887', 'Kukatpally Industrial Estate, Hyderabad', '36AAESS3344G1ZW', 0, 200000, 'CAT & JCB bucket overhaul, tooth pin welding and hydraulic seal replacements', 'active')
ON CONFLICT DO NOTHING;

-- 6. MACHINES & COMPRESSORS
INSERT INTO machines (id, machine_name, machine_code, machine_type, reg_number, site_id, status, notes) VALUES
('m0000000-0000-0000-0000-000000000001', 'CAT 320D Heavy Excavator', 'EQ-CAT-320D', 'Excavator', 'TS 09 UA 1234', 's0000000-0000-0000-0000-000000000001', 'active', 'Heavy hydraulic crawler excavator with 1.2 cu.m bucket'),
('m0000000-0000-0000-0000-000000000002', 'Atlas Copco XAMS 407 High Pressure Compressor', 'EQ-AC-407', 'Compressor', 'TS 07 TC 5678', 's0000000-0000-0000-0000-000000000001', 'active', '400 CFM 12 Bar high pressure diesel portable compressor for rock drills'),
('m0000000-0000-0000-0000-000000000003', 'JCB 3DX Plus Backhoe Loader', 'EQ-JCB-3DX', 'JCB', 'TS 08 UB 9012', 's0000000-0000-0000-0000-000000000002', 'active', '4WD Backhoe loader for trenching and material loading'),
('m0000000-0000-0000-0000-000000000004', 'Sandvik Pneumatic Wagon Rock Drill', 'EQ-SND-WD1', 'Rock Drill', 'TS 09 TC 3456', 's0000000-0000-0000-0000-000000000001', 'active', 'Heavy drill rig for benching and controlled blast hole drilling')
ON CONFLICT (machine_code) DO NOTHING;

-- 7. MATERIALS CATALOGUE
INSERT INTO materials (id, material_name, category, unit, default_purchase_rate, default_selling_rate, current_stock, min_stock_level, supplier_id, status) VALUES
('mat00000-0000-0000-0000-000000000001', '32mm Tungsten Carbide Button Bit', 'Drill Bits', 'Nos', 1850, 2200, 45, 10, 'v0000000-0000-0000-0000-000000000001', 'active'),
('mat00000-0000-0000-0000-000000000002', 'JCB 3DX Rock Tooth Point Heavy Duty', 'Tooth Points', 'Sets', 3200, 3800, 18, 5, 'v0000000-0000-0000-0000-000000000001', 'active'),
('mat00000-0000-0000-0000-000000000003', 'High Speed Diesel (HSD)', 'Diesel & Oils', 'Litres', 104, 104, 1850, 400, 'v0000000-0000-0000-0000-000000000002', 'active'),
('mat00000-0000-0000-0000-000000000004', 'Drill Rod Shank 32mm Hex x 108mm (6 Feet)', 'Spare Parts', 'Nos', 4200, 4800, 12, 4, 'v0000000-0000-0000-0000-000000000001', 'active'),
('mat00000-0000-0000-0000-000000000005', 'Commercial Blasting Cartridge (80% Gelatin)', 'Explosives', 'Kg', 320, 380, 80, 25, 'v0000000-0000-0000-0000-000000000003', 'active')
ON CONFLICT DO NOTHING;

-- 8. EMPLOYEES
INSERT INTO employees (id, employee_code, full_name, phone, designation, worker_type, joining_date, site_id, monthly_salary, salary_effective_from, status, notes) VALUES
('e0000000-0000-0000-0000-000000000001', 'SVEM-EMP-001', 'Ravi Kumar', '+91 97010 11001', 'Lead Excavator Operator', 'Excavator Operator', '2024-01-10', 's0000000-0000-0000-0000-000000000001', 30000, '2024-01-10', 'active', 'Expert in CAT 320D hydraulic excavator'),
('e0000000-0000-0000-0000-000000000002', 'SVEM-EMP-002', 'Mahesh Yadav', '+91 97010 11002', 'Senior JCB 3DX Operator', 'JCB Operator', '2024-02-15', 's0000000-0000-0000-0000-000000000001', 26000, '2024-02-15', 'active', 'Skilled in trenching and backfilling'),
('e0000000-0000-0000-0000-000000000003', 'SVEM-EMP-003', 'Ramesh Nayak', '+91 97010 11003', 'Master Rock Driller & Compressor Operator', 'Rock Driller', '2024-03-01', 's0000000-0000-0000-0000-000000000001', 28000, '2024-03-01', 'active', 'Specialist in pneumatic drill rigs and blasting holes in hard granite')
ON CONFLICT (employee_code) DO NOTHING;
