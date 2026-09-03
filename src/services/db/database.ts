import {
  Profile,
  Site,
  Employee,
  SalaryHistory,
  ManagerSiteAssignment,
  Attendance,
  PayrollPeriod,
  PayrollRecord,
  PayrollAdjustment,
  AuditLog,
  CompanySettings,
  PayrollRuleSettings,
  UserRole,
} from '../../types';
import { calculateEmployeePayroll, formatINR } from '../payroll/payrollEngine';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'svem_current_user',
  PROFILES: 'svem_profiles',
  SITES: 'svem_sites',
  EMPLOYEES: 'svem_employees',
  SALARY_HISTORY: 'svem_salary_history',
  MANAGER_ASSIGNMENTS: 'svem_manager_assignments',
  ATTENDANCE: 'svem_attendance',
  PAYROLL_PERIODS: 'svem_payroll_periods',
  PAYROLL_RECORDS: 'svem_payroll_records',
  PAYROLL_ADJUSTMENTS: 'svem_payroll_adjustments',
  AUDIT_LOGS: 'svem_audit_logs',
  COMPANY_SETTINGS: 'svem_company_settings',
  PAYROLL_RULES: 'svem_payroll_rules',
};

// Initial Seed Data
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-admin-01',
    full_name: 'K. Sri Ram Reddy',
    email: 'admin@svem.in',
    phone: '+91 98490 12345',
    role: 'super_admin',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 'usr-mgr-01',
    full_name: 'Ramesh Goud (Supervisor)',
    email: 'ramesh.supervisor@svem.in',
    phone: '+91 98480 23456',
    role: 'manager',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 'usr-mgr-02',
    full_name: 'Suresh Rao (Supervisor)',
    email: 'suresh.supervisor@svem.in',
    phone: '+91 98480 34567',
    role: 'manager',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
  },
];

const INITIAL_SITES: Site[] = [
  {
    id: 'site-orr-01',
    site_name: 'Outer Ring Road Rock Cutting & Blasting Site',
    site_code: 'SVEM-SITE-ORR',
    client_name: 'HMDA Infrastructure Ltd',
    location: 'ORR Exit 12, Hyderabad, Telangana',
    description: 'Controlled blasting, pneumatic rock drilling and hydraulic boulder cutting for 8-lane expressway.',
    status: 'active',
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-05T09:00:00Z',
  },
  {
    id: 'site-gcb-02',
    site_name: 'Gachibowli Commercial Foundation Excavation',
    site_code: 'SVEM-SITE-GCB',
    client_name: 'Aparna Infra Projects',
    location: 'Financial District, Gachibowli, Hyderabad',
    description: 'Deep cellar earthmoving (4 basements), heavy soil shifting and retaining wall excavation.',
    status: 'active',
    created_at: '2024-02-10T09:00:00Z',
    updated_at: '2024-02-10T09:00:00Z',
  },
  {
    id: 'site-htc-03',
    site_name: 'HITEC City Demolition & Land Clearing Project',
    site_code: 'SVEM-SITE-HTC',
    client_name: 'Phoenix Tech Zone',
    location: 'HITEC City Phase 2, Madhapur, Hyderabad',
    description: 'Concrete breaker operations, rubble sorting and 10-wheel tipper muck transportation.',
    status: 'active',
    created_at: '2024-03-01T09:00:00Z',
    updated_at: '2024-03-01T09:00:00Z',
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    employee_code: 'SVEM-EMP-001',
    full_name: 'Ravi Kumar',
    phone: '+91 97010 11001',
    designation: 'Lead CAT 320D Excavator Operator',
    worker_type: 'Excavator Operator',
    joining_date: '2024-01-10',
    site_id: 'site-orr-01',
    monthly_salary: 30000,
    salary_effective_from: '2024-01-10',
    status: 'active',
    notes: 'Primary operator for 20-ton CAT excavator on rock terrain.',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
    site_name: 'Outer Ring Road Rock Cutting & Blasting Site',
  },
  {
    id: 'emp-002',
    employee_code: 'SVEM-EMP-002',
    full_name: 'Mahesh Yadav',
    phone: '+91 97010 11002',
    designation: 'Senior JCB 3DX Backhoe Operator',
    worker_type: 'JCB Operator',
    joining_date: '2024-02-15',
    site_id: 'site-orr-01',
    monthly_salary: 26000,
    salary_effective_from: '2024-02-15',
    status: 'active',
    notes: 'Skilled in deep trenching and foundation backfilling.',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-02-15T08:00:00Z',
    site_name: 'Outer Ring Road Rock Cutting & Blasting Site',
  },
  {
    id: 'emp-003',
    employee_code: 'SVEM-EMP-003',
    full_name: 'Ramesh Nayak',
    phone: '+91 97010 11003',
    designation: 'Master Pneumatic Rock Driller',
    worker_type: 'Rock Driller',
    joining_date: '2024-03-01',
    site_id: 'site-orr-01',
    monthly_salary: 28000,
    salary_effective_from: '2024-03-01',
    status: 'active',
    notes: 'Specialist in 115mm blasting drill rigs and dynamite placement holes.',
    created_at: '2024-03-01T08:00:00Z',
    updated_at: '2024-03-01T08:00:00Z',
    site_name: 'Outer Ring Road Rock Cutting & Blasting Site',
  },
  {
    id: 'emp-004',
    employee_code: 'SVEM-EMP-004',
    full_name: 'Prakash Reddy',
    phone: '+91 97010 11004',
    designation: 'Heavy Tipper Driver (10-Tyre BharatBenz)',
    worker_type: 'Driver',
    joining_date: '2024-04-01',
    site_id: 'site-gcb-02',
    monthly_salary: 22000,
    salary_effective_from: '2024-04-01',
    status: 'active',
    notes: 'Muck shifting & quarry stone transport.',
    created_at: '2024-04-01T08:00:00Z',
    updated_at: '2024-04-01T08:00:00Z',
    site_name: 'Gachibowli Commercial Foundation Excavation',
  },
  {
    id: 'emp-005',
    employee_code: 'SVEM-EMP-005',
    full_name: 'Suresh Varma',
    phone: '+91 97010 11005',
    designation: 'Site Laborer & Grade Checker',
    worker_type: 'Laborer',
    joining_date: '2024-05-10',
    site_id: 'site-gcb-02',
    monthly_salary: 18000,
    salary_effective_from: '2024-05-10',
    status: 'active',
    notes: 'Elevation checking, signalman & manual clearance.',
    created_at: '2024-05-10T08:00:00Z',
    updated_at: '2024-05-10T08:00:00Z',
    site_name: 'Gachibowli Commercial Foundation Excavation',
  },
  {
    id: 'emp-006',
    employee_code: 'SVEM-EMP-006',
    full_name: 'Venkat Ramana',
    phone: '+91 97010 11006',
    designation: 'Hydraulic Rock Breaker Operator',
    worker_type: 'Machine Operator',
    joining_date: '2024-06-01',
    site_id: 'site-htc-03',
    monthly_salary: 27000,
    salary_effective_from: '2024-06-01',
    status: 'active',
    notes: 'Demolition concrete crushing and hard boulder breaking.',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-01T08:00:00Z',
    site_name: 'HITEC City Demolition & Land Clearing Project',
  },
  {
    id: 'emp-007',
    employee_code: 'SVEM-EMP-007',
    full_name: 'Kishore G',
    phone: '+91 97010 11007',
    designation: 'Equipment Maintenance Helper',
    worker_type: 'Helper',
    joining_date: '2024-07-01',
    site_id: 'site-htc-03',
    monthly_salary: 16000,
    salary_effective_from: '2024-07-01',
    status: 'active',
    notes: 'Daily greasing, diesel fueling and hydraulic hose checks.',
    created_at: '2024-07-01T08:00:00Z',
    updated_at: '2024-07-01T08:00:00Z',
    site_name: 'HITEC City Demolition & Land Clearing Project',
  },
];

const INITIAL_MANAGER_ASSIGNMENTS: ManagerSiteAssignment[] = [
  {
    id: 'msa-01',
    manager_id: 'usr-mgr-01',
    site_id: 'site-orr-01',
    assigned_from: '2024-01-01',
    status: 'active',
    created_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 'msa-02',
    manager_id: 'usr-mgr-01',
    site_id: 'site-gcb-02',
    assigned_from: '2024-01-01',
    status: 'active',
    created_at: '2024-01-01T08:00:00Z',
  },
  {
    id: 'msa-03',
    manager_id: 'usr-mgr-02',
    site_id: 'site-htc-03',
    assigned_from: '2024-01-01',
    status: 'active',
    created_at: '2024-01-01T08:00:00Z',
  },
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  company_name: 'Siddi Vinayaka Earth Movers',
  tagline: 'Excavation, Rock Cutting, Controlled Blasting & Heavy Equipment Operations',
  address: 'Plot 42, IDA Uppal, Hyderabad, Telangana 500039',
  phone: '+91 98490 12345',
  email: 'operations@svem.in',
  gstin: '36AABCS1234F1Z8',
  currency: 'INR',
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
};

const INITIAL_PAYROLL_RULES: PayrollRuleSettings = {
  mandatory_sundays: 2,
  sunday_overtime_multiplier: 2.0,
  enable_sandwich_rule: true,
  enable_saturday_absent_rule: true,
  enable_monday_absent_rule: true,
  half_day_factor: 0.5,
};

// Helper to pre-generate realistic seed attendance for current and previous month
function generateSeedAttendance(): Attendance[] {
  const list: Attendance[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Generate for current month up to today
  const todayDate = now.getDate();
  INITIAL_EMPLOYEES.forEach((emp) => {
    for (let d = 1; d <= todayDate; d++) {
      const date = new Date(currentYear, currentMonth - 1, d);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let status: 'Present' | 'Absent' | 'Sunday Duty' | 'Leave' | 'Half Day' = 'Present';

      if (dayOfWeek === 0) {
        // Some Sundays worked, some rest
        status = d % 2 === 0 ? 'Sunday Duty' : 'Leave';
      } else if (emp.id === 'emp-001' && d === 5) {
        // Simulate a Saturday absence for Ravi to test rule
        status = 'Absent';
      } else if (d === 12 && emp.id === 'emp-005') {
        status = 'Half Day';
      }

      list.push({
        id: `att-seed-${emp.id}-${dateStr}`,
        employee_id: emp.id,
        site_id: emp.site_id || 'site-orr-01',
        attendance_date: dateStr,
        status,
        shift: 'Day',
        marked_by: 'usr-mgr-01',
        marked_by_name: 'Ramesh Goud',
        marked_at: `${dateStr}T18:00:00Z`,
        created_at: `${dateStr}T18:00:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        designation: emp.designation,
      });
    }
  });

  return list;
}

// Memory / Local Storage Layer
class DatabaseService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save key ${key} to localStorage:`, e);
    }
  }

  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      this.set(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]); // Default Super Admin
    }
    if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
      this.set(STORAGE_KEYS.SITES, INITIAL_SITES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MANAGER_ASSIGNMENTS)) {
      this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, INITIAL_MANAGER_ASSIGNMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS)) {
      this.set(STORAGE_KEYS.COMPANY_SETTINGS, INITIAL_COMPANY_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_RULES)) {
      this.set(STORAGE_KEYS.PAYROLL_RULES, INITIAL_PAYROLL_RULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.set(STORAGE_KEYS.ATTENDANCE, generateSeedAttendance());
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALARY_HISTORY)) {
      this.set(STORAGE_KEYS.SALARY_HISTORY, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_PERIODS)) {
      const now = new Date();
      const initialPeriod: PayrollPeriod = {
        id: `period-${now.getFullYear()}-${now.getMonth() + 1}`,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'Calculated',
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, [initialPeriod]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-001',
          user_id: 'usr-admin-01',
          user_name: 'K. Sri Ram Reddy',
          user_role: 'super_admin',
          action: 'SYSTEM_INITIALIZED',
          entity_type: 'SYSTEM',
          description: 'Siddi Vinayaka Earth Movers enterprise portal initialized with Hyderabad operations configuration.',
          created_at: new Date().toISOString(),
        },
      ];
      this.set(STORAGE_KEYS.AUDIT_LOGS, initialLogs);
    }
  }

  // Auth & Profile operations
  public async getCurrentUser(): Promise<Profile> {
    return this.get<Profile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  }

  public async setCurrentUser(profile: Profile): Promise<void> {
    this.set(STORAGE_KEYS.CURRENT_USER, profile);
    await this.addAuditLog({
      action: 'SWITCH_USER_DEMO',
      entity_type: 'PROFILE',
      entity_id: profile.id,
      description: `Active session switched to ${profile.full_name} (${profile.role}).`,
    });
  }

  public async login(email: string, _password?: string): Promise<Profile> {
    const profiles = this.get<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const found = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error(`Invalid credentials or user '${email}' not found.`);
    }
    if (found.status !== 'active') {
      throw new Error(`Account is ${found.status}. Contact administrator.`);
    }
    this.set(STORAGE_KEYS.CURRENT_USER, found);
    await this.addAuditLog({
      user_id: found.id,
      user_name: found.full_name,
      user_role: found.role,
      action: 'USER_LOGIN',
      entity_type: 'AUTH',
      entity_id: found.id,
      description: `User ${found.full_name} logged in successfully.`,
    });
    return found;
  }

  public async getProfiles(): Promise<Profile[]> {
    return this.get<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  public async createProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    const profiles = await this.getProfiles();
    const newProfile: Profile = {
      ...profileData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    this.set(STORAGE_KEYS.PROFILES, profiles);
    await this.addAuditLog({
      action: 'CREATE_PROFILE',
      entity_type: 'PROFILE',
      entity_id: newProfile.id,
      new_values: newProfile,
      description: `Created new ${newProfile.role} profile for ${newProfile.full_name} (${newProfile.email}).`,
    });
    return newProfile;
  }

  public async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const profiles = await this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('User not found');
    const old = { ...profiles[idx] };
    profiles[idx] = { ...profiles[idx], ...updates, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.PROFILES, profiles);
    await this.addAuditLog({
      action: 'UPDATE_PROFILE',
      entity_type: 'PROFILE',
      entity_id: id,
      old_values: old,
      new_values: profiles[idx],
      description: `Updated profile details for ${profiles[idx].full_name}.`,
    });
    return profiles[idx];
  }

  // Sites Operations
  public async getSites(): Promise<Site[]> {
    return this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);
  }

  public async getSiteById(id: string): Promise<Site | undefined> {
    const sites = await this.getSites();
    return sites.find((s) => s.id === id);
  }

  public async createSite(siteData: Omit<Site, 'id' | 'created_at' | 'updated_at'>): Promise<Site> {
    const sites = await this.getSites();
    if (sites.some((s) => s.site_code.toLowerCase() === siteData.site_code.toLowerCase())) {
      throw new Error(`Site code '${siteData.site_code}' already exists.`);
    }
    const newSite: Site = {
      ...siteData,
      id: `site-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sites.push(newSite);
    this.set(STORAGE_KEYS.SITES, sites);
    await this.addAuditLog({
      action: 'CREATE_SITE',
      entity_type: 'SITE',
      entity_id: newSite.id,
      new_values: newSite,
      description: `Created site ${newSite.site_name} (${newSite.site_code}) for client ${newSite.client_name}.`,
    });
    return newSite;
  }

  public async updateSite(id: string, updates: Partial<Site>): Promise<Site> {
    const sites = await this.getSites();
    const idx = sites.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Site not found');
    const old = { ...sites[idx] };
    sites[idx] = { ...sites[idx], ...updates, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.SITES, sites);
    await this.addAuditLog({
      action: 'UPDATE_SITE',
      entity_type: 'SITE',
      entity_id: id,
      old_values: old,
      new_values: sites[idx],
      description: `Updated site details for ${sites[idx].site_name}.`,
    });
    return sites[idx];
  }

  // Manager Site Assignments
  public async getManagerSiteAssignments(): Promise<ManagerSiteAssignment[]> {
    const assignments = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, INITIAL_MANAGER_ASSIGNMENTS);
    const sites = await this.getSites();
    const profiles = await this.getProfiles();

    return assignments.map((a) => ({
      ...a,
      site: sites.find((s) => s.id === a.site_id),
      manager: profiles.find((p) => p.id === a.manager_id),
    }));
  }

  public async assignManagerToSite(managerId: string, siteId: string): Promise<ManagerSiteAssignment> {
    const list = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, INITIAL_MANAGER_ASSIGNMENTS);
    const existing = list.find((a) => a.manager_id === managerId && a.site_id === siteId);
    if (existing) {
      existing.status = 'active';
      this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, list);
      return existing;
    }
    const newAssignment: ManagerSiteAssignment = {
      id: `msa-${Date.now()}`,
      manager_id: managerId,
      site_id: siteId,
      assigned_from: new Date().toISOString().split('T')[0],
      status: 'active',
      created_at: new Date().toISOString(),
    };
    list.push(newAssignment);
    this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, list);
    await this.addAuditLog({
      action: 'ASSIGN_MANAGER',
      entity_type: 'MANAGER_ASSIGNMENT',
      entity_id: newAssignment.id,
      description: `Assigned manager ID ${managerId} to site ID ${siteId}.`,
    });
    return newAssignment;
  }

  public async removeManagerSiteAssignment(id: string): Promise<void> {
    const list = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, INITIAL_MANAGER_ASSIGNMENTS);
    const filtered = list.filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, filtered);
    await this.addAuditLog({
      action: 'REMOVE_MANAGER_ASSIGNMENT',
      entity_type: 'MANAGER_ASSIGNMENT',
      entity_id: id,
      description: `Removed manager site assignment ID ${id}.`,
    });
  }

  // Employees (Workers) Operations
  public async getEmployees(): Promise<Employee[]> {
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const sites = await this.getSites();
    return employees.map((emp) => ({
      ...emp,
      site_name: sites.find((s) => s.id === emp.site_id)?.site_name || 'Unassigned',
    }));
  }

  public async getEmployeeById(id: string): Promise<Employee | undefined> {
    const employees = await this.getEmployees();
    return employees.find((e) => e.id === id);
  }

  public async createEmployee(empData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const employees = await this.getEmployees();
    if (employees.some((e) => e.employee_code.toLowerCase() === empData.employee_code.toLowerCase())) {
      throw new Error(`Employee code '${empData.employee_code}' already exists.`);
    }
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    employees.push(newEmp);
    this.set(STORAGE_KEYS.EMPLOYEES, employees);
    await this.addAuditLog({
      action: 'CREATE_EMPLOYEE',
      entity_type: 'EMPLOYEE',
      entity_id: newEmp.id,
      new_values: newEmp,
      description: `Added new employee ${newEmp.full_name} (${newEmp.employee_code}, ${newEmp.designation}) with salary ${formatINR(newEmp.monthly_salary)}.`,
    });
    return newEmp;
  }

  public async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const employees = await this.getEmployees();
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Employee not found');
    const old = { ...employees[idx] };
    employees[idx] = { ...employees[idx], ...updates, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.EMPLOYEES, employees);
    await this.addAuditLog({
      action: 'UPDATE_EMPLOYEE',
      entity_type: 'EMPLOYEE',
      entity_id: id,
      old_values: old,
      new_values: employees[idx],
      description: `Updated employee profile for ${employees[idx].full_name} (${employees[idx].employee_code}).`,
    });
    return employees[idx];
  }

  public async updateEmployeeSalary(
    employeeId: string,
    newSalary: number,
    effectiveFrom: string,
    reason: string
  ): Promise<void> {
    const currentUser = await this.getCurrentUser();
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const previousSalary = employee.monthly_salary;
    const historyList = this.get<SalaryHistory[]>(STORAGE_KEYS.SALARY_HISTORY, []);

    const newHistory: SalaryHistory = {
      id: `sal-hist-${Date.now()}`,
      employee_id: employeeId,
      previous_salary: previousSalary,
      new_salary: newSalary,
      effective_from: effectiveFrom,
      changed_by: currentUser.id,
      changed_by_name: currentUser.full_name,
      reason,
      created_at: new Date().toISOString(),
    };

    historyList.unshift(newHistory);
    this.set(STORAGE_KEYS.SALARY_HISTORY, historyList);

    await this.updateEmployee(employeeId, {
      monthly_salary: newSalary,
      salary_effective_from: effectiveFrom,
    });

    await this.addAuditLog({
      action: 'SALARY_REVISION',
      entity_type: 'EMPLOYEE_SALARY',
      entity_id: employeeId,
      old_values: { monthly_salary: previousSalary },
      new_values: { monthly_salary: newSalary, effective_from: effectiveFrom, reason },
      description: `Revised salary of ${employee.full_name} from ${formatINR(previousSalary)} to ${formatINR(newSalary)}. Reason: ${reason}.`,
    });
  }

  public async getSalaryHistoryForEmployee(employeeId: string): Promise<SalaryHistory[]> {
    const history = this.get<SalaryHistory[]>(STORAGE_KEYS.SALARY_HISTORY, []);
    return history.filter((h) => h.employee_id === employeeId);
  }

  // Attendance Operations
  public async getAttendanceForSiteAndDate(siteId: string, dateStr: string): Promise<Attendance[]> {
    const all = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    return all.filter((a) => a.site_id === siteId && a.attendance_date === dateStr);
  }

  public async getAttendanceForMonth(year: number, month: number): Promise<Attendance[]> {
    const all = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return all.filter((a) => a.attendance_date.startsWith(prefix));
  }

  public async getAttendanceForEmployee(employeeId: string): Promise<Attendance[]> {
    const all = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    return all.filter((a) => a.employee_id === employeeId);
  }

  public async saveBatchAttendance(
    siteId: string,
    dateStr: string,
    records: { employee_id: string; status: Attendance['status']; shift?: Attendance['shift']; remarks?: string }[]
  ): Promise<void> {
    const currentUser = await this.getCurrentUser();
    const all = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const employees = await this.getEmployees();
    const site = await this.getSiteById(siteId);

    // Map existing records to preserve or update
    const map = new Map<string, Attendance>();
    all.forEach((a) => map.set(`${a.employee_id}_${a.attendance_date}`, a));

    records.forEach((rec) => {
      const key = `${rec.employee_id}_${dateStr}`;
      const emp = employees.find((e) => e.id === rec.employee_id);
      const existing = map.get(key);

      if (existing) {
        map.set(key, {
          ...existing,
          status: rec.status,
          shift: rec.shift || existing.shift || 'Day',
          remarks: rec.remarks || existing.remarks,
          edited_by: currentUser.id,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        map.set(key, {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          employee_id: rec.employee_id,
          site_id: siteId,
          attendance_date: dateStr,
          status: rec.status,
          shift: rec.shift || 'Day',
          remarks: rec.remarks,
          marked_by: currentUser.id,
          marked_by_name: currentUser.full_name,
          marked_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee_name: emp?.full_name,
          employee_code: emp?.employee_code,
          designation: emp?.designation,
          site_name: site?.site_name,
        });
      }
    });

    const updatedList = Array.from(map.values());
    this.set(STORAGE_KEYS.ATTENDANCE, updatedList);

    await this.addAuditLog({
      action: 'SAVE_ATTENDANCE_BATCH',
      entity_type: 'ATTENDANCE',
      entity_id: `${siteId}_${dateStr}`,
      description: `Recorded attendance for ${records.length} worker(s) at site ${site?.site_name || siteId} for date ${dateStr}.`,
    });
  }

  // Payroll Operations
  public async getPayrollPeriods(): Promise<PayrollPeriod[]> {
    return this.get<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, []);
  }

  public async getOrCreatePayrollPeriod(year: number, month: number): Promise<PayrollPeriod> {
    const periods = await this.getPayrollPeriods();
    let period = periods.find((p) => p.year === year && p.month === month);
    if (!period) {
      period = {
        id: `period-${year}-${month}`,
        year,
        month,
        status: 'Draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      periods.push(period);
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
    }
    return period;
  }

  public async calculatePayrollForPeriod(year: number, month: number): Promise<{ period: PayrollPeriod; records: PayrollRecord[] }> {
    const period = await this.getOrCreatePayrollPeriod(year, month);
    const employees = await this.getEmployees();
    const rules = await this.getPayrollRules();
    const monthlyAttendance = await this.getAttendanceForMonth(year, month);
    const allAdjustments = this.get<PayrollAdjustment[]>(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, []);

    const records: PayrollRecord[] = employees
      .filter((emp) => emp.status === 'active')
      .map((employee) => {
        const empAttendances = monthlyAttendance.filter((a) => a.employee_id === employee.id);
        const empAdjustments = allAdjustments.filter((adj) => adj.payroll_record_id === `payrec-${employee.id}-${year}-${month}`);

        return calculateEmployeePayroll({
          employee,
          year,
          month,
          attendances: empAttendances,
          adjustments: empAdjustments,
          rules,
        });
      });

    // Update Period Status
    const periods = await this.getPayrollPeriods();
    const pIdx = periods.findIndex((p) => p.id === period.id);
    if (pIdx !== -1) {
      if (periods[pIdx].status === 'Draft') {
        periods[pIdx].status = 'Calculated';
      }
      periods[pIdx].generated_at = new Date().toISOString();
      periods[pIdx].updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
      period.status = periods[pIdx].status;
    }

    // Save Payroll Records
    const existingRecords = this.get<PayrollRecord[]>(STORAGE_KEYS.PAYROLL_RECORDS, []);
    const otherRecords = existingRecords.filter((r) => r.payroll_period_id !== period.id);
    this.set(STORAGE_KEYS.PAYROLL_RECORDS, [...otherRecords, ...records]);

    await this.addAuditLog({
      action: 'CALCULATE_PAYROLL',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: period.id,
      description: `Calculated monthly payroll for ${records.length} employees for ${month}/${year}.`,
    });

    return { period, records };
  }

  public async getPayrollRecordsForPeriod(periodId: string): Promise<PayrollRecord[]> {
    const records = this.get<PayrollRecord[]>(STORAGE_KEYS.PAYROLL_RECORDS, []);
    return records.filter((r) => r.payroll_period_id === periodId);
  }

  public async addPayrollAdjustment(
    periodId: string,
    employeeId: string,
    type: PayrollAdjustment['type'],
    amount: number,
    reason: string
  ): Promise<PayrollAdjustment> {
    const currentUser = await this.getCurrentUser();
    const periods = await this.getPayrollPeriods();
    const period = periods.find((p) => p.id === periodId);
    if (!period) throw new Error('Payroll period not found');
    if (period.status === 'Finalized') throw new Error('Cannot add adjustment to finalized payroll.');

    const adjustments = this.get<PayrollAdjustment[]>(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, []);
    const recordId = `payrec-${employeeId}-${period.year}-${period.month}`;

    const newAdj: PayrollAdjustment = {
      id: `adj-${Date.now()}`,
      payroll_record_id: recordId,
      type,
      amount,
      reason,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    adjustments.push(newAdj);
    this.set(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, adjustments);

    // Recalculate to incorporate new adjustment
    await this.calculatePayrollForPeriod(period.year, period.month);

    await this.addAuditLog({
      action: 'ADD_PAYROLL_ADJUSTMENT',
      entity_type: 'PAYROLL_ADJUSTMENT',
      entity_id: newAdj.id,
      new_values: newAdj,
      description: `Added ${type} adjustment of ${formatINR(amount)} to employee ID ${employeeId} for period ${period.month}/${period.year}. Reason: ${reason}.`,
    });

    return newAdj;
  }

  public async approvePayrollPeriod(periodId: string): Promise<PayrollPeriod> {
    const currentUser = await this.getCurrentUser();
    const periods = await this.getPayrollPeriods();
    const idx = periods.findIndex((p) => p.id === periodId);
    if (idx === -1) throw new Error('Payroll period not found');
    if (periods[idx].status === 'Finalized') throw new Error('Period is already finalized.');

    periods[idx].status = 'Approved';
    periods[idx].approved_at = new Date().toISOString();
    periods[idx].approved_by = currentUser.id;
    periods[idx].approved_by_name = currentUser.full_name;
    periods[idx].updated_at = new Date().toISOString();
    this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);

    await this.addAuditLog({
      action: 'APPROVE_PAYROLL',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      description: `Approved payroll period ${periods[idx].month}/${periods[idx].year}.`,
    });

    return periods[idx];
  }

  public async finalizePayrollPeriod(periodId: string): Promise<PayrollPeriod> {
    const currentUser = await this.getCurrentUser();
    const periods = await this.getPayrollPeriods();
    const idx = periods.findIndex((p) => p.id === periodId);
    if (idx === -1) throw new Error('Payroll period not found');
    if (periods[idx].status !== 'Approved') throw new Error('Payroll must be Approved before Finalization.');

    periods[idx].status = 'Finalized';
    periods[idx].finalized_at = new Date().toISOString();
    periods[idx].finalized_by = currentUser.id;
    periods[idx].finalized_by_name = currentUser.full_name;
    periods[idx].updated_at = new Date().toISOString();
    this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);

    await this.addAuditLog({
      action: 'FINALIZE_PAYROLL',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      description: `Finalized and locked payroll period ${periods[idx].month}/${periods[idx].year}.`,
    });

    return periods[idx];
  }

  public async reopenPayrollPeriod(periodId: string, reason: string): Promise<PayrollPeriod> {
    const currentUser = await this.getCurrentUser();
    const periods = await this.getPayrollPeriods();
    const idx = periods.findIndex((p) => p.id === periodId);
    if (idx === -1) throw new Error('Payroll period not found');
    if (periods[idx].status !== 'Finalized') throw new Error('Only finalized periods can be reopened.');

    periods[idx].status = 'Under Review';
    periods[idx].reopened_at = new Date().toISOString();
    periods[idx].reopened_by = currentUser.id;
    periods[idx].reopen_reason = reason;
    periods[idx].updated_at = new Date().toISOString();
    this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);

    await this.addAuditLog({
      action: 'REOPEN_PAYROLL',
      entity_type: 'PAYROLL_PERIOD',
      entity_id: periodId,
      description: `Reopened finalized payroll period ${periods[idx].month}/${periods[idx].year}. Reason: ${reason}.`,
    });

    return periods[idx];
  }

  // Audit Logs
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public async addAuditLog(logData: {
    user_id?: string;
    user_name?: string;
    user_role?: UserRole;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    description: string;
  }): Promise<AuditLog> {
    const currentUser = await this.getCurrentUser().catch(() => INITIAL_PROFILES[0]);
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: logData.user_id || currentUser.id,
      user_name: logData.user_name || currentUser.full_name,
      user_role: logData.user_role || currentUser.role,
      action: logData.action,
      entity_type: logData.entity_type,
      entity_id: logData.entity_id,
      old_values: logData.old_values,
      new_values: logData.new_values,
      description: logData.description,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    logs.unshift(newLog);
    // Keep last 500 logs
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  // Settings
  public async getCompanySettings(): Promise<CompanySettings> {
    return this.get<CompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, INITIAL_COMPANY_SETTINGS);
  }

  public async saveCompanySettings(settings: CompanySettings): Promise<void> {
    this.set(STORAGE_KEYS.COMPANY_SETTINGS, settings);
    await this.addAuditLog({
      action: 'UPDATE_COMPANY_SETTINGS',
      entity_type: 'SETTINGS',
      new_values: settings,
      description: `Updated company profile details for ${settings.company_name}.`,
    });
  }

  public async getPayrollRules(): Promise<PayrollRuleSettings> {
    return this.get<PayrollRuleSettings>(STORAGE_KEYS.PAYROLL_RULES, INITIAL_PAYROLL_RULES);
  }

  public async savePayrollRules(rules: PayrollRuleSettings): Promise<void> {
    this.set(STORAGE_KEYS.PAYROLL_RULES, rules);
    await this.addAuditLog({
      action: 'UPDATE_PAYROLL_RULES',
      entity_type: 'SETTINGS',
      new_values: rules,
      description: 'Updated system payroll calculation rules and overtime parameters.',
    });
  }

  public async resetDemoData(): Promise<void> {
    localStorage.clear();
    this.init();
    await this.addAuditLog({
      action: 'RESET_DEMO_DATA',
      entity_type: 'SYSTEM',
      description: 'Reset database to initial Hyderabad earthmoving operations state.',
    });
  }
}

export const db = new DatabaseService();
db.init();
