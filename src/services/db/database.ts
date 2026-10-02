import {
  Profile,
  Site,
  Employee,
  SalaryHistory,
  ManagerSiteAssignment,
  Attendance,
  AttendanceStatus,
  PayrollPeriod,
  PayrollRecord,
  PayrollAdjustment,
  AdjustmentType,
  AuditLog,
  CompanySettings,
  PayrollRuleSettings,
  UserRole,
  Client,
  Vendor,
  Machine,
  Material,
  DailyWorkEntry,
  Advance,
  PurchaseBill,
  Payment,
  Settlement,
  SettlementItem,
  LedgerEntry,
  AppNotification,
  AccountsDashboardSummary,
  DashboardFilter,
  PaymentDirection,
  PaymentMode,
  PaymentCategory,
  AccountType,
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
  // Accounts & Work Tracking Keys
  CLIENTS: 'svem_clients',
  VENDORS: 'svem_vendors',
  MACHINES: 'svem_machines',
  MATERIALS: 'svem_materials',
  DAILY_WORK_ENTRIES: 'svem_daily_work_entries',
  ADVANCES: 'svem_advances',
  PURCHASE_BILLS: 'svem_purchase_bills',
  PAYMENTS: 'svem_payments',
  SETTLEMENTS: 'svem_settlements',
  LEDGER_ENTRIES: 'svem_ledger_entries',
  NOTIFICATIONS: 'svem_notifications',
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
    notes: 'Expert in hydraulic rock excavator handling and tough trench slopes.',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'emp-002',
    employee_code: 'SVEM-EMP-002',
    full_name: 'Mahesh Yadav',
    phone: '+91 97010 11002',
    designation: 'Senior JCB 3DX Operator',
    worker_type: 'JCB Operator',
    joining_date: '2024-02-15',
    site_id: 'site-orr-01',
    monthly_salary: 26000,
    salary_effective_from: '2024-02-15',
    status: 'active',
    notes: 'Skilled in trenching, foundation footing backfill and tight maneuvers.',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 'emp-003',
    employee_code: 'SVEM-EMP-003',
    full_name: 'Ramesh Nayak',
    phone: '+91 97010 11003',
    designation: 'Master Rock Driller & Compressor Operator',
    worker_type: 'Rock Driller',
    joining_date: '2024-03-01',
    site_id: 'site-orr-01',
    monthly_salary: 28000,
    salary_effective_from: '2024-03-01',
    status: 'active',
    notes: 'Specialist in 32mm blast hole pneumatic wagon drill rigs in hard granite.',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 'emp-004',
    employee_code: 'SVEM-EMP-004',
    full_name: 'Prakash Reddy',
    phone: '+91 97010 11004',
    designation: 'Heavy Tipper Driver (10-Tyre)',
    worker_type: 'Driver',
    joining_date: '2024-04-01',
    site_id: 'site-gcb-02',
    monthly_salary: 22000,
    salary_effective_from: '2024-04-01',
    status: 'active',
    notes: 'Excavated rock muck shifting & quarry transport.',
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-04-01T10:00:00Z',
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
    notes: 'Site leveling, signalman & manual clearance.',
    created_at: '2024-05-10T10:00:00Z',
    updated_at: '2024-05-10T10:00:00Z',
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-hmda-01',
    client_name: 'HMDA Project Division',
    company_name: 'HMDA Infrastructure Ltd',
    phone: '+91 94401 12233',
    address: 'Tarnaka, Hyderabad, Telangana 500007',
    gst_number: '36AAACH1234A1ZT',
    opening_balance: 350000,
    credit_limit: 2000000,
    notes: 'Govt expressway rock-cutting & boulder excavation contract.',
    status: 'active',
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-05T09:00:00Z',
  },
  {
    id: 'client-aparna-02',
    client_name: 'Venkatesh Rao (Director)',
    company_name: 'Aparna Infra Projects',
    phone: '+91 98492 44556',
    address: 'Road No 36, Jubilee Hills, Hyderabad',
    gst_number: '36AAPCA5678B1ZR',
    opening_balance: 180000,
    credit_limit: 1500000,
    notes: 'Commercial cellar deep excavation & rock drilling.',
    status: 'active',
    created_at: '2024-02-10T09:00:00Z',
    updated_at: '2024-02-10T09:00:00Z',
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vendor-maxwell-01',
    vendor_name: 'Maxwell Mining Supplies',
    company_name: 'Maxwell Rock Cutting Tools Ltd',
    phone: '+91 98495 55667',
    address: 'Autonagar, Vijayawada & Jeedimetla, Hyderabad',
    gst_number: '36AABCM4433D1ZS',
    vendor_category: 'Drill-bit Supplier',
    opening_balance: 100000,
    credit_limit: 500000,
    notes: 'Primary vendor for 32mm / 34mm carbide button bits and drill rods.',
    status: 'active',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'vendor-diesel-02',
    vendor_name: 'Sri Balaji Fuel Station',
    company_name: 'Telangana Diesel & Lubricants',
    phone: '+91 98491 88990',
    address: 'Hayathnagar Highway, Hyderabad',
    gst_number: '36AAFTD1122E1ZX',
    vendor_category: 'Diesel Supplier',
    opening_balance: 65000,
    credit_limit: 400000,
    notes: 'Bulk diesel bowser delivery for onsite compressors and excavators.',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  company_name: 'Siddi Vinayaka Earth Movers',
  tagline: 'Excavation, Blasting, Rock Cutting & Heavy Equipment Operations',
  address: 'Plot 42, Industrial Development Area, Uppal, Hyderabad, Telangana 500039',
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

class DatabaseService {
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      this.set(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SITES)) {
      this.set(STORAGE_KEYS.SITES, INITIAL_SITES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.set(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENDORS)) {
      this.set(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS)) {
      this.set(STORAGE_KEYS.COMPANY_SETTINGS, INITIAL_COMPANY_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_RULES)) {
      this.set(STORAGE_KEYS.PAYROLL_RULES, INITIAL_PAYROLL_RULES);
    }

    this.isInitialized = true;
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from LocalStorage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to LocalStorage:`, e);
    }
  }

  // Auth / Login
  public async login(email: string, pass: string): Promise<Profile> {
    const profiles = await this.getProfiles();
    const user = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (user && user.status === 'active') {
      await this.setCurrentUser(user);
      return user;
    }
    throw new Error('Invalid email or inactive profile.');
  }

  public async getCurrentUser(): Promise<Profile> {
    return this.get<Profile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  }

  public async setCurrentUser(user: Profile): Promise<void> {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public async getProfiles(): Promise<Profile[]> {
    return this.get<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  public async createProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    const profiles = await this.getProfiles();
    const newP: Profile = {
      ...profileData,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newP);
    this.set(STORAGE_KEYS.PROFILES, profiles);
    return newP;
  }

  public async updateProfile(
    idOrProfile: string | Profile,
    updates?: Partial<Profile>
  ): Promise<Profile | undefined> {
    const profiles = await this.getProfiles();
    const id = typeof idOrProfile === 'string' ? idOrProfile : idOrProfile.id;
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const existing = profiles[idx];
      const merged =
        typeof idOrProfile === 'string'
          ? { ...existing, ...updates, updated_at: new Date().toISOString() }
          : { ...existing, ...idOrProfile, updated_at: new Date().toISOString() };
      profiles[idx] = merged as Profile;
      this.set(STORAGE_KEYS.PROFILES, profiles);
      return profiles[idx];
    }
    return undefined;
  }

  // Sites
  public async getSites(managerId?: string): Promise<Site[]> {
    let sites = this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);
    if (managerId) {
      const assignments = await this.getManagerSiteAssignments(managerId);
      const assignedIds = assignments.filter((a) => a.status === 'active').map((a) => a.site_id);
      sites = sites.filter((s) => assignedIds.includes(s.id));
    }
    return sites;
  }

  public async getSiteById(id: string): Promise<Site | undefined> {
    const sites = await this.getSites();
    return sites.find((s) => s.id === id);
  }

  public async createSite(siteData: Omit<Site, 'id' | 'created_at' | 'updated_at'>): Promise<Site> {
    const sites = await this.getSites();
    const newSite: Site = {
      ...siteData,
      id: `site-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sites.push(newSite);
    this.set(STORAGE_KEYS.SITES, sites);
    return newSite;
  }

  public async updateSite(
    idOrSite: string | Site,
    updates?: Partial<Site>
  ): Promise<Site | undefined> {
    const sites = await this.getSites();
    const id = typeof idOrSite === 'string' ? idOrSite : idOrSite.id;
    const index = sites.findIndex((s) => s.id === id);
    if (index !== -1) {
      const existing = sites[index];
      const merged =
        typeof idOrSite === 'string'
          ? { ...existing, ...updates, updated_at: new Date().toISOString() }
          : { ...existing, ...idOrSite, updated_at: new Date().toISOString() };
      sites[index] = merged as Site;
      this.set(STORAGE_KEYS.SITES, sites);
      return sites[index];
    }
    return undefined;
  }

  // Manager Site Assignments
  public async getManagerSiteAssignments(managerId?: string): Promise<ManagerSiteAssignment[]> {
    let assignments = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, []);
    const sites = await this.getSites();
    const profiles = await this.getProfiles();

    if (managerId) {
      assignments = assignments.filter((a) => a.manager_id === managerId);
    }

    return assignments.map((a) => ({
      ...a,
      site: sites.find((s) => s.id === a.site_id),
      manager: profiles.find((p) => p.id === a.manager_id),
    }));
  }

  public async assignManagerToSite(managerId: string, siteId: string): Promise<void> {
    const assignments = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, []);
    const exists = assignments.find((a) => a.manager_id === managerId && a.site_id === siteId);
    if (!exists) {
      assignments.push({
        id: `msa-${Date.now()}`,
        manager_id: managerId,
        site_id: siteId,
        assigned_from: new Date().toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, assignments);
    }
  }

  public async removeManagerSiteAssignment(assignmentId: string): Promise<void> {
    let assignments = this.get<ManagerSiteAssignment[]>(STORAGE_KEYS.MANAGER_ASSIGNMENTS, []);
    assignments = assignments.filter((a) => a.id !== assignmentId);
    this.set(STORAGE_KEYS.MANAGER_ASSIGNMENTS, assignments);
  }

  // Employees
  public async getEmployees(siteId?: string, managerId?: string): Promise<Employee[]> {
    let employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const sites = await this.getSites();

    if (siteId) {
      employees = employees.filter((e) => e.site_id === siteId);
    } else if (managerId) {
      const assignments = await this.getManagerSiteAssignments(managerId);
      const siteIds = assignments.filter((a) => a.status === 'active').map((a) => a.site_id);
      employees = employees.filter((e) => e.site_id && siteIds.includes(e.site_id));
    }

    return employees.map((emp) => {
      const site = sites.find((s) => s.id === emp.site_id);
      return {
        ...emp,
        site_name: site ? site.site_name : 'Unassigned',
      };
    });
  }

  public async getEmployeeById(id: string): Promise<Employee | undefined> {
    const employees = await this.getEmployees();
    return employees.find((e) => e.id === id);
  }

  public async createEmployee(empData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    employees.push(newEmp);
    this.set(STORAGE_KEYS.EMPLOYEES, employees);
    return newEmp;
  }

  public async updateEmployee(
    idOrEmp: string | Employee,
    updates?: Partial<Employee>
  ): Promise<Employee | undefined> {
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const id = typeof idOrEmp === 'string' ? idOrEmp : idOrEmp.id;
    const index = employees.findIndex((e) => e.id === id);
    if (index !== -1) {
      const existing = employees[index];
      const merged =
        typeof idOrEmp === 'string'
          ? { ...existing, ...updates, updated_at: new Date().toISOString() }
          : { ...existing, ...idOrEmp, updated_at: new Date().toISOString() };
      employees[index] = merged as Employee;
      this.set(STORAGE_KEYS.EMPLOYEES, employees);
      return employees[index];
    }
    return undefined;
  }

  public async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    const history = this.get<SalaryHistory[]>(STORAGE_KEYS.SALARY_HISTORY, []);
    return history.filter((h) => h.employee_id === employeeId);
  }

  public async getSalaryHistoryForEmployee(employeeId: string): Promise<SalaryHistory[]> {
    return this.getSalaryHistory(employeeId);
  }

  public async recordSalaryRevision(
    employeeId: string,
    newSalary: number,
    reason: string
  ): Promise<void> {
    const employees = await this.getEmployees();
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      const history = this.get<SalaryHistory[]>(STORAGE_KEYS.SALARY_HISTORY, []);
      history.unshift({
        id: `sh-${Date.now()}`,
        employee_id: employeeId,
        previous_salary: emp.monthly_salary,
        new_salary: newSalary,
        effective_from: new Date().toISOString().split('T')[0],
        reason: reason,
        created_at: new Date().toISOString(),
      });
      this.set(STORAGE_KEYS.SALARY_HISTORY, history);

      emp.monthly_salary = newSalary;
      await this.updateEmployee(emp);
    }
  }

  public async updateEmployeeSalary(
    employeeId: string,
    newSalary: number,
    effectiveFromOrReason: string,
    reason?: string
  ): Promise<void> {
    const actualReason = reason || effectiveFromOrReason;
    return this.recordSalaryRevision(employeeId, newSalary, actualReason);
  }

  // Attendance
  public async getAttendance(date?: string, siteId?: string): Promise<Attendance[]> {
    let attendance = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const sites = this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);

    if (date) attendance = attendance.filter((a) => a.attendance_date === date);
    if (siteId) attendance = attendance.filter((a) => a.site_id === siteId);

    return attendance.map((att) => {
      const emp = employees.find((e) => e.id === att.employee_id);
      const site = sites.find((s) => s.id === att.site_id);
      return {
        ...att,
        employee_name: emp ? emp.full_name : 'Unknown',
        employee_code: emp ? emp.employee_code : '',
        designation: emp ? emp.designation : '',
        site_name: site ? site.site_name : '',
      };
    });
  }

  public async getAttendanceForMonth(year: number, month: number): Promise<Attendance[]> {
    const attendance = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthAtt = attendance.filter((a) => a.attendance_date.startsWith(prefix));

    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const sites = this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);

    return monthAtt.map((att) => {
      const emp = employees.find((e) => e.id === att.employee_id);
      const site = sites.find((s) => s.id === att.site_id);
      return {
        ...att,
        employee_name: emp ? emp.full_name : 'Unknown',
        employee_code: emp ? emp.employee_code : '',
        designation: emp ? emp.designation : '',
        site_name: site ? site.site_name : '',
      };
    });
  }

  public async getAttendanceForSiteAndDate(siteId: string, date: string): Promise<Attendance[]> {
    return this.getAttendance(date, siteId);
  }

  public async saveBatchAttendance(
    siteId: string,
    date: string,
    records: { employee_id: string; status: AttendanceStatus; shift?: string; remarks?: string }[]
  ): Promise<void> {
    let attendance = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    attendance = attendance.filter((a) => !(a.site_id === siteId && a.attendance_date === date));

    const newEntries: Attendance[] = records.map((r, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      site_id: siteId,
      attendance_date: date,
      employee_id: r.employee_id,
      status: r.status,
      shift: (r.shift === 'Night' ? 'Night' : 'Day') as 'Day' | 'Night',
      remarks: r.remarks || '',
      marked_at: new Date().toISOString(),
      marked_by: 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    attendance.push(...newEntries);
    this.set(STORAGE_KEYS.ATTENDANCE, attendance);
  }

  public async markAttendance(records: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const attendance = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const now = new Date().toISOString();

    records.forEach((rec) => {
      const idx = attendance.findIndex(
        (a) => a.employee_id === rec.employee_id && a.attendance_date === rec.attendance_date
      );
      if (idx !== -1) {
        attendance[idx] = { ...attendance[idx], ...rec, updated_at: now };
      } else {
        attendance.push({
          ...rec,
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          created_at: now,
          updated_at: now,
        });
      }
    });

    this.set(STORAGE_KEYS.ATTENDANCE, attendance);
  }

  // Payroll
  public async calculatePayrollForPeriod(
    year: number,
    month: number
  ): Promise<{ period: PayrollPeriod; records: PayrollRecord[] }> {
    const periods = this.get<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, []);
    let period = periods.find((p) => p.year === year && p.month === month);

    if (!period) {
      period = {
        id: `period-${year}-${month}`,
        year,
        month,
        status: 'Draft',
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      periods.push(period);
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
    }

    const employees = await this.getEmployees();
    const attendance = await this.getAttendanceForMonth(year, month);
    const rules = await this.getPayrollRules();
    const adjustments = this.get<PayrollAdjustment[]>(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, []);

    const records: PayrollRecord[] = employees.map((emp) => {
      const empAtt = attendance.filter((a) => a.employee_id === emp.id);
      const empAdj = adjustments.filter((a) => a.payroll_record_id === `${period!.id}-${emp.id}`);
      return calculateEmployeePayroll({
        employee: emp,
        year,
        month,
        attendances: empAtt,
        adjustments: empAdj,
        rules,
      });
    });

    this.set(STORAGE_KEYS.PAYROLL_RECORDS, records);
    return { period, records };
  }

  public async approvePayrollPeriod(periodId: string): Promise<PayrollPeriod | null> {
    const periods = this.get<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, []);
    const p = periods.find((x) => x.id === periodId);
    if (p) {
      p.status = 'Approved';
      p.approved_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
      return p;
    }
    return null;
  }

  public async finalizePayrollPeriod(periodId: string): Promise<PayrollPeriod | null> {
    const periods = this.get<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, []);
    const p = periods.find((x) => x.id === periodId);
    if (p) {
      p.status = 'Finalized';
      p.finalized_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
      return p;
    }
    return null;
  }

  public async reopenPayrollPeriod(periodId: string, reason: string): Promise<PayrollPeriod | null> {
    const periods = this.get<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, []);
    const p = periods.find((x) => x.id === periodId);
    if (p) {
      p.status = 'Draft';
      p.reopened_at = new Date().toISOString();
      p.reopen_reason = reason;
      this.set(STORAGE_KEYS.PAYROLL_PERIODS, periods);
      return p;
    }
    return null;
  }

  public async addPayrollAdjustment(
    periodIdOrObj: string | Omit<PayrollAdjustment, 'id' | 'created_at'>,
    employeeId?: string,
    type?: AdjustmentType,
    amount?: number,
    reason?: string
  ): Promise<PayrollAdjustment> {
    const adjustments = this.get<PayrollAdjustment[]>(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, []);
    let newAdj: PayrollAdjustment;

    if (typeof periodIdOrObj === 'object') {
      newAdj = {
        ...periodIdOrObj,
        id: `adj-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
    } else {
      newAdj = {
        id: `adj-${Date.now()}`,
        payroll_record_id: `${periodIdOrObj}-${employeeId}`,
        type: type || 'Bonus',
        amount: amount || 0,
        reason: reason || '',
        created_at: new Date().toISOString(),
      };
    }
    adjustments.push(newAdj);
    this.set(STORAGE_KEYS.PAYROLL_ADJUSTMENTS, adjustments);
    return newAdj;
  }

  public resetDemoData(): void {
    localStorage.clear();
    this.isInitialized = false;
    this.init();
  }

  // Clients
  public async getClients(status?: 'active' | 'inactive'): Promise<Client[]> {
    let clients = this.get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    if (status) clients = clients.filter((c) => c.status === status);

    const workEntries = await this.getDailyWorkEntries();
    const payments = await this.getPayments();

    return clients.map((c) => {
      const clientWork = workEntries.filter((w) => w.client_id === c.id);
      const totalWorkBilled = clientWork.reduce((sum, w) => sum + (w.client_gross_amount || 0), 0);

      const clientPayments = payments.filter((p) => p.account_id === c.id && p.status === 'Approved');
      const totalPaid = clientPayments
        .filter((p) => p.payment_direction === 'Inward')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalAdvance = clientPayments
        .filter((p) => p.payment_category === 'Client advance')
        .reduce((sum, p) => sum + p.amount, 0);

      const currentDue = c.opening_balance + totalWorkBilled - totalPaid;
      const lastPayment = clientPayments
        .filter((p) => p.payment_direction === 'Inward')
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

      return {
        ...c,
        total_billed: totalWorkBilled,
        total_paid: totalPaid,
        total_advance: totalAdvance,
        current_due: currentDue,
        last_payment_date: lastPayment ? lastPayment.payment_date : undefined,
      };
    });
  }

  public async getClientById(id: string): Promise<Client | undefined> {
    const clients = await this.getClients();
    return clients.find((c) => c.id === id);
  }

  public async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const clients = this.get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    clients.push(newClient);
    this.set(STORAGE_KEYS.CLIENTS, clients);

    if (newClient.opening_balance > 0) {
      await this.recordLedgerEntry({
        entry_date: new Date().toISOString().split('T')[0],
        account_type: 'Client',
        account_id: newClient.id,
        account_name: newClient.company_name || newClient.client_name,
        transaction_type: 'Opening Balance',
        description: `Opening receivable balance: ₹${newClient.opening_balance}`,
        direction: 'Outward',
        debit: newClient.opening_balance,
        credit: 0,
        running_balance: newClient.opening_balance,
      });
    }
    return newClient;
  }

  public async updateClient(client: Client): Promise<Client> {
    const clients = this.get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const idx = clients.findIndex((c) => c.id === client.id);
    if (idx !== -1) {
      clients[idx] = { ...client, updated_at: new Date().toISOString() };
      this.set(STORAGE_KEYS.CLIENTS, clients);
    }
    return client;
  }

  // Vendors
  public async getVendors(status?: 'active' | 'inactive'): Promise<Vendor[]> {
    let vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    if (status) vendors = vendors.filter((v) => v.status === status);

    const purchaseBills = await this.getPurchaseBills();
    const payments = await this.getPayments();

    return vendors.map((v) => {
      const vendorBills = purchaseBills.filter((pb) => pb.vendor_id === v.id && pb.status !== 'cancelled');
      const totalPurchases = vendorBills.reduce((sum, b) => sum + b.total_amount, 0);

      const vendorPayments = payments.filter((p) => p.account_id === v.id && p.status === 'Approved');
      const totalPaymentsMade = vendorPayments
        .filter((p) => p.payment_direction === 'Outward')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalAdvances = vendorPayments
        .filter((p) => p.payment_category === 'Vendor advance')
        .reduce((sum, p) => sum + p.amount, 0);

      const currentBalance = v.opening_balance + totalPurchases - totalPaymentsMade;
      const balanceType = currentBalance > 0 ? 'payable' : currentBalance < 0 ? 'receivable' : 'settled';

      const lastPayment = vendorPayments
        .filter((p) => p.payment_direction === 'Outward')
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

      return {
        ...v,
        total_purchases: totalPurchases,
        total_payments_made: totalPaymentsMade,
        total_advances: totalAdvances,
        current_balance: currentBalance,
        balance_type: balanceType,
        last_payment_date: lastPayment ? lastPayment.payment_date : undefined,
      };
    });
  }

  public async getVendorById(id: string): Promise<Vendor | undefined> {
    const vendors = await this.getVendors();
    return vendors.find((v) => v.id === id);
  }

  public async createVendor(vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>): Promise<Vendor> {
    const vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    const newVendor: Vendor = {
      ...vendorData,
      id: `vendor-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vendors.push(newVendor);
    this.set(STORAGE_KEYS.VENDORS, vendors);

    if (newVendor.opening_balance > 0) {
      await this.recordLedgerEntry({
        entry_date: new Date().toISOString().split('T')[0],
        account_type: 'Vendor',
        account_id: newVendor.id,
        account_name: newVendor.company_name || newVendor.vendor_name,
        transaction_type: 'Opening Balance',
        description: `Opening payable balance: ₹${newVendor.opening_balance}`,
        direction: 'Inward',
        debit: 0,
        credit: newVendor.opening_balance,
        running_balance: newVendor.opening_balance,
      });
    }
    return newVendor;
  }

  public async updateVendor(vendor: Vendor): Promise<Vendor> {
    const vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendor.id);
    if (idx !== -1) {
      vendors[idx] = { ...vendor, updated_at: new Date().toISOString() };
      this.set(STORAGE_KEYS.VENDORS, vendors);
    }
    return vendor;
  }

  // Machines
  public async getMachines(): Promise<Machine[]> {
    const machines = this.get<Machine[]>(STORAGE_KEYS.MACHINES, []);
    const sites = this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);
    return machines.map((m) => ({
      ...m,
      site_name: sites.find((s) => s.id === m.site_id)?.site_name || 'Unassigned',
    }));
  }

  // Daily Work Entries
  public async getDailyWorkEntries(filters?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    workerId?: string;
    siteId?: string;
    clientId?: string;
    settlementStatus?: string;
  }): Promise<DailyWorkEntry[]> {
    let entries = this.get<DailyWorkEntry[]>(STORAGE_KEYS.DAILY_WORK_ENTRIES, []);
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const sites = this.get<Site[]>(STORAGE_KEYS.SITES, INITIAL_SITES);
    const clients = this.get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);

    if (filters) {
      if (filters.date) entries = entries.filter((e) => e.work_date === filters.date);
      if (filters.startDate) entries = entries.filter((e) => e.work_date >= filters.startDate!);
      if (filters.endDate) entries = entries.filter((e) => e.work_date <= filters.endDate!);
      if (filters.workerId) entries = entries.filter((e) => e.worker_id === filters.workerId);
      if (filters.siteId) entries = entries.filter((e) => e.site_id === filters.siteId);
      if (filters.clientId) entries = entries.filter((e) => e.client_id === filters.clientId);
      if (filters.settlementStatus) entries = entries.filter((e) => e.settlement_status === filters.settlementStatus);
    }

    return entries
      .map((entry) => {
        const emp = employees.find((e) => e.id === entry.worker_id);
        const site = sites.find((s) => s.id === entry.site_id);
        const client = clients.find((c) => c.id === entry.client_id);
        return {
          ...entry,
          worker_name: emp ? emp.full_name : 'Unknown Worker',
          worker_code: emp ? emp.employee_code : '',
          worker_type: emp ? emp.worker_type : '',
          site_name: site ? site.site_name : 'Unknown Site',
          client_name: client ? client.company_name : entry.client_name,
        };
      })
      .sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime());
  }

  public async createDailyWorkEntry(
    entryData: Omit<DailyWorkEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DailyWorkEntry> {
    const entries = this.get<DailyWorkEntry[]>(STORAGE_KEYS.DAILY_WORK_ENTRIES, []);

    const gross_amount = entryData.quantity * entryData.rate_per_unit;
    const diesel_amount = entryData.diesel_litres * entryData.diesel_rate;
    const client_rate = entryData.client_rate_per_unit || 0;
    const client_gross_amount = entryData.quantity * client_rate;
    const company_diesel_cost = entryData.diesel_supplied_by === 'Company' ? diesel_amount : 0;
    const other_deductions = entryData.other_deductions || 0;
    const cash_advance = entryData.cash_advance || 0;

    const net_payable = gross_amount - company_diesel_cost - cash_advance - other_deductions;
    const estimated_margin = client_gross_amount - gross_amount - company_diesel_cost;

    const newEntry: DailyWorkEntry = {
      ...entryData,
      gross_amount,
      diesel_amount,
      client_gross_amount,
      estimated_margin,
      net_payable,
      id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      settlement_status: 'unsettled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    entries.unshift(newEntry);
    this.set(STORAGE_KEYS.DAILY_WORK_ENTRIES, entries);

    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const worker = employees.find((e) => e.id === newEntry.worker_id);
    const workerName = worker ? worker.full_name : 'Worker';

    await this.recordLedgerEntry({
      entry_date: newEntry.work_date,
      account_type: 'Worker',
      account_id: newEntry.worker_id,
      account_name: workerName,
      transaction_type: 'Daily Work Completed',
      description: `${newEntry.work_category}: ${newEntry.quantity} ${newEntry.measurement_unit} @ ₹${newEntry.rate_per_unit}`,
      direction: 'Inward',
      debit: 0,
      credit: net_payable,
      running_balance: net_payable,
      site_id: newEntry.site_id,
      linked_entity_type: 'work',
      linked_entity_id: newEntry.id,
    });

    return newEntry;
  }

  public async createBatchDailyWorkEntries(
    entriesData: Omit<DailyWorkEntry, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<DailyWorkEntry[]> {
    const created: DailyWorkEntry[] = [];
    for (const item of entriesData) {
      const res = await this.createDailyWorkEntry(item);
      created.push(res);
    }
    return created;
  }

  public async deleteDailyWorkEntry(id: string): Promise<void> {
    let entries = this.get<DailyWorkEntry[]>(STORAGE_KEYS.DAILY_WORK_ENTRIES, []);
    entries = entries.filter((e) => e.id !== id);
    this.set(STORAGE_KEYS.DAILY_WORK_ENTRIES, entries);
  }

  // Advances
  public async getAdvances(filters?: {
    accountType?: AccountType;
    accountId?: string;
    status?: string;
    advanceType?: string;
  }): Promise<Advance[]> {
    let advances = this.get<Advance[]>(STORAGE_KEYS.ADVANCES, []);
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    const clients = this.get<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);

    if (filters) {
      if (filters.accountType) advances = advances.filter((a) => a.account_type === filters.accountType);
      if (filters.accountId) advances = advances.filter((a) => a.account_id === filters.accountId);
      if (filters.status) advances = advances.filter((a) => a.status === filters.status);
      if (filters.advanceType) advances = advances.filter((a) => a.advance_type === filters.advanceType);
    }

    return advances
      .map((adv) => {
        let name = adv.account_name;
        if (!name) {
          if (adv.account_type === 'Worker') {
            name = employees.find((x) => x.id === adv.account_id)?.full_name || 'Worker';
          } else if (adv.account_type === 'Vendor') {
            name = vendors.find((x) => x.id === adv.account_id)?.company_name || 'Vendor';
          } else if (adv.account_type === 'Client') {
            name = clients.find((x) => x.id === adv.account_id)?.company_name || 'Client';
          }
        }
        return {
          ...adv,
          account_name: name,
          remaining_amount: adv.amount - (adv.recovered_amount || 0),
        };
      })
      .sort((a, b) => new Date(b.advance_date).getTime() - new Date(a.advance_date).getTime());
  }

  public async createAdvance(
    data: Omit<Advance, 'id' | 'recovered_amount' | 'remaining_amount' | 'created_at' | 'updated_at'>
  ): Promise<Advance> {
    const advances = this.get<Advance[]>(STORAGE_KEYS.ADVANCES, []);
    const newAdv: Advance = {
      ...data,
      id: `adv-${Date.now()}`,
      recovered_amount: 0,
      remaining_amount: data.amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    advances.unshift(newAdv);
    this.set(STORAGE_KEYS.ADVANCES, advances);

    await this.createPayment({
      payment_date: newAdv.advance_date,
      account_type: newAdv.account_type,
      account_id: newAdv.account_id,
      account_name: newAdv.account_name || 'Account',
      payment_direction: 'Outward',
      payment_category: newAdv.advance_type === 'Diesel advance' ? 'Diesel advance' : 'Cash advance',
      amount: newAdv.amount,
      payment_mode: newAdv.payment_mode,
      reference_number: `ADV-${newAdv.id}`,
      description: `Advance issued: ${newAdv.reason}`,
      site_id: newAdv.site_id,
      status: 'Approved',
    });

    return newAdv;
  }

  public async recoverAdvance(advanceId: string, recoveryAmount: number): Promise<void> {
    const advances = this.get<Advance[]>(STORAGE_KEYS.ADVANCES, []);
    const idx = advances.findIndex((a) => a.id === advanceId);
    if (idx !== -1) {
      const adv = advances[idx];
      const newRecovered = (adv.recovered_amount || 0) + recoveryAmount;
      const remaining = adv.amount - newRecovered;
      adv.recovered_amount = newRecovered;
      adv.remaining_amount = Math.max(0, remaining);
      adv.status = remaining <= 0 ? 'Fully recovered' : 'Partially recovered';
      adv.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.ADVANCES, advances);
    }
  }

  // Materials & Purchases
  public async getMaterials(): Promise<Material[]> {
    const materials = this.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
    const vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    return materials.map((m) => ({
      ...m,
      supplier_name: vendors.find((v) => v.id === m.supplier_id)?.company_name || m.supplier_name,
    }));
  }

  public async createMaterial(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const materials = this.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
    const newMat: Material = {
      ...data,
      id: `mat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    materials.push(newMat);
    this.set(STORAGE_KEYS.MATERIALS, materials);
    return newMat;
  }

  public async updateMaterial(material: Material): Promise<Material> {
    const materials = this.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
    const idx = materials.findIndex((m) => m.id === material.id);
    if (idx !== -1) {
      materials[idx] = { ...material, updated_at: new Date().toISOString() };
      this.set(STORAGE_KEYS.MATERIALS, materials);
    }
    return material;
  }

  public async getPurchaseBills(vendorId?: string): Promise<PurchaseBill[]> {
    let bills = this.get<PurchaseBill[]>(STORAGE_KEYS.PURCHASE_BILLS, []);
    const vendors = this.get<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);

    if (vendorId) bills = bills.filter((b) => b.vendor_id === vendorId);

    return bills
      .map((b) => ({
        ...b,
        vendor_name: vendors.find((v) => v.id === b.vendor_id)?.company_name || b.vendor_name,
      }))
      .sort((a, b) => new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime());
  }

  public async createPurchaseBill(
    billData: Omit<PurchaseBill, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PurchaseBill> {
    const bills = this.get<PurchaseBill[]>(STORAGE_KEYS.PURCHASE_BILLS, []);
    const materials = this.get<Material[]>(STORAGE_KEYS.MATERIALS, []);

    const newBill: PurchaseBill = {
      ...billData,
      id: `pb-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    bills.unshift(newBill);
    this.set(STORAGE_KEYS.PURCHASE_BILLS, bills);

    newBill.items.forEach((item) => {
      const matIdx = materials.findIndex((m) => m.id === item.material_id);
      if (matIdx !== -1) materials[matIdx].current_stock += item.quantity;
    });
    this.set(STORAGE_KEYS.MATERIALS, materials);

    const vendors = await this.getVendors();
    const vendor = vendors.find((v) => v.id === newBill.vendor_id);
    const vendorName = vendor ? vendor.company_name : 'Vendor';

    await this.recordLedgerEntry({
      entry_date: newBill.bill_date,
      account_type: 'Vendor',
      account_id: newBill.vendor_id,
      account_name: vendorName,
      transaction_type: 'Purchase Bill Received',
      reference_no: newBill.bill_number,
      description: `Bill #${newBill.bill_number} for material items (Total: ₹${newBill.total_amount})`,
      direction: 'Inward',
      debit: 0,
      credit: newBill.total_amount,
      running_balance: newBill.total_amount,
    });

    if (newBill.amount_paid > 0) {
      await this.createPayment({
        payment_date: newBill.bill_date,
        account_type: 'Vendor',
        account_id: newBill.vendor_id,
        account_name: vendorName,
        payment_direction: 'Outward',
        payment_category: 'Material payment',
        amount: newBill.amount_paid,
        payment_mode: newBill.payment_mode || 'Bank Transfer',
        reference_number: `BILL-${newBill.bill_number}`,
        description: `Payment towards bill #${newBill.bill_number}`,
        linked_bill_id: newBill.id,
        status: 'Approved',
      });
    }

    return newBill;
  }

  // Payments
  public async getPayments(filters?: {
    accountType?: AccountType;
    accountId?: string;
    direction?: PaymentDirection;
    category?: PaymentCategory;
    mode?: PaymentMode;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Payment[]> {
    let payments = this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []);

    if (filters) {
      if (filters.accountType) payments = payments.filter((p) => p.account_type === filters.accountType);
      if (filters.accountId) payments = payments.filter((p) => p.account_id === filters.accountId);
      if (filters.direction) payments = payments.filter((p) => p.payment_direction === filters.direction);
      if (filters.category) payments = payments.filter((p) => p.payment_category === filters.category);
      if (filters.mode) payments = payments.filter((p) => p.payment_mode === filters.mode);
      if (filters.startDate) payments = payments.filter((p) => p.payment_date >= filters.startDate!);
      if (filters.endDate) payments = payments.filter((p) => p.payment_date <= filters.endDate!);
      if (filters.status) payments = payments.filter((p) => p.status === filters.status);
    }

    return payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  public async getPaymentById(id: string): Promise<Payment | undefined> {
    const payments = await this.getPayments();
    return payments.find((p) => p.id === id || p.transaction_id === id);
  }

  public async createPayment(
    data: Omit<Payment, 'id' | 'transaction_id' | 'created_at' | 'updated_at'>
  ): Promise<Payment> {
    const payments = this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    const txnNum = String(payments.length + 1).padStart(4, '0');
    const transaction_id = `TXN-${new Date().getFullYear()}-${txnNum}`;

    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      transaction_id,
      status: data.status || 'Approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    const isOutward = newPayment.payment_direction === 'Outward';
    await this.recordLedgerEntry({
      entry_date: newPayment.payment_date,
      account_type: newPayment.account_type,
      account_id: newPayment.account_id,
      account_name: newPayment.account_name,
      transaction_type: newPayment.payment_category,
      reference_no: newPayment.transaction_id,
      description: `${newPayment.description} via ${newPayment.payment_mode}`,
      direction: newPayment.payment_direction,
      debit: isOutward ? newPayment.amount : 0,
      credit: !isOutward ? newPayment.amount : 0,
      running_balance: 0,
      site_id: newPayment.site_id,
      linked_entity_type: 'payment',
      linked_entity_id: newPayment.id,
    });

    return newPayment;
  }

  public async cancelPayment(paymentId: string, reason: string, cancelledBy?: string): Promise<void> {
    const payments = this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    const idx = payments.findIndex((p) => p.id === paymentId);
    if (idx !== -1) {
      const payment = payments[idx];
      payment.status = 'Cancelled';
      payment.cancellation_reason = reason;
      payment.cancelled_at = new Date().toISOString();
      payment.cancelled_by = cancelledBy;
      payment.updated_at = new Date().toISOString();
      this.set(STORAGE_KEYS.PAYMENTS, payments);

      const isOutward = payment.payment_direction === 'Outward';
      await this.recordLedgerEntry({
        entry_date: new Date().toISOString().split('T')[0],
        account_type: payment.account_type,
        account_id: payment.account_id,
        account_name: payment.account_name,
        transaction_type: 'Payment Reversal / Cancellation',
        reference_no: `REV-${payment.transaction_id}`,
        description: `Reversal of ${payment.transaction_id}: ${reason}`,
        direction: isOutward ? 'Inward' : 'Outward',
        debit: !isOutward ? payment.amount : 0,
        credit: isOutward ? payment.amount : 0,
        running_balance: 0,
      });
    }
  }

  // Settlements
  public async getSettlements(workerId?: string): Promise<Settlement[]> {
    let settlements = this.get<Settlement[]>(STORAGE_KEYS.SETTLEMENTS, []);
    const employees = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    if (workerId) settlements = settlements.filter((s) => s.worker_id === workerId);

    return settlements
      .map((s) => {
        const emp = employees.find((e) => e.id === s.worker_id);
        return {
          ...s,
          worker_name: emp ? emp.full_name : s.worker_name,
          worker_code: emp ? emp.employee_code : s.worker_code,
        };
      })
      .sort((a, b) => new Date(b.settlement_date).getTime() - new Date(a.settlement_date).getTime());
  }

  public async createSettlement(
    data: Omit<Settlement, 'id' | 'settlement_code' | 'created_at'>
  ): Promise<Settlement> {
    const settlements = this.get<Settlement[]>(STORAGE_KEYS.SETTLEMENTS, []);
    const count = settlements.length + 1;
    const settlement_code = `STL-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const newSettlement: Settlement = {
      ...data,
      id: `stl-${Date.now()}`,
      settlement_code,
      created_at: new Date().toISOString(),
    };

    settlements.unshift(newSettlement);
    this.set(STORAGE_KEYS.SETTLEMENTS, settlements);

    const dailyEntries = this.get<DailyWorkEntry[]>(STORAGE_KEYS.DAILY_WORK_ENTRIES, []);
    dailyEntries.forEach((entry) => {
      if (
        entry.worker_id === newSettlement.worker_id &&
        entry.work_date >= newSettlement.from_date &&
        entry.work_date <= newSettlement.to_date
      ) {
        entry.settlement_status = 'settled';
        entry.settlement_id = newSettlement.id;
      }
    });
    this.set(STORAGE_KEYS.DAILY_WORK_ENTRIES, dailyEntries);

    if (newSettlement.amount_paid_now > 0) {
      await this.createPayment({
        payment_date: newSettlement.settlement_date,
        account_type: 'Worker',
        account_id: newSettlement.worker_id,
        account_name: newSettlement.worker_name || 'Worker',
        payment_direction: 'Outward',
        payment_category: 'Worker salary',
        amount: newSettlement.amount_paid_now,
        payment_mode: newSettlement.payment_mode || 'Cash',
        reference_number: settlement_code,
        description: `Worker settlement ${settlement_code} (${newSettlement.from_date} to ${newSettlement.to_date})`,
        site_id: newSettlement.site_id,
        status: 'Approved',
      });
    }

    return newSettlement;
  }

  // Ledger Entries
  public async getLedgerEntries(
    accountType?: AccountType,
    accountId?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<LedgerEntry[]> {
    let entries = this.get<LedgerEntry[]>(STORAGE_KEYS.LEDGER_ENTRIES, []);

    if (accountType) entries = entries.filter((e) => e.account_type === accountType);
    if (accountId) entries = entries.filter((e) => e.account_id === accountId);
    if (filters?.startDate) entries = entries.filter((e) => e.entry_date >= filters.startDate!);
    if (filters?.endDate) entries = entries.filter((e) => e.entry_date <= filters.endDate!);

    return entries.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  }

  public async recordLedgerEntry(data: Omit<LedgerEntry, 'id' | 'status' | 'created_at'>): Promise<LedgerEntry> {
    const entries = this.get<LedgerEntry[]>(STORAGE_KEYS.LEDGER_ENTRIES, []);
    const newEntry: LedgerEntry = {
      ...data,
      id: `led-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    entries.push(newEntry);
    this.set(STORAGE_KEYS.LEDGER_ENTRIES, entries);
    return newEntry;
  }

  // Dashboard Summary
  public async getAccountsDashboardSummary(filter?: DashboardFilter): Promise<AccountsDashboardSummary> {
    const clients = await this.getClients();
    const vendors = await this.getVendors();
    const workEntries = await this.getDailyWorkEntries();
    const payments = await this.getPayments();
    const advances = await this.getAdvances();

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    let filteredPayments = payments.filter((p) => p.status === 'Approved');
    let filteredWork = workEntries;

    if (filter) {
      if (filter.startDate) {
        filteredPayments = filteredPayments.filter((p) => p.payment_date >= filter.startDate!);
        filteredWork = filteredWork.filter((w) => w.work_date >= filter.startDate!);
      }
      if (filter.endDate) {
        filteredPayments = filteredPayments.filter((p) => p.payment_date <= filter.endDate!);
        filteredWork = filteredWork.filter((w) => w.work_date <= filter.endDate!);
      }
      if (filter.siteId) {
        filteredPayments = filteredPayments.filter((p) => p.site_id === filter.siteId);
        filteredWork = filteredWork.filter((w) => w.site_id === filter.siteId);
      }
      if (filter.clientId) {
        filteredPayments = filteredPayments.filter((p) => p.account_id === filter.clientId);
        filteredWork = filteredWork.filter((w) => w.client_id === filter.clientId);
      }
      if (filter.vendorId) {
        filteredPayments = filteredPayments.filter((p) => p.account_id === filter.vendorId);
      }
      if (filter.workerId) {
        filteredPayments = filteredPayments.filter((p) => p.account_id === filter.workerId);
        filteredWork = filteredWork.filter((w) => w.worker_id === filter.workerId);
      }
    }

    const totalClientReceivables = clients.reduce((sum, c) => sum + Math.max(0, c.current_due || 0), 0);
    const totalVendorPayables = vendors.reduce(
      (sum, v) => sum + (v.balance_type === 'payable' ? v.current_balance || 0 : 0),
      0
    );

    const totalWorkerEarnings = filteredWork.reduce((sum, w) => sum + w.gross_amount, 0);
    const totalCashAdvances = advances
      .filter((a) => a.advance_type === 'Cash advance' && a.status !== 'Cancelled')
      .reduce((sum, a) => sum + a.amount, 0);
    const totalDieselAdvances = advances
      .filter((a) => a.advance_type === 'Diesel advance' && a.status !== 'Cancelled')
      .reduce((sum, a) => sum + a.amount, 0);

    const totalPaymentsReceived = filteredPayments
      .filter((p) => p.payment_direction === 'Inward')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPaymentsMade = filteredPayments
      .filter((p) => p.payment_direction === 'Outward')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalOutstandingBalance = totalClientReceivables - totalVendorPayables;

    const todayWorkEntries = workEntries.filter((w) => w.work_date === todayStr);
    const todayWorkValue = todayWorkEntries.reduce((sum, w) => sum + w.gross_amount, 0);
    const todayFeetCompleted = todayWorkEntries
      .filter((w) => w.measurement_unit === 'Feet')
      .reduce((sum, w) => sum + w.quantity, 0);

    const monthPayments = payments.filter(
      (p) => p.status === 'Approved' && p.payment_date.startsWith(currentMonthStr)
    );
    const thisMonthIncome = monthPayments
      .filter((p) => p.payment_direction === 'Inward')
      .reduce((sum, p) => sum + p.amount, 0);
    const thisMonthExpenses = monthPayments
      .filter((p) => p.payment_direction === 'Outward')
      .reduce((sum, p) => sum + p.amount, 0);
    const thisMonthNetMargin = thisMonthIncome - thisMonthExpenses;

    const overdueClientsCount = clients.filter((c) => (c.current_due || 0) > 0).length;
    const overdueVendorsCount = vendors.filter((v) => (v.current_balance || 0) > 0).length;
    const unsettledWorkersCount = workEntries.filter((w) => w.settlement_status === 'unsettled').length;

    return {
      totalClientReceivables,
      totalVendorPayables,
      totalWorkerEarnings,
      totalCashAdvances,
      totalDieselAdvances,
      totalPaymentsReceived,
      totalPaymentsMade,
      totalOutstandingBalance,
      todayWorkValue,
      todayFeetCompleted,
      thisMonthIncome,
      thisMonthExpenses,
      thisMonthNetMargin,
      overdueClientsCount,
      overdueVendorsCount,
      unsettledWorkersCount,
    };
  }

  // Global Search
  public async globalSearch(query: string): Promise<{
    clients: Client[];
    vendors: Vendor[];
    employees: Employee[];
    payments: Payment[];
    purchaseBills: PurchaseBill[];
    materials: Material[];
    sites: Site[];
  }> {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { clients: [], vendors: [], employees: [], payments: [], purchaseBills: [], materials: [], sites: [] };
    }

    const [clients, vendors, employees, payments, purchaseBills, materials, sites] = await Promise.all([
      this.getClients(),
      this.getVendors(),
      this.getEmployees(),
      this.getPayments(),
      this.getPurchaseBills(),
      this.getMaterials(),
      this.getSites(),
    ]);

    return {
      clients: clients.filter(
        (c) =>
          c.client_name.toLowerCase().includes(q) ||
          c.company_name.toLowerCase().includes(q) ||
          c.phone.includes(q)
      ),
      vendors: vendors.filter(
        (v) =>
          v.vendor_name.toLowerCase().includes(q) ||
          v.company_name.toLowerCase().includes(q) ||
          v.vendor_category.toLowerCase().includes(q) ||
          v.phone.includes(q)
      ),
      employees: employees.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.worker_type.toLowerCase().includes(q) ||
          (e.phone && e.phone.includes(q))
      ),
      payments: payments.filter(
        (p) =>
          p.transaction_id.toLowerCase().includes(q) ||
          p.account_name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      ),
      purchaseBills: purchaseBills.filter(
        (b) =>
          b.bill_number.toLowerCase().includes(q) ||
          (b.vendor_name && b.vendor_name.toLowerCase().includes(q))
      ),
      materials: materials.filter(
        (m) => m.material_name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      ),
      sites: sites.filter(
        (s) => s.site_name.toLowerCase().includes(q) || s.site_code.toLowerCase().includes(q)
      ),
    };
  }

  // Notifications
  public async getNotifications(): Promise<AppNotification[]> {
    return this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const notifs = this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].is_read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  // Audit Logs & Settings
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public async addAuditLog(logData: Omit<AuditLog, 'id' | 'created_at' | 'ip_address'>): Promise<AuditLog> {
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
      reason: logData.reason,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  public async getCompanySettings(): Promise<CompanySettings> {
    return this.get<CompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, INITIAL_COMPANY_SETTINGS);
  }

  public async saveCompanySettings(settings: CompanySettings): Promise<void> {
    this.set(STORAGE_KEYS.COMPANY_SETTINGS, settings);
  }

  public async getPayrollRules(): Promise<PayrollRuleSettings> {
    return this.get<PayrollRuleSettings>(STORAGE_KEYS.PAYROLL_RULES, INITIAL_PAYROLL_RULES);
  }

  public async savePayrollRules(rules: PayrollRuleSettings): Promise<void> {
    this.set(STORAGE_KEYS.PAYROLL_RULES, rules);
  }
}

export const db = new DatabaseService();
db.init();
