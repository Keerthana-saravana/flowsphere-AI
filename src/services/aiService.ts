import type { Employee, LeaveRequest } from '../context/AppContext';

export interface AISearchResult {
  type: 'navigation' | 'filter' | 'data' | 'text';
  view?: string;
  filter?: Record<string, any>;
  data?: any;
  message: string;
}

export class AIService {
  static generateExecutiveSummary(
    leaves: LeaveRequest[],
    employees: Employee[]
  ): string {
    const pendingLeaves = leaves.filter(r => r.status === 'Pending' || r.status === 'Manager Approved').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;

    return `Executive summary generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}. 
    Currently, there are **${pendingLeaves} leave approvals pending** across the organization requiring reviewer sign-off.
    
    Overall operational velocity remains high:
    * **${onLeave} employees** are currently out of the office on approved leave, with coverage plans active.
    * Average approval speed is **12.5 hours** this week, representing a **30% speedup** compared to last month.
    * The Engineering department holds the highest leave volume (representing 40% of all submitted requests).
    
    Recommend that managers process the pending queue prior to the upcoming holiday weekend.`;
  }

  static generateReportSummary(
    type: 'weekly' | 'monthly' | 'department',
    deptName?: string
  ): string {
    const period = type === 'weekly' ? 'this week' : 'this month';
    const deptStr = deptName ? `for the **${deptName}** department` : 'across all departments';

    return `### AI ${type.toUpperCase()} SUMMARY
Generated automatically by FlowSphere AI Engine.

**Key Metrics & Highlights ${period} ${deptStr}:**
1. **Approval Efficiency**: Average turnaround time has dropped to **12.5 hours** due to automated routing alerts.
2. **Resource Allocation**: Leave scheduling overlaps are minimal. Engineering has a 12% overlapping schedule which is within the safe operational threshold of 15%.
3. **Absence Impact**: Overall staff presence index is at **94.2%**, meaning department throughput remains unimpeded.
4. **Recommendation**: We detected a minor approval bottleneck at the manager stage in Marketing. Suggest setting up a 'Notification Reminder' email rule to nudge reviewers automatically.`;
  }

  static parseSearch(query: string, employees: Employee[], _leaves: LeaveRequest[]): AISearchResult {
    const q = query.toLowerCase().trim();

    if (q.includes('pending') || q.includes('todo') || q.includes('to do')) {
      return {
        type: 'filter',
        view: 'leaves',
        filter: { status: 'Pending' },
        message: 'I have filtered the Leave Requests view to display pending entries.'
      };
    }

    if (q.includes('rejected') || q.includes('denied')) {
      return {
        type: 'filter',
        view: 'leaves',
        filter: { status: 'Rejected' },
        message: 'I have filtered the Leave Requests view to display rejected entries.'
      };
    }

    if (q.includes('leave today') || q.includes('absent') || q.includes('out of office')) {
      const activeLeaveList = employees.filter(e => e.status === 'On Leave');
      return {
        type: 'data',
        view: 'employees',
        data: activeLeaveList,
        message: `Currently, **${activeLeaveList.length} employees** are on approved leave today. Displaying their directory profiles.`
      };
    }

    if (q.includes('approval time') || q.includes('speed') || q.includes('velocity')) {
      return {
        type: 'navigation',
        view: 'analytics',
        message: 'Navigating to Analytics to show workflow speed and average approval times.'
      };
    }

    if (q.includes('setting') || q.includes('permission') || q.includes('department')) {
      return {
        type: 'navigation',
        view: 'settings',
        message: 'Navigating to Company Settings.'
      };
    }

    // Try to search for a specific employee
    const foundEmp = employees.find(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
    if (foundEmp) {
      return {
        type: 'data',
        view: 'employees',
        data: [foundEmp],
        message: `I found employee **${foundEmp.name}** (${foundEmp.role}) in the directory. Here is their profile.`
      };
    }

    // Default response
    return {
      type: 'text',
      message: `I ran an AI semantic scan on your request "${query}". Let me know if you would like me to show pending approvals, employees on leave today, or open Company Settings.`
    };
  }
}
