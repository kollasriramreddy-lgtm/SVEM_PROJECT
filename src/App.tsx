import React, { useState, useEffect } from 'react';
import { Profile, CompanySettings } from './types';
import { db } from './services/db/database';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceHistoryPage } from './pages/AttendanceHistoryPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ManagersPage } from './pages/ManagersPage';
import { SitesPage } from './pages/SitesPage';
import { PayrollPage } from './pages/PayrollPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initApp() {
      try {
        const [user, company] = await Promise.all([
          db.getCurrentUser(),
          db.getCompanySettings(),
        ]);
        setCurrentUser(user);
        setCompanySettings(company);
      } catch (e) {
        console.error('App init error:', e);
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: Profile) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleUserChange = (user: Profile) => {
    setCurrentUser(user);
    // If manager is currently on an admin-only tab, redirect safely to dashboard
    if (user.role === 'manager' && ['managers', 'payroll', 'reports', 'audit-logs', 'settings'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-400">
            Siddi Vinayaka Earth Movers
          </p>
          <p className="text-[11px] text-slate-400">Loading Management Portal...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Login Screen
  if (!currentUser || !companySettings) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'attendance':
        return 'Daily Attendance Register';
      case 'attendance-history':
        return 'Monthly Attendance Matrix';
      case 'sites':
        return currentUser.role === 'super_admin' ? 'Project Sites Management' : 'Assigned Sites';
      case 'employees':
        return currentUser.role === 'super_admin' ? 'Workforce & Operators' : 'Site Workers';
      case 'managers':
        return 'Site Supervisors';
      case 'payroll':
        return 'Payroll Calculation Engine';
      case 'reports':
        return 'Reports & Export Center';
      case 'audit-logs':
        return 'Security Audit Trail';
      case 'settings':
        return 'System & Rule Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        company={companySettings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        currentPageTitle={getPageTitle()}
      />

      {/* Main Body Container with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardPage currentUser={currentUser} onNavigate={setCurrentTab} />
            )}

            {currentTab === 'attendance' && (
              <AttendancePage currentUser={currentUser} />
            )}

            {currentTab === 'attendance-history' && (
              <AttendanceHistoryPage currentUser={currentUser} />
            )}

            {currentTab === 'sites' && (
              <SitesPage currentUser={currentUser} />
            )}

            {currentTab === 'employees' && (
              <EmployeesPage currentUser={currentUser} />
            )}

            {currentTab === 'managers' && currentUser.role === 'super_admin' && (
              <ManagersPage />
            )}

            {currentTab === 'payroll' && currentUser.role === 'super_admin' && (
              <PayrollPage currentUser={currentUser} />
            )}

            {currentTab === 'reports' && currentUser.role === 'super_admin' && (
              <ReportsPage />
            )}

            {currentTab === 'audit-logs' && currentUser.role === 'super_admin' && (
              <AuditLogsPage />
            )}

            {currentTab === 'settings' && currentUser.role === 'super_admin' && (
              <SettingsPage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
