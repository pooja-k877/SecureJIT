import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './client/context/AuthContext.js';
import { NotificationProvider, useNotifications } from './client/context/NotificationContext.js';
import { Navbar } from './client/components/Navbar.js';
import { Sidebar } from './client/components/Sidebar.js';
import { ToastContainer } from './client/components/Toast.js';
import { NotificationDrawer } from './client/components/NotificationDrawer.js';
import { RequestDetailModal } from './client/components/RequestDetailModal.js';
import { api } from './client/services/api.js';
import { AccessRequest } from './client/types.js';

// User Pages
import { LoginPage } from './client/pages/LoginPage.js';
import { DashboardPage } from './client/pages/DashboardPage.js';
import { RequestAccessPage } from './client/pages/RequestAccessPage.js';
import { MyRequestsPage } from './client/pages/MyRequestsPage.js';
import { ActiveAccessPage } from './client/pages/ActiveAccessPage.js';
import { EmergencyAccessPage } from './client/pages/EmergencyAccessPage.js';
import { AuditLogsPage } from './client/pages/AuditLogsPage.js';
import { ProfilePage } from './client/pages/ProfilePage.js';

// Admin Pages
import { AdminDashboardPage } from './client/pages/admin/AdminDashboardPage.js';
import { PendingRequestsPage } from './client/pages/admin/PendingRequestsPage.js';
import { UserManagementPage } from './client/pages/admin/UserManagementPage.js';
import { SecurityMonitorPage } from './client/pages/admin/SecurityMonitorPage.js';

function getPageFromPath(pathname: string, isAdminUser: boolean): string {
  const path = pathname.replace(/^\//, '').replace(/\/$/, '');
  switch (path) {
    case 'dashboard':
      return isAdminUser ? 'admin-overview' : 'dashboard';
    case 'request-access':
      return 'request-access';
    case 'requests':
    case 'my-requests':
      return 'my-requests';
    case 'active-access':
      return 'active-access';
    case 'emergency-access':
      return 'emergency-access';
    case 'audit':
    case 'audit-logs':
      return 'audit-logs';
    case 'profile':
      return 'profile';
    case 'admin':
    case 'admin/overview':
      return 'admin-overview';
    case 'admin/requests':
    case 'admin/pending':
      return 'admin-pending';
    case 'admin/users':
      return 'admin-users';
    case 'admin/audit':
      return 'audit-logs';
    case 'admin/security':
    case 'admin/emergency':
      return 'admin-security';
    default:
      return isAdminUser ? 'admin-overview' : 'dashboard';
  }
}

function getPathForPage(page: string): string {
  switch (page) {
    case 'dashboard':
      return '/dashboard';
    case 'request-access':
      return '/request-access';
    case 'my-requests':
      return '/requests';
    case 'active-access':
      return '/active-access';
    case 'emergency-access':
      return '/emergency-access';
    case 'audit-logs':
      return '/audit';
    case 'profile':
      return '/profile';
    case 'admin-overview':
      return '/admin';
    case 'admin-pending':
      return '/admin/requests';
    case 'admin-users':
      return '/admin/users';
    case 'admin-security':
    case 'admin-emergency':
      return '/admin/security';
    default:
      return '/';
  }
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { showToast } = useNotifications();

  const [currentPage, setCurrentPage] = useState<string>(() => {
    return getPageFromPath(window.location.pathname, false);
  });
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Deep inspect modal from notifications or global links
  const [inspectReq, setInspectReq] = useState<AccessRequest | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Sync initial URL path and popstate events (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname, isAdmin));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  // Sync default starting page on role change
  useEffect(() => {
    if (isAuthenticated) {
      const targetPage = getPageFromPath(window.location.pathname, isAdmin);
      if (isAdmin && (targetPage === 'dashboard')) {
        setCurrentPage('admin-overview');
      } else if (!isAdmin && targetPage.startsWith('admin-')) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage(targetPage);
      }
    }
  }, [isAdmin, isAuthenticated]);

  // Load pending count for admin badge
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const fetchBadgeCount = async () => {
        try {
          const res = await api.getAccessRequests({ status: 'PENDING' });
          setPendingCount(res.requests.length);
        } catch (e) {
          // Silent
        }
      };
      fetchBadgeCount();
      const interval = setInterval(fetchBadgeCount, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  const handleNavigate = (page: string) => {
    // Role protection
    if (page.startsWith('admin-') && !isAdmin) {
      showToast('Access denied: Administrator credentials required.', 'error');
      setCurrentPage('dashboard');
      const targetPath = getPathForPage('dashboard');
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
      return;
    }
    setCurrentPage(page);
    const targetPath = getPathForPage(page);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewRequestFromNotification = async (requestId: string) => {
    try {
      const res = await api.getAccessRequestById(requestId);
      setInspectReq(res.request);
      setInspectModalOpen(true);
    } catch (e) {
      showToast(`Could not open request ${requestId}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono tracking-wider">INITIALIZING SECUREJIT REALM...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Enterprise Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          pendingRequestsCount={pendingCount}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {currentPage === 'request-access' && <RequestAccessPage onNavigate={handleNavigate} />}
            {currentPage === 'my-requests' && <MyRequestsPage onNavigate={handleNavigate} />}
            {currentPage === 'active-access' && <ActiveAccessPage onNavigate={handleNavigate} />}
            {currentPage === 'emergency-access' && <EmergencyAccessPage onNavigate={handleNavigate} />}
            {currentPage === 'audit-logs' && <AuditLogsPage />}
            {currentPage === 'profile' && <ProfilePage />}

            {/* Admin Routes */}
            {currentPage === 'admin-overview' && <AdminDashboardPage onNavigate={handleNavigate} />}
            {currentPage === 'admin-pending' && <PendingRequestsPage />}
            {currentPage === 'admin-users' && <UserManagementPage />}
            {currentPage === 'admin-security' && <SecurityMonitorPage />}
            {currentPage === 'admin-emergency' && <SecurityMonitorPage />}
          </div>
        </main>
      </div>

      {/* Global Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onViewRequest={handleViewRequestFromNotification}
      />

      {/* Deep inspect request modal triggered from alerts */}
      <RequestDetailModal
        isOpen={inspectModalOpen}
        request={inspectReq}
        isAdmin={isAdmin}
        onClose={() => setInspectModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
