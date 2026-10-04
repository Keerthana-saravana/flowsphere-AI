import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SVGAreaChart, SVGBarChart, SVGDonutChart } from './SVGCharts';

export const DashboardView: React.FC = () => {
  const {
    leaves,
    employees,
    departments,
    currentRole,
    currentUser,
    logs,
    currentCompanyId,
    createNewLeave
  } = useApp();

  // Admin Custom States
  const [adminTrendPeriod, setAdminTrendPeriod] = useState<'weekly' | 'monthly' | 'yearly' | 'approval'>('monthly');
  const [adminDeptMode, setAdminDeptMode] = useState<'count' | 'percentage'>('count');
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  // Employee Quick Leave Apply State
  const [applyLeaveType, setApplyLeaveType] = useState<'Annual' | 'Sick' | 'Personal' | 'Maternity/Paternity' | 'Unpaid'>('Annual');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');
  const [applyReason, setApplyReason] = useState('');

  const handleEmployeeLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyStartDate || !applyEndDate || !applyReason) {
      alert("Please fill in start date, end date, and reason.");
      return;
    }
    await createNewLeave({
      leaveType: applyLeaveType,
      startDate: applyStartDate,
      endDate: applyEndDate,
      durationDays: 1,
      reason: applyReason
    });
    setApplyReason('');
    setApplyStartDate('');
    setApplyEndDate('');
  };

  // Fetch company details for logo
  useEffect(() => {
    if (currentCompanyId) {
      fetch(`http://127.0.0.1:8000/api/public/companies`)
        .then(r => r.json())
        .then(data => {
          const comp = data.find((c: any) => c.id === currentCompanyId);
          if (comp && comp.logo_url) {
            setCompanyLogoUrl(comp.logo_url);
          }
        })
        .catch(err => console.error("Failed to fetch company logo:", err));
    }
  }, [currentCompanyId]);

  if (!currentUser) return null;

  // Filter scoped data based on role for KPI computations
  const getRoleLeaves = () => {
    if (currentRole === 'employee') {
      return leaves.filter(l => l.employeeId === currentUser.id);
    }
    if (currentRole === 'manager') {
      // Scoped to manager's department
      return leaves.filter(l => l.department === currentUser.department);
    }
    return leaves; // HR / Admin see all
  };

  const roleLeaves = getRoleLeaves();

  // Scoped metrics for employee/manager dashboard views
  const pendingLeaves = roleLeaves.filter(l => l.status === 'Pending' || l.status === 'Manager Approved').length;
  const approvedLeavesScoped = roleLeaves.filter(l => l.status === 'Approved').length;
  const rejectedLeavesScoped = roleLeaves.filter(l => l.status === 'Rejected').length;

  // Today approved (HR/Admin stats)
  const approvedToday = leaves.filter(l => {
    if (l.status !== 'Approved') return false;
    return l.startDate === new Date().toISOString().split('T')[0];
  }).length;

  // Department wise leaves count for Manager / HR Bar Chart
  const deptChartData = departments.map(d => {
    const count = leaves.filter(l => l.department === d.name).length;
    return {
      label: d.name.replace('Human Resources', 'HR'),
      value: count,
      color: d.name === 'Engineering' ? 'var(--primary-blue)' :
             d.name === 'Marketing' ? 'var(--accent-blue)' :
             d.name === 'Human Resources' ? '#8B5CF6' :
             d.name === 'Finance' ? 'var(--success)' : '#F59E0B'
    };
  });

  // Monthly trend for Area Chart (Leaves request count per month)
  const months = ['May', 'Jun', 'Jul', 'Aug'];
  const monthlyCounts = months.map(m => {
    const count = roleLeaves.filter(l => {
      const monthMap: Record<string, string> = { 'May': '-05-', 'Jun': '-06-', 'Jul': '-07-', 'Aug': '-08-' };
      return l.startDate.includes(monthMap[m]);
    }).length;
    return { label: m, value: count };
  });

  // Leave Type distribution for Donut Chart
  const leaveTypesCounts = { Annual: 0, Sick: 0, Personal: 0, 'Maternity/Paternity': 0, Unpaid: 0 };
  roleLeaves.forEach(l => {
    if (l.leaveType in leaveTypesCounts) {
      leaveTypesCounts[l.leaveType as keyof typeof leaveTypesCounts]++;
    }
  });

  // ==========================================
  // ADMIN DASHBOARD SPECIFIC COMPUTATIONS
  // ==========================================

  // 1-4. User breakdowns
  const totalEmployees = employees.length;
  const totalManagers = employees.filter(e => e.role.toLowerCase() === 'manager').length;
  const totalHR = employees.filter(e => e.role.toLowerCase() === 'hr').length;
  const totalRegularEmployees = employees.filter(e => e.role.toLowerCase() === 'employee').length;

  // 5. Departments count
  const totalDepartments = departments.length;

  // 6-9. Leaves count
  const totalLeaveRequests = leaves.length;
  const pendingApprovals = leaves.filter(l => l.status === 'Pending' || l.status === 'Manager Approved').length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;

  // 10. Approval Rate %
  const totalResolved = approvedLeaves + rejectedLeaves;
  const leaveApprovalRateStr = totalResolved > 0 
    ? `${Math.round((approvedLeaves / totalResolved) * 100)}%` 
    : "No Data Available";

  // 11. Average Approval Time
  const approvedList = leaves.filter(l => l.status === 'Approved' && l.history);
  let avgApprovalTimeStr = "No Data Available";
  if (approvedList.length > 0) {
    let totalHrs = 0;
    let cnt = 0;
    approvedList.forEach(l => {
      const sub = l.history.find((h: any) => h.stage === 'Submission');
      const hr = l.history.find((h: any) => h.stage === 'HR Review' || h.stage === 'Finalized');
      if (sub && hr) {
        const t1 = new Date(sub.timestamp.replace(' ', 'T')).getTime();
        const t2 = new Date(hr.timestamp.replace(' ', 'T')).getTime();
        if (!isNaN(t1) && !isNaN(t2)) {
          totalHrs += (t2 - t1) / (1000 * 3600);
          cnt++;
        }
      }
    });
    if (cnt > 0) {
      avgApprovalTimeStr = `${(totalHrs / cnt).toFixed(1)} hrs`;
    }
  }

  // 12. Department with Highest Leave
  const deptLeaveCounts: Record<string, number> = {};
  leaves.filter(l => l.status === 'Approved').forEach(l => {
    deptLeaveCounts[l.department] = (deptLeaveCounts[l.department] || 0) + l.durationDays;
  });
  const highestDeptEntry = Object.entries(deptLeaveCounts).sort((a, b) => b[1] - a[1])[0];
  const highestDeptStr = highestDeptEntry ? `${highestDeptEntry[0]} (${highestDeptEntry[1]} Days)` : "No Data Available";

  // 13. Department with Lowest Leave
  const lowestDeptEntries = departments.map(d => {
    const days = leaves.filter(l => l.status === 'Approved' && l.department === d.name).reduce((acc, l) => acc + l.durationDays, 0);
    return [d.name, days] as [string, number];
  }).sort((a, b) => a[1] - b[1]);
  const lowestDeptStr = lowestDeptEntries.length > 0 ? `${lowestDeptEntries[0][0]} (${lowestDeptEntries[0][1]} Days)` : "No Data Available";

  // 14. Company Leave Utilization %
  const totalApprovedLeaveDays = leaves.filter(l => l.status === 'Approved').reduce((acc, l) => acc + l.durationDays, 0);
  const totalAllowedLeaveDays = employees.length * 49; // 15 Annual + 10 Sick + 12 Personal + 12 Parental = 49
  const leaveUtilizationStr = totalAllowedLeaveDays > 0 
    ? `${Math.round((totalApprovedLeaveDays / totalAllowedLeaveDays) * 100)}%` 
    : "0%";

  // Top Leave Type
  const topTypeCounts: Record<string, number> = {};
  leaves.forEach(l => {
    topTypeCounts[l.leaveType] = (topTypeCounts[l.leaveType] || 0) + 1;
  });
  const topTypeEntry = Object.entries(topTypeCounts).sort((a, b) => b[1] - a[1])[0];
  const topLeaveTypeStr = topTypeEntry ? `${topTypeEntry[0]} (${topTypeEntry[1]} Requests)` : "No Data Available";

  // Employees On Leave Today
  const employeesOnLeaveToday = employees.filter(e => e.status === 'On Leave');

  // Dynamic Trend computations for Admin dashboard
  const getAdminTrendData = () => {
    const today = new Date();
    if (adminTrendPeriod === 'weekly') {
      const trend: { label: string; value: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const startOfWeek = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        const label = `Wk -${i}`;
        const count = leaves.filter(l => {
          const date = new Date(l.startDate);
          return date >= startOfWeek && date <= endOfWeek;
        }).length;
        trend.push({ label, value: count });
      }
      return trend;
    } else if (adminTrendPeriod === 'yearly') {
      const trend: { label: string; value: number }[] = [];
      for (let i = 2; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const label = String(year);
        const count = leaves.filter(l => {
          const date = new Date(l.startDate);
          return date.getFullYear() === year;
        }).length;
        trend.push({ label, value: count });
      }
      return trend;
    } else if (adminTrendPeriod === 'approval') {
      // Approved leaves trend
      const trend: { label: string; value: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mLabel = d.toLocaleString('default', { month: 'short' });
        const mNum = d.getMonth();
        const mYear = d.getFullYear();
        const count = leaves.filter(l => {
          const date = new Date(l.startDate);
          return l.status === 'Approved' && date.getMonth() === mNum && date.getFullYear() === mYear;
        }).length;
        trend.push({ label: mLabel, value: count });
      }
      return trend;
    } else {
      // Monthly trend
      const trend: { label: string; value: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mLabel = d.toLocaleString('default', { month: 'short' });
        const mNum = d.getMonth();
        const mYear = d.getFullYear();
        const count = leaves.filter(l => {
          const date = new Date(l.startDate);
          return date.getMonth() === mNum && date.getFullYear() === mYear;
        }).length;
        trend.push({ label: mLabel, value: count });
      }
      return trend;
    }
  };

  // Dynamic department volumes for Admin
  const getAdminDeptData = () => {
    if (adminDeptMode === 'percentage') {
      const totalLeaves = leaves.length || 1;
      return departments.map(d => {
        const count = leaves.filter(l => l.department === d.name).length;
        return {
          label: d.name.replace('Human Resources', 'HR'),
          value: Math.round((count / totalLeaves) * 100),
          color: d.name === 'Engineering' ? 'var(--primary-blue)' :
                 d.name === 'Marketing' ? 'var(--accent-blue)' :
                 d.name === 'Human Resources' ? '#8B5CF6' :
                 d.name === 'Finance' ? 'var(--success)' : '#F59E0B'
        };
      });
    } else {
      return departments.map(d => {
        const count = leaves.filter(l => l.department === d.name).length;
        return {
          label: d.name.replace('Human Resources', 'HR'),
          value: count,
          color: d.name === 'Engineering' ? 'var(--primary-blue)' :
                 d.name === 'Marketing' ? 'var(--accent-blue)' :
                 d.name === 'Human Resources' ? '#8B5CF6' :
                 d.name === 'Finance' ? 'var(--success)' : '#F59E0B'
        };
      });
    }
  };

  const adminTrendData = getAdminTrendData();
  const adminDeptData = getAdminDeptData();

  // Helper to render empty state for charts
  const renderEmptyState = (_title: string) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-light)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>No Data Available</span>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Absence metrics and logs will populate once leave applications are filed.</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0.5rem 0 2rem' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {companyLogoUrl ? (
            <img 
              src={companyLogoUrl} 
              alt="Company Logo" 
              style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
            />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem' }}>
              {(currentUser.companyName || 'F').charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              Welcome, {currentUser.name}
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-blue))',
                padding: '0.35rem 0.95rem',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {currentUser.companyName || ''}
              </span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Corporate Workspace Admin Portal
            </p>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-blue)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. ADMIN DASHBOARD VIEW */}
      {/* ========================================== */}
      {currentRole === 'admin' && (
        <>
          {/* 14 KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            
            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Employees</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalEmployees}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Managers</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalManagers}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HR Admins</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalHR}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employees</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalRegularEmployees}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#E2E8F0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Departments</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalDepartments}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FFF2E6', color: '#D35400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Leave Req.</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalLeaveRequests}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{pendingApprovals}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Leaves</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{approvedLeaves}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rejected Leaves</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{rejectedLeaves}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approval Rate</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{leaveApprovalRateStr}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Approval Time</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{avgApprovalTimeStr}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Highest Leave Dept</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{highestDeptStr}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FFF5F5', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lowest Leave Dept</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{lowestDeptStr}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leave Utilization</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>{leaveUtilizationStr}</h3>
              </div>
            </div>

          </div>

          {/* Admin Graphical Analytics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
            
            {/* Area Chart trend with picker */}
            <div className="fs-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Dynamic Leave Trends ({adminTrendPeriod.toUpperCase()})
                </h4>
                <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px' }}>
                  {(['weekly', 'monthly', 'yearly', 'approval'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setAdminTrendPeriod(p)}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        color: adminTrendPeriod === p ? 'var(--primary-blue)' : 'var(--text-muted)',
                        backgroundColor: adminTrendPeriod === p ? '#FFFFFF' : 'transparent',
                        boxShadow: adminTrendPeriod === p ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {leaves.length === 0 ? renderEmptyState("Dynamic Trends") : (
                  <SVGAreaChart data={adminTrendData} height={250} />
                )}
              </div>
            </div>

            {/* Department Wise charts */}
            <div className="fs-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Department Breakdown
                </h4>
                <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px' }}>
                  {(['count', 'percentage'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setAdminDeptMode(m)}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        color: adminDeptMode === m ? 'var(--primary-blue)' : 'var(--text-muted)',
                        backgroundColor: adminDeptMode === m ? '#FFFFFF' : 'transparent',
                        boxShadow: adminDeptMode === m ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      {m === 'count' ? 'Leave Count' : 'Percentage %'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {leaves.length === 0 ? renderEmptyState("Department Breakdown") : (
                  adminDeptMode === 'count' ? (
                    <SVGBarChart data={adminDeptData} height={250} />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <SVGDonutChart data={adminDeptData} />
                    </div>
                  )
                )}
              </div>
            </div>

          </div>

          {/* Bottom Row: Additional charts, Top metrics, and active employees on leave */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Approval vs Rejection & Most Active / Top metrics */}
            <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Approval Rate & Metrics</h4>
              {leaves.length === 0 ? renderEmptyState("Metrics") : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, justifyContent: 'space-around' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                    <SVGDonutChart data={[
                      { label: 'Approved', value: approvedLeaves, color: 'var(--success)' },
                      { label: 'Rejected', value: rejectedLeaves, color: 'var(--danger)' },
                      { label: 'Pending', value: pendingApprovals, color: 'var(--warning)' }
                    ]} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Most Active Department</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '0.25rem' }}>
                        {highestDeptStr.split(' ')[0] || "None"}
                      </h4>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Top Leave Classification</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '0.25rem' }}>
                        {topLeaveTypeStr.split(' ')[0] || "None"}
                      </h4>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Employees on Leave Today */}
            <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '360px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Employees On Leave Today</h4>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', backgroundColor: '#FEE2E2', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                  Out: {employeesOnLeaveToday.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto' }}>
                {employeesOnLeaveToday.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: '#FAFDFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={emp.avatar} 
                        alt={emp.name} 
                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.role} | {emp.department}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--warning)', backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      On Leave
                    </span>
                  </div>
                ))}
                {employeesOnLeaveToday.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-light)', textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.5rem' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>All Staff Present</span>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>No employee is registered as "On Leave" today.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 2. EMPLOYEE DASHBOARD VIEW */}
      {/* ========================================== */}
      {currentRole === 'employee' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#DBEAFE', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Requested</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{roleLeaves.length}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#DCFCE7', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Leaves</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{approvedLeavesScoped}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FEF3C7', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Requests</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{pendingLeaves}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FEE2E2', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rejected Leaves</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{rejectedLeavesScoped}</h3>
              </div>
            </div>
          </div>

          {/* Leave Remaining Balances Grid (by reason / type) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Your Remaining Leave Balances by Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
              <div className="fs-card" style={{ borderLeft: '4px solid var(--primary-blue)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ANNUAL / EARNED</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-blue)', margin: '0.3rem 0' }}>
                  {currentUser.earnedLeave} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ 15 Days</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Vacation & Planned Leave</p>
              </div>

              <div className="fs-card" style={{ borderLeft: '4px solid var(--danger)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SICK / MEDICAL</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', margin: '0.3rem 0' }}>
                  {currentUser.medicalLeave} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ 10 Days</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Health & Medical Recovery</p>
              </div>

              <div className="fs-card" style={{ borderLeft: '4px solid var(--warning)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CASUAL / PERSONAL</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)', margin: '0.3rem 0' }}>
                  {currentUser.casualLeave} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ 12 Days</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Personal Work & Emergency</p>
              </div>

              <div className="fs-card" style={{ borderLeft: '4px solid var(--text-muted)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOSS OF PAY (UNPAID)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.3rem 0' }}>
                  {currentUser.lossOfPay} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Days Used</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Unpaid Off Balance</p>
              </div>
            </div>
          </div>

          {/* Leave Application Form & My Leave History Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1.5rem' }}>
            {/* Embedded Quick Leave Apply Form */}
            <div className="fs-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Apply for Leave</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Submit absence request for manager review.</p>
              </div>

              <form onSubmit={handleEmployeeLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Leave Category Reason *</label>
                  <select value={applyLeaveType} onChange={e => setApplyLeaveType(e.target.value as any)} required>
                    <option value="Annual">Annual / Earned Leave ({currentUser.earnedLeave} left)</option>
                    <option value="Sick">Sick / Medical Leave ({currentUser.medicalLeave} left)</option>
                    <option value="Personal">Personal / Casual Leave ({currentUser.casualLeave} left)</option>
                    <option value="Unpaid">Unpaid / Loss of Pay</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Start Date *</label>
                    <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>End Date *</label>
                    <input type="date" value={applyEndDate} onChange={e => setApplyEndDate(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Reason / Description *</label>
                  <textarea
                    rows={3}
                    value={applyReason}
                    onChange={e => setApplyReason(e.target.value)}
                    placeholder="Provide details for leave approval..."
                    required
                    style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--border-color)', width: '100%', fontFamily: 'inherit' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', width: '100%', borderRadius: 'var(--radius-md)' }}>
                  Submit Leave Request
                </button>
              </form>
            </div>

            {/* My Leave Requests Table */}
            <div className="fs-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Your Leave Application History</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{roleLeaves.length} Total</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {roleLeaves.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                    No leave requests submitted yet.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem 0.5rem' }}>Type</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>Dates</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>Duration</th>
                        <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleLeaves.map(lr => (
                        <tr key={lr.id} style={{ borderBottom: '1px solid #F0F7FF' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{lr.leaveType}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                            {lr.startDate} to {lr.endDate}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{lr.durationDays} day(s)</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: lr.status === 'Approved' ? '#DCFCE7' :
                                               lr.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                              color: lr.status === 'Approved' ? 'var(--success)' :
                                     lr.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                              {lr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 3. MANAGER / HR DASHBOARD VIEW */}
      {/* ========================================== */}
      {(currentRole === 'manager' || currentRole === 'hr') && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FEF3C7', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{pendingLeaves}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#DCFCE7', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Today</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{approvedToday}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#DBEAFE', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Staff</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{employees.length}</h3>
              </div>
            </div>

            <div className="fs-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Resolve Speed</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>{avgApprovalTimeStr}</h3>
              </div>
            </div>
          </div>

          {/* Graphs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
            <div className="fs-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.5rem' }}>Approval Volume Trend</h4>
              <div style={{ flex: 1, minHeight: 0 }}>
                {roleLeaves.length === 0 ? renderEmptyState("Approval Velocity") : (
                  <SVGAreaChart data={monthlyCounts} height={240} />
                )}
              </div>
            </div>

            <div className="fs-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.5rem' }}>Leaves by Department</h4>
              <div style={{ flex: 1, minHeight: 0 }}>
                {roleLeaves.length === 0 || departments.length === 0 ? renderEmptyState("Dept Statistics") : (
                  <SVGBarChart data={deptChartData} height={240} />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Requests Audit ledger */}
      <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Live Activity Ledger</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #F0F7FF',
              backgroundColor: '#FAFDFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                  minWidth: '76px',
                  textAlign: 'center'
                }}>
                  {log.category}
                </span>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{log.description}</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Initiated by {log.employeeName}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>{log.timestamp}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>
              No recent ledger activity logged yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
