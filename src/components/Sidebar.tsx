import React from 'react';
import { useApp, type AppView } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentRole,
    currentUser,
    logout
  } = useApp();

  if (!currentUser) return null;

  // Build menu items based on role
  const getMenuItems = () => {
    const items: { view: AppView | 'profile'; label: string; icon: React.ReactNode }[] = [
      {
        view: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
          </svg>
        )
      }
    ];

    if (currentRole === 'employee') {
      items.push(
        {
          view: 'leaves',
          label: 'Leave Actions',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )
        }
      );
    } else if (currentRole === 'manager') {
      items.push(
        {
          view: 'leaves',
          label: 'Leave Requests',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )
        },
        {
          view: 'analytics',
          label: 'Analytics',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          )
        },
        {
          view: 'reports',
          label: 'Reports',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          )
        }
      );
    } else if (currentRole === 'hr' || currentRole === 'admin') {
      items.push(
        {
          view: 'leaves',
          label: 'Leave Requests',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )
        },
        {
          view: 'analytics',
          label: 'Analytics',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          )
        },
        {
          view: 'reports',
          label: 'Reports',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          )
        },
        {
          view: 'employees',
          label: 'Employees',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          )
        },
        {
          view: 'settings',
          label: 'Settings',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )
        }
      );
    }

    // Common Profile Page
    items.push({
      view: 'profile',
      label: 'My Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    });

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <aside style={{
      width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      transition: 'width var(--transition-normal)'
    }}>
      {/* Brand Header Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            FlowSphere <span style={{ color: 'var(--primary-blue)' }}>AI</span>
          </span>
        )}
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {menuItems.map(item => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view as AppView)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: sidebarCollapsed ? '0' : '1rem',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--primary-blue)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{
                color: isActive ? 'var(--primary-blue)' : 'var(--text-light)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer User Card */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        gap: '0.75rem',
        backgroundColor: '#FCFDFF'
      }}>
        {!sidebarCollapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
              />
              <div style={{ minWidth: 0 }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </h5>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                color: 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
                borderRadius: '8px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
};
