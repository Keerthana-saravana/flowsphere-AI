import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    departments,
    employees,
    createNewDepartment,
    updateCompanySettings,
    addNotification
  } = useApp();

  // Company Profile State
  const [companyName, setCompanyName] = useState('FlowSphere AI');
  const [domain, setDomain] = useState('flowsphere.ai');
  const [companyEmail, setCompanyEmail] = useState('operations@flowsphere.ai');

  // New Department Form State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptManager, setDeptManager] = useState('');

  // Holiday Calendar state
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Load initial settings
  useEffect(() => {
    if (settings) {
      setHolidays(settings.holidayCalendar || []);
    }
  }, [settings]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification('Settings Saved', 'Corporate Tenant metadata profile updated successfully.', 'success');
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    await createNewDepartment(deptName, deptCode, deptManager || undefined);
    setDeptName('');
    setDeptCode('');
    setDeptManager('');
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;
    const updatedHolidays = [...holidays, { date: newHolidayDate, name: newHolidayName }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    await updateCompanySettings(updatedHolidays);
    setHolidays(updatedHolidays);
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const handleRemoveHoliday = async (idx: number) => {
    const updatedHolidays = holidays.filter((_, i) => i !== idx);
    await updateCompanySettings(updatedHolidays);
    setHolidays(updatedHolidays);
  };

  const systemRoles = [
    { name: 'Admin / CEO', desc: 'Full tenant operational read/write access, template designer, BI analytics audits.', permissions: ['Manage Workflows', 'Access BI Analytics', 'Edit Directory', 'Update Settings'] },
    { name: 'Manager', desc: 'Team direct reports supervisor review gate approval capabilities.', permissions: ['Review Team Leaves'] },
    { name: 'HR Director', desc: 'Final time-off holiday allocation approvals, ledger writes, and employee directory management.', permissions: ['Final HR Leaves Approval', 'Manage Directory Profile Details'] },
    { name: 'Employee', desc: 'Standard staff submission access, logs view, personal leave apply balance tracker.', permissions: ['Submit Leave Requests'] }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Company Settings</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Configure organizational properties, manage departments, and adjust holiday calendar schedules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: General Profile & Department Registration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Company Profile form */}
          <div className="fs-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>Company Profile</h4>
            <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Company Display Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Corporate Domain Name</label>
                  <input type="text" value={domain} onChange={e => setDomain(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Administrative Email Address</label>
                  <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                Save Profile
              </button>
            </form>
          </div>

          {/* Department Management */}
          <div className="fs-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Manage Departments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {departments.map(dept => {
                const mgrUser = employees.find(e => String(e.id) === String(dept.managerId));
                return (
                  <div key={dept.id} style={{
                    padding: '0.85rem 1.1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FAFDFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{dept.name} ({dept.code})</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Manager: {mgrUser ? mgrUser.name : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Department Form */}
            <form onSubmit={handleAddDept} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Add New Department</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Department Name</label>
                  <input type="text" placeholder="e.g. Sales" value={deptName} onChange={e => setDeptName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Code</label>
                  <input type="text" placeholder="SLS" value={deptCode} onChange={e => setDeptCode(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Department Manager</label>
                <select value={deptManager} onChange={e => setDeptManager(e.target.value)}>
                  <option value="">Select Manager</option>
                  {employees.filter(e => e.role.toLowerCase().includes('manager') || e.role.toLowerCase().includes('hr')).map(mgr => (
                    <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', alignSelf: 'flex-end' }}>
                Register Department
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Holiday Calendar & System Roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Holiday Calendar Management */}
          <div className="fs-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Holiday Calendar</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {holidays.map((h, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  backgroundColor: '#FCFDFF'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{h.name}</span>
                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-light)' }}>({h.date})</span>
                  </div>
                  <button onClick={() => handleRemoveHoliday(idx)} style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 500 }}>
                    Remove
                  </button>
                </div>
              ))}
              {holidays.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                  No holidays registered.
                </div>
              )}
            </div>

            {/* Add Holiday Form */}
            <form onSubmit={handleAddHoliday} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Holiday Name</label>
                <input type="text" placeholder="e.g. Independence Day" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                  Add Holiday
                </button>
              </div>
            </form>
          </div>

          {/* System Roles Map */}
          <div className="fs-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>System Roles & Security Permissions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {systemRoles.map(r => (
                <div key={r.name} style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{r.name}</h5>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{r.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {r.permissions.map(p => (
                      <span key={p} style={{
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--primary-blue)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #BFDBFE'
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
