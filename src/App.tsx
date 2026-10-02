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

// New Accounts & Work Pages
import { ClientsPage } from './pages/ClientsPage';
import { ClientAccountDetailPage } from './pages/ClientAccountDetailPage';
import { VendorsPage } from './pages/VendorsPage';
import { VendorAccountDetailPage } from './pages/VendorAccountDetailPage';
import { DailyWorkPage } from './pages/DailyWorkPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { AdvancesPage } from './pages/AdvancesPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { PurchaseBillsPage } from './pages/PurchaseBillsPage';
import { WorkerAccountDetailPage } from './pages/WorkerAccountDetailPage';

// Modals
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { PaymentEntryModal } from './components/payments/PaymentEntryModal';
import { ReceiptModal } from './components/receipts/ReceiptModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drill-down selected IDs
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCentralPaymentOpen, setIsCentralPaymentOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);

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

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    if (user.role === 'manager' && ['managers', 'payroll', 'reports', 'audit-logs', 'settings'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  const handleNavigateWithEntity = (tabId: string, entityId?: string) => {
    if (tabId === 'clients') {
      setSelectedClientId(entityId || null);
    } else if (tabId === 'vendors') {
      setSelectedVendorId(entityId || null);
    } else if (tabId === 'employees') {
      setSelectedWorkerId(entityId || null);
    }
    setCurrentTab(tabId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-400">
            Siddi Vinayaka Earth Movers
          </p>
          <p className="text-[11px] text-slate-400">Loading Accounts & Operations Portal...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !companySettings) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Accounts Dashboard';
      case 'daily-work':
        return 'Daily Work Tracking';
      case 'clients':
        return 'Client Accounts';
      case 'vendors':
        return 'Vendor Accounts';
      case 'payment-history':
        return 'Payment History & Vouchers';
      case 'advances':
        return 'Advances Register';
      case 'materials':
        return 'Materials & Inventory';
      case 'purchases':
        return 'Material Purchase Bills';
      case 'attendance':
        return 'Daily Attendance Register';
      case 'attendance-history':
        return 'Attendance History Matrix';
      case 'sites':
        return 'Project Sites Management';
      case 'employees':
        return 'Workforce & Machine Operators';
      case 'managers':
        return 'Site Supervisors';
      case 'payroll':
        return 'Payroll Calculation Engine';
      case 'reports':
        return 'Financial & Operational Reports';
      case 'audit-logs':
        return 'Security Audit Trail';
      case 'settings':
        return 'System & Accounting Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        company={companySettings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        currentPageTitle={getPageTitle()}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPaymentModal={() => setIsCentralPaymentOpen(true)}
      />

      {/* Main Body Container with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tabId) => {
            setSelectedClientId(null);
            setSelectedVendorId(null);
            setSelectedWorkerId(null);
            setCurrentTab(tabId);
          }}
          userRole={currentUser.role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardPage
                currentUser={currentUser}
                onNavigate={handleNavigateWithEntity}
              />
            )}

            {currentTab === 'daily-work' && (
              <DailyWorkPage
                currentUser={currentUser}
                onSelectWorkerAccount={(wId) => {
                  setSelectedWorkerId(wId);
                  setCurrentTab('employees');
                }}
              />
            )}

            {currentTab === 'clients' && (
              selectedClientId ? (
                <ClientAccountDetailPage
                  clientId={selectedClientId}
                  onBack={() => setSelectedClientId(null)}
                />
              ) : (
                <ClientsPage
                  currentUser={currentUser}
                  onSelectClientAccount={(cId) => setSelectedClientId(cId)}
                />
              )
            )}

            {currentTab === 'vendors' && (
              selectedVendorId ? (
                <VendorAccountDetailPage
                  vendorId={selectedVendorId}
                  onBack={() => setSelectedVendorId(null)}
                />
              ) : (
                <VendorsPage
                  currentUser={currentUser}
                  onSelectVendorAccount={(vId) => setSelectedVendorId(vId)}
                />
              )
            )}

            {currentTab === 'payment-history' && (
              <PaymentHistoryPage
                currentUser={currentUser}
                onSelectAccount={(accType, accId) => {
                  if (accType === 'Client') {
                    setSelectedClientId(accId);
                    setCurrentTab('clients');
                  } else if (accType === 'Vendor') {
                    setSelectedVendorId(accId);
                    setCurrentTab('vendors');
                  } else if (accType === 'Worker') {
                    setSelectedWorkerId(accId);
                    setCurrentTab('employees');
                  }
                }}
              />
            )}

            {currentTab === 'advances' && (
              <AdvancesPage
                currentUser={currentUser}
                onSelectWorkerAccount={(wId) => {
                  setSelectedWorkerId(wId);
                  setCurrentTab('employees');
                }}
              />
            )}

            {currentTab === 'materials' && (
              <MaterialsPage
                currentUser={currentUser}
                onOpenPurchases={() => setCurrentTab('purchases')}
              />
            )}

            {currentTab === 'purchases' && (
              <PurchaseBillsPage
                currentUser={currentUser}
                onSelectVendorAccount={(vId) => {
                  setSelectedVendorId(vId);
                  setCurrentTab('vendors');
                }}
              />
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
              selectedWorkerId ? (
                <WorkerAccountDetailPage
                  workerId={selectedWorkerId}
                  onBack={() => setSelectedWorkerId(null)}
                />
              ) : (
                <EmployeesPage currentUser={currentUser} />
              )
            )}

            {currentTab === 'managers' && currentUser.role === 'super_admin' && (
              <ManagersPage />
            )}

            {currentTab === 'payroll' && currentUser.role === 'super_admin' && (
              <PayrollPage currentUser={currentUser} />
            )}

            {currentTab === 'reports' && (
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

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectEntity={handleNavigateWithEntity}
        />
      )}

      {/* Central Add Payment Modal */}
      {isCentralPaymentOpen && (
        <PaymentEntryModal
          isOpen={isCentralPaymentOpen}
          onClose={() => setIsCentralPaymentOpen(false)}
          onSuccess={(newPayment) => {
            setReceiptPayment(newPayment);
          }}
        />
      )}

      {/* Receipt Modal Viewer for Central Payment */}
      {receiptPayment && companySettings && (
        <ReceiptModal
          isOpen={Boolean(receiptPayment)}
          onClose={() => setReceiptPayment(null)}
          payment={receiptPayment}
          company={companySettings}
        />
      )}
    </div>
  );
}

export default App;
