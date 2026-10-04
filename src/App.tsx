import React from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Sub views
import { DashboardView } from './components/DashboardView';
import { LeaveView } from './components/LeaveView';
import { EmployeeDirectoryView } from './components/EmployeeDirectoryView';
import { ReportsView } from './components/ReportsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';

const AppContent: React.FC = () => {
  const { 
    currentView, 
    setCurrentView,
    sidebarCollapsed, 
    isAuthenticated, 
    currentUser, 
    isLoading, 
    loadError,
    retryLoad 
  } = useApp();

  // 1. Landing Page ALWAYS renders when currentView is landing
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  // 2. Animated Loading Canvas
  if (isLoading || (isAuthenticated && !currentUser)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-main)',
        gap: '1.5rem'
      }}>
        {/* Animated pulsing spinner logo */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          animation: 'pulseGlowing 2s infinite'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
            Loading Dashboard...
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Synchronizing database nodes with FlowSphere AI
          </p>
        </div>
      </div>
    );
  }

  // 3. Error Recovery Screen (for authenticated dashboard load errors)
  if (loadError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-main)',
        padding: '2rem',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: '#FEE2E2',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Unable to load dashboard</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.5' }}>
            {loadError}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={retryLoad} 
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)' }}
          >
            Retry Connection
          </button>
          <button 
            onClick={() => setCurrentView('landing')} 
            className="btn btn-secondary"
            style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)' }}
          >
            Back to Landing Page
          </button>
        </div>
      </div>
    );
  }

  // 4. Unauthenticated Login/Register Screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // 4. Sub-view Routing
  const renderSubView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'leaves':
        return <LeaveView />;
      case 'employees':
        return <EmployeeDirectoryView />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary)' }}>
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Right Side Content Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'margin-left var(--transition-normal)',
        minWidth: 0 // Avoid flex overflow
      }}>
        {/* Top Header Navbar */}
        <Navbar />

        {/* Dynamic page container */}
        <main style={{
          flex: 1,
          padding: '2rem 2.5rem',
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {renderSubView()}
        </main>
      </div>
    </div>
  );
};

export default AppContent;
