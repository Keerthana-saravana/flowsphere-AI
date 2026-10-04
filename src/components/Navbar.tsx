import React, { useState } from 'react';
import { useApp, type AppView } from '../context/AppContext';
import { AIService } from '../services/aiService';

export const Navbar: React.FC = () => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    currentRole,
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    clearNotifications,
    setCurrentView,
    setActiveFilters,
    employees,
    departments,
    leaves,
    resetDatabase,
    addEmployee
  } = useApp();

  const [searchVal, setSearchVal] = useState('');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [aiResultModal, setAiResultModal] = useState<{ isOpen: boolean; message: string; title: string } | null>(null);

  // Employee Registration Modal State
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empRole, setEmpRole] = useState<'employee' | 'manager' | 'hr' | 'admin'>('employee');
  const [empPassword, setEmpPassword] = useState('123456');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;

    const result = AIService.parseSearch(searchVal, employees, leaves);
    
    // Process search parsing
    if (result.type === 'navigation' && result.view) {
      setCurrentView(result.view as AppView);
    } else if (result.type === 'filter' && result.view) {
      setCurrentView(result.view as AppView);
      setActiveFilters(result.filter || {});
    } else if (result.type === 'data' && result.view) {
      setCurrentView(result.view as AppView);
      if (result.view === 'employees') {
        // Set search filter for employees
        setActiveFilters({ customEmployees: result.data });
      }
    }

    setAiResultModal({
      isOpen: true,
      title: 'FlowSphere AI Search Assistant',
      message: result.message
    });
    setSearchVal('');
  };

  const handleNotifClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      markNotificationsAsRead();
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName || !empUsername || !empEmail) {
      alert("Please fill in required employee details.");
      return;
    }
    const success = await addEmployee({
      full_name: empFullName,
      username: empUsername,
      email: empEmail,
      phone: empPhone,
      password: empPassword || "123456",
      department_id: empDeptId ? Number(empDeptId) : undefined,
      designation: empDesignation || "Associate",
      role: empRole
    });

    if (success) {
      setShowEmpModal(false);
      setEmpFullName('');
      setEmpUsername('');
      setEmpEmail('');
      setEmpPhone('');
      setEmpDesignation('');
    }
  };

  return (
    <>
      <header style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 90
      }}>
        {/* Left Side: Sidebar Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              {currentRole} Role
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '420px', margin: '0 1.5rem', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder='AI Search (e.g., "pending approvals", "employees on leave")'
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)'
            }}
          />
          <button type="submit" style={{ display: 'none' }} />
        </form>

        {/* Right Side: Employee Registration Button, Reset DB, Notifications, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Top Right Employee Registration Button */}
          <button
            onClick={() => setShowEmpModal(true)}
            className="btn btn-primary animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="16" y1="11" x2="22" y2="11" />
            </svg>
            Employee Registration
          </button>

          {/* Developer Reset DB Button */}
          <button
            onClick={() => { if (window.confirm('Reset local workspace database and load sample mock datasets?')) resetDatabase(); }}
            title="Restore Defaults"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              padding: '0.45rem 0.75rem',
              border: '1px solid #FED7D7',
              backgroundColor: '#FFF5F5',
              color: '#C53030',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Reset DB
          </button>

          {/* Notifications Center */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleNotifClick}
              style={{
                padding: '0.6rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotificationsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px white'
                }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown menu */}
            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '320px',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'scaleUp 0.15s ease-out'
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notifications</h4>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 500 }}>Clear all</button>
                  )}
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', color: 'var(--text-light)', fontSize: '0.8rem', textAlign: 'center' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid #F0F7FF',
                        display: 'flex',
                        gap: '0.75rem',
                        backgroundColor: n.read ? '#FFFFFF' : '#F9FCFF',
                        transition: 'background 0.2s'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: n.type === 'success' ? 'var(--success)' : n.type === 'warning' ? 'var(--warning)' : n.type === 'danger' ? 'var(--danger)' : 'var(--primary-blue)',
                          marginTop: '5px',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{n.title}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.4' }}>{n.message}</p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', display: 'block', marginTop: '0.25rem' }}>{n.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Quick Display */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {currentUser.role} ({currentUser.department})
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Employee Registration Modal */}
      {showEmpModal && (
        <div className="modal-overlay" onClick={() => setShowEmpModal(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Employee Registration</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Register a new employee profile to your company workspace.</p>
              </div>
              <button onClick={() => setShowEmpModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={empFullName} onChange={e => setEmpFullName(e.target.value)} placeholder="e.g. Alex Morgan" required />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input type="text" value={empUsername} onChange={e => setEmpUsername(e.target.value.toLowerCase())} placeholder="alex.morgan" required />
              </div>
              <div className="form-group">
                <label>Work Email *</label>
                <input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="alex@company.com" required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={empPhone} onChange={e => setEmpPhone(e.target.value)} placeholder="+1 555-0192" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={empDeptId} onChange={e => setEmpDeptId(e.target.value)}>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={empDesignation} onChange={e => setEmpDesignation(e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={empRole} onChange={e => setEmpRole(e.target.value as any)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Company Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} placeholder="123456" />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEmpModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.8rem' }}>Register Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Search Overlay Result Modal */}
      {aiResultModal?.isOpen && (
        <div className="modal-overlay" onClick={() => setAiResultModal(null)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{aiResultModal.title}</h3>
            </div>
            
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-main)',
              lineHeight: '1.6',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem'
            }}>
              {aiResultModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAiResultModal(null)} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
