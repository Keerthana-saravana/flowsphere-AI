import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ReportsView: React.FC = () => {
  const { leaves, employees, departments } = useApp();

  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'yearly' | 'department' | 'employee'>('weekly');
  const [deptSelect, setDeptSelect] = useState('');
  const [empSelect, setEmpSelect] = useState('');
  const [reportLeaves, setReportLeaves] = useState<any[] | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Initialize dropdown fallbacks
  React.useEffect(() => {
    if (departments.length > 0 && !deptSelect) {
      setDeptSelect(departments[0].name);
    }
    if (employees.length > 0 && !empSelect) {
      setEmpSelect(employees[0].id);
    }
  }, [departments, employees, deptSelect, empSelect]);

  const handleGenerateReport = () => {
    setHasGenerated(true);
    const today = new Date();
    
    let filtered = [...leaves];

    if (reportType === 'weekly') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = leaves.filter(l => new Date(l.startDate) >= oneWeekAgo);
    } else if (reportType === 'monthly') {
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = leaves.filter(l => new Date(l.startDate) >= oneMonthAgo);
    } else if (reportType === 'yearly') {
      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = leaves.filter(l => new Date(l.startDate) >= oneYearAgo);
    } else if (reportType === 'department') {
      filtered = leaves.filter(l => l.department === deptSelect);
    } else if (reportType === 'employee') {
      filtered = leaves.filter(l => l.employeeId === empSelect);
    }

    setReportLeaves(filtered);
  };

  const getReportTitle = () => {
    const period = reportType.toUpperCase();
    if (reportType === 'department') {
      return `${deptSelect} Department Absence Report`;
    }
    if (reportType === 'employee') {
      const emp = employees.find(e => e.id === empSelect);
      return `Absence Report for ${emp ? emp.name : 'Employee'}`;
    }
    return `${period} Leave Audit Summary`;
  };

  const getReportScope = () => {
    if (reportType === 'department') return `Department: ${deptSelect}`;
    if (reportType === 'employee') {
      const emp = employees.find(e => e.id === empSelect);
      return `Employee: ${emp ? emp.name : 'Unknown'} (ID: ${empSelect})`;
    }
    return `Period: Last ${reportType === 'weekly' ? '7 Days' : reportType === 'monthly' ? '30 Days' : '365 Days'}`;
  };

  // Metrics for generated report
  const approvedCount = reportLeaves?.filter(l => l.status === 'Approved').length || 0;
  const pendingCount = reportLeaves?.filter(l => l.status === 'Pending' || l.status === 'Manager Approved').length || 0;
  const rejectedCount = reportLeaves?.filter(l => l.status === 'Rejected').length || 0;
  const totalDays = reportLeaves?.reduce((acc, l) => acc + l.durationDays, 0) || 0;

  // Exports
  const triggerCSVDownload = () => {
    if (!reportLeaves || reportLeaves.length === 0) return;
    let content = 'ID,Employee,Department,Leave Type,Duration Days,Status,Start Date,End Date,Reason\n';
    reportLeaves.forEach(l => {
      content += `${l.id},"${l.employeeName}","${l.department}","${l.leaveType}",${l.durationDays},"${l.status}",${l.startDate},${l.endDate},"${l.reason.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowsphere_report_${Date.now()}.csv`;
    link.click();
  };

  const triggerExcelDownload = () => {
    if (!reportLeaves || reportLeaves.length === 0) return;
    let content = 'ID\tEmployee\tDepartment\tLeave Type\tDuration (Days)\tStatus\tStart Date\tEnd Date\tReason\n';
    reportLeaves.forEach(l => {
      content += `${l.id}\t${l.employeeName}\t${l.department}\t${l.leaveType}\t${l.durationDays}\t${l.status}\t${l.startDate}\t${l.endDate}\t${l.reason}\n`;
    });

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowsphere_report_${Date.now()}.xls`;
    link.click();
  };

  const triggerPDFExport = () => {
    if (!reportLeaves) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${getReportTitle()}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #1E293B; }
            h1 { color: #2563EB; font-size: 1.8rem; margin-bottom: 0.5rem; }
            .meta { color: #64748B; font-size: 0.9rem; margin-bottom: 1.5rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.75rem; }
            .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
            .summary-card { background: #F8FCFF; border: 1px solid #D6EAFB; padding: 1rem; border-radius: 8px; text-align: center; }
            .summary-card h3 { font-size: 1.5rem; margin: 0.25rem 0; color: #1E293B; }
            .summary-card span { font-size: 0.75rem; color: #64748B; text-transform: uppercase; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.85rem; }
            th { background-color: #F8FCFF; border-bottom: 2px solid #D6EAFB; padding: 0.75rem; text-align: left; color: #64748B; }
            td { border-bottom: 1px solid #EAF6FF; padding: 0.75rem; }
          </style>
        </head>
        <body>
          <h1>${getReportTitle()}</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()} | Scope: ${getReportScope()}</div>
          <div class="summary">
            <div class="summary-card">
              <span>Total Requests</span>
              <h3>${reportLeaves.length}</h3>
            </div>
            <div class="summary-card">
              <span>Approved</span>
              <h3>${approvedCount}</h3>
            </div>
            <div class="summary-card">
              <span>Pending</span>
              <h3>${pendingCount}</h3>
            </div>
            <div class="summary-card">
              <span>Rejected</span>
              <h3>${rejectedCount}</h3>
            </div>
            <div class="summary-card">
              <span>Total Days</span>
              <h3>${totalDays}</h3>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Absence Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportLeaves.map(r => `
                <tr>
                  <td><strong>${r.employeeName}</strong></td>
                  <td>${r.department}</td>
                  <td>${r.leaveType}</td>
                  <td>${r.durationDays} Days</td>
                  <td>${r.startDate} to ${r.endDate}</td>
                  <td>${r.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>Reports Manager</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Generate customized audit reports, inspect staff absences, and export tabular databases.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Parameter Selector Card */}
        <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Configure Report</h4>
          
          <div className="form-group">
            <label>Report Classification</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as any)}>
              <option value="weekly">Weekly Status Review</option>
              <option value="monthly">Monthly Audit Summary</option>
              <option value="yearly">Yearly Absence Digest</option>
              <option value="department">Department Deep-Dive</option>
              <option value="employee">Individual Staff Report</option>
            </select>
          </div>

          {reportType === 'department' && (
            <div className="form-group">
              <label>Select Department</label>
              <select value={deptSelect} onChange={e => setDeptSelect(e.target.value)} required>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'employee' && (
            <div className="form-group">
              <label>Select Employee Profile</label>
              <select value={empSelect} onChange={e => setEmpSelect(e.target.value)} required>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={handleGenerateReport} 
            className="btn btn-primary" 
            style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
          >
            Generate Report
          </button>
        </div>

        {/* Right Output Dashboard Panel */}
        <div className="fs-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          {hasGenerated && reportLeaves !== null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              
              {/* Header Action Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {getReportTitle()}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>{getReportScope()}</span>
                </div>
                {reportLeaves.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={triggerPDFExport}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={triggerExcelDownload}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={triggerCSVDownload}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: '#FAFDFF' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL REQUESTS</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>{reportLeaves.length}</h3>
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: '#FAFDFF' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>APPROVED</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: 'var(--success)' }}>{approvedCount}</h3>
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: '#FAFDFF' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>PENDING</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: 'var(--warning)' }}>{pendingCount}</h3>
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: '#FAFDFF' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>REJECTED</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: 'var(--danger)' }}>{rejectedCount}</h3>
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: '#FAFDFF' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-blue)', fontWeight: 600 }}>TOTAL DAYS</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: 'var(--primary-blue)' }}>{totalDays}</h3>
                </div>
              </div>

              {/* Leaves Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FCFF', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Employee</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Department</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Duration</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Dates</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLeaves.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F0F7FF' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.employeeName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{r.department}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)' }}>{r.leaveType}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{r.durationDays} Days</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)' }}>{r.startDate} to {r.endDate}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge badge-${
                            r.status === 'Approved' ? 'approved' : r.status === 'Rejected' ? 'rejected' : 'pending'
                          }`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reportLeaves.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          No leaves found for the selected parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-light)', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <h3>No Report Generated</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Configure report parameters in the left-hand panel and click "Generate".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
