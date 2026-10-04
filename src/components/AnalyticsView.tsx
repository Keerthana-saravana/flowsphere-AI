import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SVGAreaChart, SVGBarChart, SVGDonutChart } from './SVGCharts';

export const AnalyticsView: React.FC = () => {
  const { leaves, departments, currentRole, currentUser } = useApp();
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [volumeMode, setVolumeMode] = useState<'department' | 'employee'>('department');

  if (!currentUser) return null;

  // Filter leaves based on role scope
  const getScopedLeaves = () => {
    if (currentRole === 'employee') {
      return leaves.filter(l => l.employeeId === currentUser.id);
    }
    if (currentRole === 'manager') {
      return leaves.filter(l => l.department === currentUser.department);
    }
    return leaves;
  };

  const scopedLeaves = getScopedLeaves();

  // If no leave requests exist, display clean "No analytics available." state
  if (scopedLeaves.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Analytics & BI Center</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Visualize operational turnaround metrics, request distributions, and department statistics.</p>
        </div>
        <div className="fs-card" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '420px',
          color: 'var(--text-light)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No analytics available.</span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '380px' }}>Absence metrics and trends will populate dynamically once employees submit leave applications.</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic Leave Type counts for Donut Chart
  const leaveTypesCounts = { Annual: 0, Sick: 0, Personal: 0, 'Maternity/Paternity': 0, Unpaid: 0 };
  scopedLeaves.forEach(l => {
    if (l.leaveType in leaveTypesCounts) {
      leaveTypesCounts[l.leaveType as keyof typeof leaveTypesCounts]++;
    }
  });

  const donutLeaveData = [
    { label: 'Annual Paid', value: leaveTypesCounts.Annual, color: 'var(--primary-blue)' },
    { label: 'Medical Sick', value: leaveTypesCounts.Sick, color: 'var(--danger)' },
    { label: 'Personal Off', value: leaveTypesCounts.Personal, color: 'var(--warning)' },
    { label: 'Parental', value: leaveTypesCounts['Maternity/Paternity'], color: '#8B5CF6' },
    { label: 'Unpaid Off', value: leaveTypesCounts.Unpaid, color: 'var(--text-light)' }
  ];

  // Calculate dynamic Request Status counts
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  scopedLeaves.forEach(l => {
    if (l.status === 'Pending' || l.status === 'Manager Approved') pending++;
    else if (l.status === 'Approved') approved++;
    else if (l.status === 'Rejected') rejected++;
  });

  const donutStatusData = [
    { label: 'Pending Review', value: pending, color: 'var(--warning)' },
    { label: 'Fully Approved', value: approved, color: 'var(--success)' },
    { label: 'Rejected Applications', value: rejected, color: 'var(--danger)' }
  ];

  // Dynamic Trend computations
  const getTrendData = () => {
    const today = new Date();
    if (trendPeriod === 'weekly') {
      const trend: { label: string; value: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const startOfWeek = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        const label = `Wk -${i}`;
        const count = scopedLeaves.filter(l => {
          const date = new Date(l.startDate);
          return date >= startOfWeek && date <= endOfWeek;
        }).length;
        trend.push({ label, value: count });
      }
      return trend;
    } else if (trendPeriod === 'yearly') {
      const trend: { label: string; value: number }[] = [];
      for (let i = 1; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const label = String(year);
        const count = scopedLeaves.filter(l => {
          const date = new Date(l.startDate);
          return date.getFullYear() === year;
        }).length;
        trend.push({ label, value: count });
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
        const count = scopedLeaves.filter(l => {
          const date = new Date(l.startDate);
          return date.getMonth() === mNum && date.getFullYear() === mYear;
        }).length;
        trend.push({ label: mLabel, value: count });
      }
      return trend;
    }
  };

  // Dynamic volume computations
  const getVolumeData = () => {
    if (volumeMode === 'employee') {
      const empCounts: Record<string, number> = {};
      scopedLeaves.forEach(l => {
        empCounts[l.employeeName] = (empCounts[l.employeeName] || 0) + 1;
      });
      return Object.entries(empCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          label: name.split(' ')[0],
          value: count,
          color: 'var(--accent-blue)'
        }));
    } else {
      // Department volume
      return departments.map(d => {
        const count = scopedLeaves.filter(l => l.department === d.name).length;
        return {
          label: d.name.replace('Human Resources', 'HR'),
          value: count,
          color: 'var(--primary-blue)'
        };
      });
    }
  };

  const trendData = getTrendData();
  const volumeData = getVolumeData();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Analytics & BI Center</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Visualize operational turnaround metrics, request distributions, and department statistics.</p>
      </div>

      {/* Grid: Donut Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Donut 1: Leave Categories */}
        <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Leave Classification Distribution
          </h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SVGDonutChart data={donutLeaveData} />
          </div>
        </div>

        {/* Donut 2: Status Breakdown */}
        <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Workflow Requests Statuses
          </h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SVGDonutChart data={donutStatusData} />
          </div>
        </div>
      </div>

      {/* Grid: Trends and Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Trend Area Chart */}
        <div className="fs-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Absence Request Volume ({trendPeriod.toUpperCase()} Trend)
            </h4>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px' }}>
              {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    color: trendPeriod === p ? 'var(--primary-blue)' : 'var(--text-muted)',
                    backgroundColor: trendPeriod === p ? '#FFFFFF' : 'transparent',
                    boxShadow: trendPeriod === p ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <SVGAreaChart data={trendData} height={250} />
          </div>
        </div>

        {/* Bar Chart volumes */}
        <div className="fs-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Leave Volumes ({volumeMode === 'department' ? 'By Dept' : 'By Staff'})
            </h4>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px' }}>
              {(['department', 'employee'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setVolumeMode(mode)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    color: volumeMode === mode ? 'var(--primary-blue)' : 'var(--text-muted)',
                    backgroundColor: volumeMode === mode ? '#FFFFFF' : 'transparent',
                    boxShadow: volumeMode === mode ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {mode === 'department' ? 'Department' : 'Employee'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {volumeData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)', fontSize: '0.82rem' }}>
                No volume data available.
              </div>
            ) : (
              <SVGBarChart data={volumeData} height={250} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
