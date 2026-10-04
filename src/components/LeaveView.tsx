import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { LeaveRequest } from '../context/AppContext';

export const LeaveView: React.FC = () => {
  const {
    currentRole,
    currentUser,
    leaves,
    createNewLeave,
    approveLeaveRequest,
    rejectLeaveRequest,
    activeFilters,
    setActiveFilters
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<'apply' | 'pending' | 'history'>('apply');

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  // Approval Dialogue Modal State
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; req: LeaveRequest; action: 'Approve' | 'Reject' } | null>(null);
  const [commentVal, setCommentVal] = useState('');

  if (!currentUser) return null;

  // Submit Leave request handler
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      alert('Please fill out all fields.');
      return;
    }

    // Compute duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const duration = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    if (duration <= 0) {
      alert('End date must be after or equal to start date.');
      return;
    }

    await createNewLeave({
      leaveType,
      startDate,
      endDate,
      durationDays: duration,
      reason,
      attachmentName: attachment || undefined
    });

    // Reset Form
    setStartDate('');
    setEndDate('');
    setReason('');
    setAttachment(null);
    setActiveTab('history');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachment(e.dataTransfer.files[0].name);
    }
  };

  // Filter queues
  // Manager: sees 'Pending' leaves of employees they manage in their department
  // HR: sees 'Manager Approved' leaves (awaiting final signoff) or pending leaves
  const getPendingQueue = () => {
    if (currentRole === 'hr') {
      return leaves.filter(r => r.status === 'Manager Approved');
    }
    if (currentRole === 'manager') {
      // Scoped to manager's department and status is Pending
      return leaves.filter(r => r.status === 'Pending' && r.department === currentUser.department);
    }
    return [];
  };

  const getHistoryQueue = () => {
    // If navbar AI search injected activeFilters, override!
    if (activeFilters.status) {
      return leaves.filter(r => r.status === activeFilters.status);
    }

    if (currentRole === 'employee') {
      return leaves.filter(r => r.employeeId === currentUser.id);
    }
    // Admin/Manager/HR see everything in their scopes
    if (currentRole === 'manager') {
      return leaves.filter(r => r.department === currentUser.department);
    }
    return leaves;
  };

  const executeApprovalAction = async () => {
    if (!approvalModal) return;
    const { req, action } = approvalModal;

    if (action === 'Approve') {
      await approveLeaveRequest(req.id, commentVal);
    } else {
      await rejectLeaveRequest(req.id, commentVal);
    }

    setApprovalModal(null);
    setCommentVal('');
  };

  const pendingList = getPendingQueue();
  const historyList = getHistoryQueue();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Leave & Time-Off Management</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>File requests, approve absences, and monitor automated holiday allocations.</p>
      </div>

      {/* Tabs Row Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '2rem'
      }}>
        {currentRole === 'employee' && (
          <button
            onClick={() => { setActiveTab('apply'); setActiveFilters({}); }}
            style={{
              paddingBottom: '0.75rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'apply' ? 'var(--primary-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === 'apply' ? '2px solid var(--primary-blue)' : '2px solid transparent'
            }}
          >
            Apply for Leave
          </button>
        )}
        {(currentRole === 'manager' || currentRole === 'hr') && (
          <button
            onClick={() => { setActiveTab('pending'); setActiveFilters({}); }}
            style={{
              paddingBottom: '0.75rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'pending' ? 'var(--primary-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === 'pending' ? '2px solid var(--primary-blue)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Pending Queue
            {pendingList.length > 0 && (
              <span style={{
                backgroundColor: 'var(--primary-blue)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: '10px'
              }}>
                {pendingList.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => { setActiveTab('history'); }}
          style={{
            paddingBottom: '0.75rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: activeTab === 'history' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary-blue)' : '2px solid transparent'
          }}
        >
          {currentRole === 'employee' ? 'My Leave History' : 'All Leave Audit Ledger'}
        </button>
      </div>

      {/* 1. APPLY LEAVE TAB */}
      {activeTab === 'apply' && currentRole === 'employee' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left profile card with breakdown of leave balances */}
          <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Your Leave Account</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
              />
              <div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{currentUser.name}</h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.role}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Casual Leave</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.casualLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Medical Leave</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.medicalLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Earned Leave</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.earnedLeave} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loss of Pay</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{currentUser.lossOfPay} Days</span>
              </div>
            </div>

            <div style={{
              marginTop: '0.5rem',
              padding: '0.9rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Remaining Balance
              </span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '0.15rem' }}>
                {currentUser.leaveBalance} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
              </h2>
            </div>
          </div>

          {/* Right Apply Form */}
          <div className="fs-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>File Leave Application</h4>
            <form onSubmit={handleApplySubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Leave Classification Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)}>
                  <option value="Annual">Annual Paid Leave (Deducts Earned)</option>
                  <option value="Sick">Medical Sick Leave (Deducts Medical)</option>
                  <option value="Personal">Personal Unplanned Leave (Deducts Casual)</option>
                  <option value="Maternity/Paternity">Maternity / Paternity Parent Leave (Deducts Casual)</option>
                  <option value="Unpaid">Unpaid Personal Leave (Loss Of Pay)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Reason / Absence Justification</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe your coverage plans and necessity for leave..."
                  rows={4}
                  required
                />
              </div>

              {/* Drag and Drop Upload */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Attachments (Optional)</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    backgroundColor: '#F9FCFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    const name = prompt('Simulate uploading file by typing filename (e.g. medical_certificate.pdf):');
                    if (name) setAttachment(name);
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5 5 5m-5-5v12" />
                  </svg>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {attachment ? `Selected attachment: ${attachment}` : 'Click here or drag-and-drop support files (PDF, JPG)'}
                  </p>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PENDING APPROVALS QUEUE */}
      {activeTab === 'pending' && (currentRole === 'manager' || currentRole === 'hr') && (
        <div className="fs-card" style={{ padding: 0, overflow: 'hidden' }}>
          {pendingList.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-light)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h3>Queue Cleared!</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>All pending leave requests have been processed successfully.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FCFF', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Classification</th>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Absence Reason</th>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Attachments</th>
                  <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F0F7FF', transition: 'background 0.15s' }}>
                    <td style={{ padding: '1.1rem 1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div>{req.employeeName}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 }}>{req.department}</span>
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-main)' }}>
                      <span className="badge badge-info">{req.leaveType}</span>
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{req.durationDays} Day(s)</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{req.startDate} to {req.endDate}</span>
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.reason}
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem' }}>
                      {req.attachmentName ? (
                        <a href="#attachment" onClick={e => e.preventDefault()} style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          {req.attachmentName}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setApprovalModal({ isOpen: true, req, action: 'Approve' })}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: '8px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setApprovalModal({ isOpen: true, req, action: 'Reject' })}
                          className="btn btn-outline"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: '8px', color: 'var(--danger)', borderColor: '#FEE2E2' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 3. REQUEST HISTORY TAB */}
      {(activeTab === 'history' || (currentRole !== 'employee' && activeTab === 'apply')) && (
        <div className="fs-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FCFF', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Employee</th>
                <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Classification</th>
                <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Absence Period</th>
                <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>Status Badge</th>
                <th style={{ padding: '1.1rem 1.5rem', fontWeight: 600 }}>History Notes</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #F0F7FF' }}>
                  <td style={{ padding: '1.1rem 1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <div>{req.employeeName}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 }}>{req.department}</span>
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-main)' }}>
                    <span className="badge badge-info">{req.leaveType}</span>
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{req.durationDays} Day(s)</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{req.startDate} to {req.endDate}</span>
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    <span className={`badge badge-${
                      req.status === 'Approved' ? 'approved' : req.status === 'Rejected' ? 'rejected' : 'pending'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '300px' }}>
                    {req.status === 'Rejected' && (
                      <span style={{ color: 'var(--danger)' }}>
                        <strong>Rejected: </strong> {req.hrComment || req.managerComment || 'No comments.'}
                      </span>
                    )}
                    {req.status === 'Approved' && (
                      <span style={{ color: 'var(--success)' }}>
                        <strong>HR Approved: </strong> {req.hrComment || 'Records processed.'}
                      </span>
                    )}
                    {req.status === 'Manager Approved' && (
                      <span style={{ color: 'var(--primary-blue)' }}>
                        <strong>Mgr Approved: </strong> {req.managerComment || 'Forwarded to HR.'}
                      </span>
                    )}
                    {req.status === 'Pending' && (
                      <span>Awaiting direct manager review timeline.</span>
                    )}
                  </td>
                </tr>
              ))}
              {historyList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    No time-off requests logged in system history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Comment Dialogue Modal for Approve/Reject Actions */}
      {approvalModal?.isOpen && (
        <div className="modal-overlay" onClick={() => setApprovalModal(null)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Confirm Leave {approvalModal.action === 'Approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Are you sure you want to <strong>{approvalModal.action.toLowerCase()}</strong> the leave application submitted by <strong>{approvalModal.req.employeeName}</strong>?
            </p>

            <div className="form-group">
              <label>Review Notes & Comments</label>
              <textarea
                value={commentVal}
                onChange={e => setCommentVal(e.target.value)}
                placeholder="Type audit notes or reasons for rejection here..."
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setApprovalModal(null)} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button
                onClick={executeApprovalAction}
                className={approvalModal.action === 'Approve' ? 'btn btn-primary' : 'btn btn-danger'}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
              >
                Confirm {approvalModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
