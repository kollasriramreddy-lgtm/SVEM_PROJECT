import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.VITE_TURSO_DATABASE_URL || 'libsql://svem-project-sriramreddy.aws-ap-south-1.turso.io';
const authToken = process.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA5MzQ1NzUsImlkIjoiMDFhMGZjMDMtYTUwMS03OTZjLTkyNDgtMmY3NjlkZmZjNmYzIiwia2lkIjoiZVl5c24xMXBHX3Nhb0dSbGpsWTV1OTZUUDktZ2F3VjhHMFU5U0NPSUk0ayIsInJpZCI6ImNlYjUyNDg3LTNmZTAtNDIzMC04OTc5LTNjZjJlYWNhNzNmNCJ9.w9tksliNaiRM90_FNAhnhJCNTI-cQxjqo8rEoLbSOfX-TyzNbllHdw_GC0eocWPgEPT5RwialT2eIJTynB1DCQ';

const client = createClient({ url, authToken });

async function migrate() {
  console.log('🚀 Starting Turso Database Schema Migration...');
  const schemaPath = path.resolve(__dirname, '../turso/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await client.executeMultiple(schemaSql);
    console.log('✅ Schema created successfully!');

    // Check created tables
    const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    console.log(`📋 Total Tables created: ${res.rows.length}`);
    console.log(res.rows.map(r => r.name).join(', '));

    // Check if initial profiles exist, if not insert initial seed
    const profCount = await client.execute("SELECT COUNT(*) as cnt FROM profiles;");
    if (profCount.rows[0].cnt === 0) {
      console.log('🌱 Seeding initial records into Turso...');

      await client.batch([
        {
          sql: `INSERT OR IGNORE INTO company_settings (id, company_name, short_name, address, city, state, pincode, phone, email, gstin) 
                VALUES ('default', 'Siddi Vinayaka Earth Movers', 'SVEM', 'Plot 42, IDA Uppal', 'Hyderabad', 'Telangana', '500039', '+91 98490 12345', 'operations@svem.in', '36AABCS1234F1Z8');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO profiles (id, full_name, email, phone, role, status) VALUES
                ('usr-admin-01', 'K. Sri Ram Reddy', 'admin@svem.in', '+91 98490 12345', 'super_admin', 'active'),
                ('usr-mgr-01', 'Ramesh Goud (Supervisor)', 'ramesh.supervisor@svem.in', '+91 98480 23456', 'manager', 'active'),
                ('usr-mgr-02', 'Suresh Rao (Supervisor)', 'suresh.supervisor@svem.in', '+91 98480 34567', 'manager', 'active');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO sites (id, site_name, site_code, client_name, location, description, status) VALUES
                ('site-01', 'Outer Ring Road Rock Cutting & Blasting Site', 'SVEM-SITE-ORR', 'HMDA Infrastructure Ltd', 'ORR Exit 12, Hyderabad', 'Controlled rock cutting and heavy boulder excavation for expressway expansion', 'active'),
                ('site-02', 'Gachibowli Commercial Foundation Excavation', 'SVEM-SITE-GCB', 'Aparna Infra Projects', 'Financial District, Gachibowli, Hyderabad', 'Deep cellar excavation (4 basements) and heavy earthmoving', 'active'),
                ('site-03', 'HITEC City Demolition & Land Clearing Project', 'SVEM-SITE-HTC', 'Phoenix Tech Zone', 'HITEC City Phase 2, Madhapur, Hyderabad', 'Building demolition, concrete crushing and muck transport', 'active');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO clients (id, client_name, contact_person, phone, email, address, gstin, opening_balance, current_balance, status) VALUES
                ('client-01', 'HMDA Infrastructure Ltd', 'K. V. Rao (Chief Engineer)', '+91 94401 12233', 'projects@hmda.telangana.gov.in', 'Tarnaka, Hyderabad', '36AAACH1234A1ZT', 500000.00, 1850000.00, 'active'),
                ('client-02', 'Aparna Infra Projects', 'Venkatesh Rao (Director)', '+91 98492 44556', 'billing@aparnaconstructions.com', 'Road No 36, Jubilee Hills, Hyderabad', '36AAPCA5678B1ZR', 250000.00, 920000.00, 'active'),
                ('client-03', 'Phoenix Tech Zone', 'Sanjay Gupta (Site GM)', '+91 99887 77665', 'accounts@phoenixindia.com', 'Financial District, Nanakramguda, Hyderabad', '36AAECP9988C1ZQ', 0.00, 430000.00, 'active');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO vendors (id, vendor_name, category, contact_person, phone, email, address, gstin, opening_balance, current_balance, status) VALUES
                ('vendor-01', 'Sri Balaji Fuel Station & HSD Supplies', 'Diesel', 'Balaji Reddy', '+91 98491 88990', 'balaji.fuels@gmail.com', 'Hayathnagar Highway, Hyderabad', '36AAFTD1122E1ZX', 50000.00, 142000.00, 'active'),
                ('vendor-02', 'Maxwell Rock Cutting & Drilling Supplies', 'Machinery & Spare Parts', 'M. Srinivas', '+91 98495 55667', 'maxwellmining@yahoo.com', 'Jeedimetla Industrial Area, Hyderabad', '36AABCM4433D1ZS', 100000.00, 85000.00, 'active'),
                ('vendor-03', 'Deccan Explosives Corporation', 'Blasting Material', 'Anil Kumar', '+91 97003 44556', 'deccanexplosives@rediffmail.com', 'Nacharam Industrial Area, Hyderabad', '36AABCD7788F1ZV', 75000.00, 210000.00, 'active'),
                ('vendor-04', 'Sri Sai Hydraulic Equipment Services', 'Maintenance & Repairs', 'Satyanarayana', '+91 98480 99887', 'saisaiequipments@gmail.com', 'Kukatpally Industrial Estate, Hyderabad', '36AAESS3344G1ZW', 0.00, 34500.00, 'active');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO machines (id, machine_name, machine_code, machine_type, model_number, registration_number, hourly_rate, status, current_site_id) VALUES
                ('mach-01', 'CAT 320D Heavy Excavator', 'EQ-CAT-320D', 'Excavator', 'Caterpillar 320D2 GC', 'TS 09 UA 1234', 3200.00, 'active', 'site-01'),
                ('mach-02', 'Atlas Copco XAMS 407 High Pressure Compressor', 'EQ-AC-407', 'Compressor', 'Atlas Copco 400 CFM', 'TS 07 TC 5678', 2500.00, 'active', 'site-01'),
                ('mach-03', 'JCB 3DX Plus Backhoe Loader', 'EQ-JCB-3DX', 'JCB / Backhoe', 'JCB 3DX Plus 4WD', 'TS 08 UB 9012', 1800.00, 'active', 'site-02'),
                ('mach-04', 'Sandvik Pneumatic Wagon Rock Drill', 'EQ-SND-WD1', 'Drilling Rig', 'Sandvik DP1100i', 'TS 09 TC 3456', 2200.00, 'active', 'site-01');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO materials (id, material_name, unit, default_unit_price, description) VALUES
                ('mat-01', 'High Speed Diesel (HSD)', 'Liters', 98.50, 'Fuel for excavators, compressors and tippers'),
                ('mat-02', '32mm Button Drill Bit', 'Units', 2400.00, 'Tungsten carbide button bit for granite rock drilling'),
                ('mat-03', '6-ft Drill Rod (Hex 22mm)', 'Units', 4200.00, 'High tensile steel drill rod for Atlas Copco pneumatic drill'),
                ('mat-04', 'Class 2 Blasting Explosive Gelatin', 'Kg', 185.00, 'Controlled blasting cartridge');`,
          args: []
        },
        {
          sql: `INSERT OR IGNORE INTO employees (id, employee_code, full_name, phone, designation, worker_type, joining_date, site_id, monthly_salary, salary_effective_from, status, notes) VALUES
                ('emp-01', 'SVEM-EMP-001', 'Ravi Kumar (Lead Operator)', '+91 97010 11001', 'Lead Excavator Operator', 'Excavator Operator', '2024-01-10', 'site-01', 32000.00, '2024-01-10', 'active', 'CAT 320D specialist with 10+ yrs rock excavation experience'),
                ('emp-02', 'SVEM-EMP-002', 'Mahesh Yadav (Senior Operator)', '+91 97010 11002', 'Senior JCB 3DX Operator', 'JCB Operator', '2024-02-15', 'site-02', 26000.00, '2024-02-15', 'active', 'Expert in deep cellar trenching and foundation levelling'),
                ('emp-03', 'SVEM-EMP-003', 'Ramesh Nayak (Rock Driller)', '+91 97010 11003', 'Master Rock Driller & Compressor Operator', 'Rock Driller', '2024-03-01', 'site-01', 28000.00, '2024-03-01', 'active', 'Specialist in 32mm rock drilling rigs and benching in granite hard rock'),
                ('emp-04', 'SVEM-EMP-004', 'Venkat Swamy', '+91 97010 11004', 'Heavy Vehicle Tipper Driver', 'Driver', '2024-03-10', 'site-03', 22000.00, '2024-03-10', 'active', 'Experienced 10-wheel tipper driver for muck transport'),
                ('emp-05', 'SVEM-EMP-005', 'Anjaneyulu', '+91 97010 11005', 'Site General Helper & Fuel Attendant', 'Helper', '2024-04-01', 'site-01', 16000.00, '2024-04-01', 'active', 'Machine grease lubrication, fuel pump monitoring and site maintenance');`,
          args: []
        }
      ]);
      console.log('✅ Initial Seed Data inserted successfully!');
    } else {
      console.log('ℹ️ Profiles table already has data, skipping seed.');
    }

    console.log('🎉 Turso Database is fully configured and ready!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

migrate();
