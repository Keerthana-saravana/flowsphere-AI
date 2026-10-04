import React, { useState } from 'react';
import { useApp, type Employee } from '../context/AppContext';

export const EmployeeDirectoryView: React.FC = () => {
  const { 
    employees, 
    activeFilters, 
    setActiveFilters, 
    currentRole, 
    departments,
    addEmployee,
    editEmployee,
    deactivateEmployee
  } = useApp();

  const [searchVal, setSearchVal] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Administrative Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deactivatingEmp, setDeactivatingEmp] = useState<Employee | null>(null);

  // Form States
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formRole, setFormRole] = useState<'employee' | 'manager' | 'hr' | 'admin'>('employee');
  const [formDeptId, setFormDeptId] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  // Open modals helpers
  const openAddModal = () => {
    setFormFullName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormDesignation('');
    setFormRole('employee');
    setFormDeptId(departments.length > 0 ? String(departments[0].id) : '');
    setFormAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    // Find department ID matching name
    const dept = departments.find(d => d.name === emp.department);
    setFormFullName(emp.name);
    setFormUsername(emp.email.split('@')[0]); // Fallback or email username
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormPassword(''); // blank to keep current
    setFormDesignation(emp.role);
    setFormRole(
      emp.role.toLowerCase().includes('admin') ? 'admin' :
      emp.role.toLowerCase().includes('manager') ? 'manager' :
      emp.role.toLowerCase().includes('hr') ? 'hr' : 'employee'
    );
    setFormDeptId(dept ? String(dept.id) : (departments.length > 0 ? String(departments[0].id) : ''));
    setFormAvatar(emp.avatar);
    setEditingEmp(emp);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formEmail || !formPassword) {
      alert("Please fill in required fields.");
      return;
    }
    const cleanUsername = formUsername || formEmail.split('@')[0];
    const success = await addEmployee({
      full_name: formFullName,
      username: cleanUsername,
      email: formEmail,
      phone: formPhone || undefined,
      password: formPassword,
      department_id: formDeptId ? Number(formDeptId) : undefined,
      designation: formDesignation || formRole.toUpperCase(),
      role: formRole,
      avatar: formAvatar
    });
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    if (!formFullName || !formEmail) {
      alert("Please fill in required fields.");
      return;
    }
    const cleanUsername = formUsername || formEmail.split('@')[0];
    const success = await editEmployee(editingEmp.id, {
      full_name: formFullName,
      username: cleanUsername,
      email: formEmail,
      phone: formPhone || undefined,
      password: formPassword || undefined, // only update password if typed
      department_id: formDeptId ? Number(formDeptId) : undefined,
      designation: formDesignation || formRole.toUpperCase(),
      role: formRole,
      avatar: formAvatar
    });
    if (success) {
      setEditingEmp(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingEmp) return;
    const success = await deactivateEmployee(deactivatingEmp.id);
    if (success) {
      setDeactivatingEmp(null);
    }
  };

  // Handle filtering
  const getFilteredEmployees = () => {
    if (activeFilters.customEmployees) {
      return activeFilters.customEmployees as Employee[];
    }

    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchVal.toLowerCase()) ||
                            emp.role.toLowerCase().includes(searchVal.toLowerCase()) ||
                            emp.email.toLowerCase().includes(searchVal.toLowerCase());
      
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  };

  const filteredList = getFilteredEmployees();

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return 'None (Leadership)';
    const m = employees.find(e => e.id === managerId);
    return m ? m.name : 'Unknown Manager';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Employee Directory</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Browse company hierarchy, inspect time-off balances, and manage workforce operational profiles.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-blue)', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
            Total Staff: {employees.length}
          </span>
          {currentRole === 'admin' && (
            <button 
              onClick={openAddModal}
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filter Row Bar */}
      <div className="fs-card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {activeFilters.customEmployees ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 600 }}>Showing AI Search query matches:</span>
            <button
              onClick={() => setActiveFilters({})}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              Reset AI Search filter
            </button>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search staff, designation, email..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '53%', transform: 'translateY(-50%)', color: 'var(--text-light)', display: 'flex' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
            </div>

            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dept:</span>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Directory Grid table */}
      <div className="fs-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FCFF', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Employee</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Designation (Role)</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Department</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Time-Off Balance</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #F0F7FF', transition: 'background 0.15s' }}>
                <td style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</h5>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.email}</span>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  {emp.role}
                </td>
                <td style={{ padding: '0.85rem 1.5rem', color: 'var(--text-muted)' }}>{emp.department}</td>
                <td style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--primary-blue)' }}>{emp.leaveBalance} Days</td>
                <td style={{ padding: '0.85rem 1.5rem' }}>
                  <span className={`badge badge-${
                    emp.status === 'Active' ? 'approved' : emp.status === 'On Leave' ? 'pending' : 'rejected'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setSelectedEmp(emp)}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      View
                    </button>
                    {currentRole === 'admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderRadius: '8px' }}
                        >
                          Edit
                        </button>
                        {emp.status !== 'Suspended' ? (
                          <button
                            onClick={() => setDeactivatingEmp(emp)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderRadius: '8px', color: 'var(--danger)', borderColor: '#FEE2E2' }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', padding: '0.35rem 0.65rem', fontStyle: 'italic' }}>
                            Suspended
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredList.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
            No directory profiles matched search filters.
          </div>
        )}
      </div>

      {/* Selected Employee profile details modal */}
      {selectedEmp && (
        <div className="modal-overlay" onClick={() => setSelectedEmp(null)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
              <img
                src={selectedEmp.avatar}
                alt={selectedEmp.name}
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-blue)', boxShadow: 'var(--shadow-sm)' }}
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{selectedEmp.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 500, marginTop: '0.1rem' }}>{selectedEmp.role}</p>
                <span className={`badge badge-${
                  selectedEmp.status === 'Active' ? 'approved' : selectedEmp.status === 'On Leave' ? 'pending' : 'rejected'
                }`} style={{ marginTop: '0.5rem' }}>
                  {selectedEmp.status}
                </span>
              </div>
            </div>

            <div style={{
              margin: '1.5rem 0 2rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Employee ID</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Department</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Work Email</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Phone Contact</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Supervisor Manager</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{getManagerName(selectedEmp.managerId)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Earned Leave (Annual)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.earnedLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Medical Leave (Sick)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.medicalLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Casual Leave (Personal)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedEmp.casualLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Loss of Pay (Unpaid)</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{selectedEmp.lossOfPay} Days</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEmp(null)} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', width: '100%', borderRadius: 'var(--radius-md)' }}>
                Dismiss Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Employee Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>Add New Employee</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Name</label>
                <input type="text" value={formFullName} onChange={e => setFormFullName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={formUsername} onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g,''))} placeholder="janedoe" />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={formDesignation} onChange={e => setFormDesignation(e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@company.com" required />
              </div>
              <div className="form-group">
                <label>Phone Contact</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1 (555) 012-3456" />
              </div>
              <div className="form-group">
                <label>Assign Department</label>
                <select value={formDeptId} onChange={e => setFormDeptId(e.target.value)} required>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {departments.length === 0 && (
                    <option value="">No departments available</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Assign System Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as any)}>
                  <option value="employee">Employee (Regular staff)</option>
                  <option value="manager">Manager (Dept supervisor)</option>
                  <option value="hr">HR (Leaves finalized audit)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Password at least 6 characters" required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Profile Picture URL</label>
                <input type="text" value={formAvatar} onChange={e => setFormAvatar(e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit Employee Modal */}
      {editingEmp && (
        <div className="modal-overlay" onClick={() => setEditingEmp(null)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>Edit Employee Profile</h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Name</label>
                <input type="text" value={formFullName} onChange={e => setFormFullName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={formUsername} onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g,''))} placeholder="janedoe" />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={formDesignation} onChange={e => setFormDesignation(e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@company.com" required />
              </div>
              <div className="form-group">
                <label>Phone Contact</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1 (555) 012-3456" />
              </div>
              <div className="form-group">
                <label>Assign Department</label>
                <select value={formDeptId} onChange={e => setFormDeptId(e.target.value)} required>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assign System Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as any)}>
                  <option value="employee">Employee (Regular staff)</option>
                  <option value="manager">Manager (Dept supervisor)</option>
                  <option value="hr">HR (Leaves finalized audit)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Change Password (leave blank to keep current)</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Password (Optional)" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Profile Picture URL</label>
                <input type="text" value={formAvatar} onChange={e => setFormAvatar(e.target.value)} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setEditingEmp(null)} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Confirm Deactivate Modal */}
      {deactivatingEmp && (
        <div className="modal-overlay" onClick={() => setDeactivatingEmp(null)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Confirm Operational Deactivation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to deactivate the employee profile for <strong>{deactivatingEmp.name}</strong>?
              This will suspend their workspace login access immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeactivatingEmp(null)} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button onClick={handleDeactivate} className="btn btn-danger" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                Deactivate Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
