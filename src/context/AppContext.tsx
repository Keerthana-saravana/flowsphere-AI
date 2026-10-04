import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = "http://127.0.0.1:8000/api";

export type AppView =
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'leaves'
  | 'employees'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'profile';

export type UserRole = 'admin' | 'manager' | 'hr' | 'employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  department: string;
  role: string;
  managerId: string | null;
  leaveBalance: number;
  casualLeave: number;
  medicalLeave: number;
  earnedLeave: number;
  lossOfPay: number;
  status: 'Active' | 'On Leave' | 'Suspended';
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
  budget: number;
  spent: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'Annual' | 'Sick' | 'Personal' | 'Maternity/Paternity' | 'Unpaid';
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  attachmentName?: string;
  status: 'Pending' | 'Manager Approved' | 'Approved' | 'Rejected';
  managerComment?: string;
  hrComment?: string;
  history: {
    stage: 'Submission' | 'Manager Review' | 'HR Review' | 'Finalized';
    actorName: string;
    action: 'Submitted' | 'Approved' | 'Rejected';
    timestamp: string;
    comment?: string;
  }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface CompanySettings {
  id: string;
  companyId: string;
  holidayCalendar: { date: string; name: string }[];
}

interface AppContextProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: Employee | null;
  setCurrentUser: (emp: Employee | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  
  employees: Employee[];
  departments: Department[];
  leaves: LeaveRequest[];
  settings: CompanySettings | null;
  logs: any[];
  reports: any[];
  
  // Auth state
  token: string | null;
  isAuthenticated: boolean;
  currentCompanyId: number | null;
  isLoading: boolean;
  loadError: string | null;
  loginViewState: 'login' | 'company-reg' | 'employee-reg' | 'employee-signup';
  setLoginViewState: (val: 'login' | 'company-reg' | 'employee-reg' | 'employee-signup') => void;
  
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilters: Record<string, any>;
  setActiveFilters: (filters: Record<string, any>) => void;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerCompany: (companyData: any) => Promise<number>;
  registerEmployee: (userData: any, companyId: number) => Promise<boolean>;
  updateUserProfile: (profileData: any) => Promise<boolean>;
  createNewLeave: (data: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'department' | 'status' | 'history'>) => Promise<void>;
  approveLeaveRequest: (id: string, comment?: string) => Promise<void>;
  rejectLeaveRequest: (id: string, comment?: string) => Promise<void>;
  createNewDepartment: (name: string, code: string, managerId?: string) => Promise<void>;
  updateCompanySettings: (holidays: any[]) => Promise<void>;
  retryLoad: () => void;
  resetDatabase: () => void;
  updateCompanyProfile: (companyData: any) => Promise<void>;
  addEmployee: (employeeData: any) => Promise<boolean>;
  editEmployee: (empId: string, employeeData: any) => Promise<boolean>;
  deactivateEmployee: (empId: string) => Promise<boolean>;
  saveReport: (reportData: any) => Promise<void>;
  
  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [currentRole, setCurrentRole] = useState<UserRole>('employee');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [token, setToken] = useState<string | null>(localStorage.getItem("fs_token"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loginViewState, setLoginViewState] = useState<'login' | 'company-reg' | 'employee-reg' | 'employee-signup'>('login');

  // Core records
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>([]);
  const [settingsData, setSettingsData] = useState<CompanySettings | null>(null);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);


  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Mappers
  const mapUserToEmployee = (u: any, depts: Department[]): Employee => {
    const dept = depts.find(d => String(d.id) === String(u.department_id));
    return {
      id: String(u.id),
      name: u.full_name,
      email: u.email,
      phone: u.phone || "",
      companyName: u.company_name || "FlowSphere AI",
      department: dept ? dept.name : "Unassigned",
      role: u.designation || u.role,
      managerId: dept ? dept.managerId : null,
      leaveBalance: u.casual_leave + u.medical_leave + u.earned_leave,
      casualLeave: u.casual_leave,
      medicalLeave: u.medical_leave,
      earnedLeave: u.earned_leave,
      lossOfPay: u.loss_of_pay,
      status: u.status,
      avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    };
  };

  const mapLeaveToRequest = (l: any, emps: Employee[], depts: Department[]): LeaveRequest => {
    let empName = "Unknown";
    let empDept = "Unassigned";
    const emp = emps.find(e => String(e.id) === String(l.user_id));
    if (emp) {
      empName = emp.name;
      empDept = emp.department;
    } else if (l.user) {
      empName = l.user.full_name;
      const d = depts.find(dept => String(dept.id) === String(l.user.department_id));
      empDept = d ? d.name : "Unassigned";
    }
    return {
      id: String(l.id),
      employeeId: String(l.user_id),
      employeeName: empName,
      department: empDept,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      durationDays: l.duration_days,
      reason: l.reason,
      attachmentName: l.attachment_name || undefined,
      status: l.status,
      managerComment: l.manager_comment || undefined,
      hrComment: l.hr_comment || undefined,
      history: l.history || []
    };
  };

  // Helper fetch wrapper
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem("fs_token");
    const headers = {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {})
    };
    
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || "Request failed");
      }
      return await res.json();
    } catch (e: any) {
      console.error(`API error on ${path}:`, e);
      throw e;
    }
  };

  const handleSetCurrentView = (view: AppView) => {
    if (view === 'landing') {
      setLoadError(null);
    }
    setCurrentView(view);
  };

  // Data Reload
  const reloadData = async () => {
    const activeToken = token || localStorage.getItem("fs_token");
    if (!activeToken) return;
    try {
      setLoadError(null);
      // 1. Fetch Departments
      const rawDepts = await apiFetch("/departments");
      const mappedDepts: Department[] = rawDepts.map((d: any) => ({
        id: String(d.id),
        name: d.name,
        code: d.code,
        managerId: d.manager_id ? String(d.manager_id) : "",
        budget: 0,
        spent: 0
      }));
      setDepartmentsList(mappedDepts);

      // 2. Fetch Employees
      const rawEmps = await apiFetch("/employees");
      const mappedEmps: Employee[] = rawEmps.map((e: any) => mapUserToEmployee(e, mappedDepts));
      setEmployeesList(mappedEmps);

      // 3. Fetch Leaves
      const rawLeaves = await apiFetch("/leaves/history");
      const mappedLeaves: LeaveRequest[] = rawLeaves.map((l: any) => mapLeaveToRequest(l, mappedEmps, mappedDepts));
      setLeavesList(mappedLeaves);

      // 4. Fetch Settings
      const rawSettings = await apiFetch("/settings");
      setSettingsData({
        id: String(rawSettings.id),
        companyId: String(rawSettings.company_id),
        holidayCalendar: rawSettings.holiday_calendar || []
      });

      // 5. Fetch Notifications
      const rawNotifs = await apiFetch("/notifications");
      setNotifications(rawNotifs.map((n: any) => ({
        id: String(n.id),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: n.read,
        type: n.type
      })));

      // 6. Fetch Logs
      const rawLogs = await apiFetch("/audit-logs");
      setLogsList(rawLogs.map((log: any) => ({
        id: String(log.id),
        timestamp: log.created_at.replace("T", " ").substring(0, 16),
        category: log.category,
        employeeName: log.actor_name,
        description: log.description,
        type: log.type
      })));

      // 7. Fetch Reports
      const rawReports = await apiFetch("/reports").catch(() => []);
      setReportsList(rawReports);


    } catch (e: any) {
      console.error("Failed to load SaaS data:", e.message);
      if (currentView !== 'landing') {
        setLoadError(e.message || "Failed to load dashboard data. Please check connection and retry.");
      }
    }
  };

  // Run on mount / token change
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("fs_token");
      if (storedToken) {
        setIsLoading(true);
        setLoadError(null);
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const user = await res.json();
            setToken(storedToken);
            setIsAuthenticated(true);
            setCurrentCompanyId(user.company_id);
            setCurrentRole(user.role.toLowerCase() as UserRole);
            
            const depts = await fetch(`${API_BASE}/departments`, {
              headers: { "Authorization": `Bearer ${storedToken}` }
            }).then(r => r.json()).catch(() => []);
            const mappedDepts: Department[] = depts.map((d: any) => ({
              id: String(d.id),
              name: d.name,
              code: d.code,
              managerId: d.manager_id ? String(d.manager_id) : "",
              budget: 0,
              spent: 0
            }));
            setCurrentUser(mapUserToEmployee(user, mappedDepts));
            setCurrentView('dashboard');
            await reloadData();
          } else {
            localStorage.removeItem("fs_token");
            setToken(null);
            setIsAuthenticated(false);
            setCurrentView('landing');
            setLoadError(null);
          }
        } catch (e: any) {
          console.error("Initialize auth error:", e);
          // If server connection fails on startup, clear stale token and keep user on Landing Page
          localStorage.removeItem("fs_token");
          setToken(null);
          setIsAuthenticated(false);
          setCurrentView('landing');
          setLoadError(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setCurrentView('landing');
      }
    };
    initializeAuth();
  }, []);

  // Reload data when token or view changes
  useEffect(() => {
    if (isAuthenticated && token) {
      reloadData();
    }
  }, [isAuthenticated, token, currentView]);

  // Notifications Utilities
  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationsAsRead = async () => {
    try {
      await apiFetch("/notifications/read", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {}
  };

  const clearNotifications = async () => {
    try {
      await apiFetch("/notifications/clear", { method: "POST" });
      setNotifications([]);
    } catch (e) {}
  };

  // Authentication Actions
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(error.detail || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("fs_token", data.access_token);
      setToken(data.access_token);
      setIsAuthenticated(true);
      
      // Fetch me
      const me = await fetch(`${API_BASE}/auth/me`, {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      }).then(r => r.json());
      
      setCurrentCompanyId(me.company_id);
      setCurrentRole(me.role.toLowerCase() as UserRole);
      
      const depts = await fetch(`${API_BASE}/departments`, {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      }).then(r => r.json()).catch(() => []);
      const mappedDepts: Department[] = depts.map((d: any) => ({
        id: String(d.id),
        name: d.name,
        code: d.code,
        managerId: d.manager_id ? String(d.manager_id) : "",
        budget: 0,
        spent: 0
      }));
      setCurrentUser(mapUserToEmployee(me, mappedDepts));
      setCurrentView('dashboard');
      
      await reloadData();
      addNotification("Welcome back", `Signed in successfully as ${me.full_name}`, "success");
      return true;
    } catch (e: any) {
      const errMsg = e.message && e.message.includes("Failed to fetch")
        ? "Unable to connect to backend server. Please check that backend server is running on port 8000."
        : (e.message || "Failed to authenticate.");
      alert(errMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("fs_token");
    setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentCompanyId(null);
    setCurrentView('landing');
  };

  const registerCompany = async (companyData: any): Promise<number> => {
    setIsLoading(true);
    try {
      const company = await apiFetch("/auth/register-company", {
        method: "POST",
        body: JSON.stringify(companyData)
      });
      return company.id;
    } catch (e: any) {
      alert(e.message || "Failed to register company.");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const registerEmployee = async (userData: any, companyId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiFetch(`/auth/register-employee?company_id=${companyId}`, {
        method: "POST",
        body: JSON.stringify(userData)
      });
      return true;
    } catch (e: any) {
      alert(e.message || "Failed to register employee.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData: any): Promise<boolean> => {
    try {
      const rawUser = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(profileData)
      });
      if (currentUser) {
        setCurrentUser(prev => prev ? ({
          ...prev,
          name: rawUser.full_name,
          email: rawUser.email,
          avatar: rawUser.avatar || prev.avatar,
          casualLeave: rawUser.casual_leave,
          medicalLeave: rawUser.medical_leave,
          earnedLeave: rawUser.earned_leave,
          lossOfPay: rawUser.loss_of_pay,
          leaveBalance: rawUser.casual_leave + rawUser.medical_leave + rawUser.earned_leave
        }) : null);
      }
      addNotification("Profile Updated", "Your contact profile details were saved successfully.", "success");
      return true;
    } catch (e: any) {
      alert(e.message || "Failed to update profile.");
      return false;
    }
  };

  // Leave Actions
  const createNewLeave = async (data: Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'department' | 'status' | 'history'>) => {
    try {
      await apiFetch("/leaves/apply", {
        method: "POST",
        body: JSON.stringify({
          leave_type: data.leaveType,
          start_date: data.startDate,
          end_date: data.endDate,
          reason: data.reason,
          attachment_name: data.attachmentName
        })
      });
      addNotification("Leave Request Submitted", "Absence request logged and manager notified.", "success");
      
      reloadData();
      
      const me = await apiFetch("/auth/me");
      if (currentUser) {
        setCurrentUser(prev => prev ? ({
          ...prev,
          casualLeave: me.casual_leave,
          medicalLeave: me.medical_leave,
          earnedLeave: me.earned_leave,
          lossOfPay: me.loss_of_pay,
          leaveBalance: me.casual_leave + me.medical_leave + me.earned_leave
        }) : null);
      }
    } catch (e: any) {
      alert(e.message || "Failed to submit leave request.");
    }
  };

  const approveLeaveRequest = async (id: string, comment?: string) => {
    try {
      await apiFetch(`/leaves/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ status: "Approved", comment })
      });
      addNotification("Request Approved", "Status updated successfully.", "success");
      reloadData();
    } catch (e: any) {
      alert(e.message || "Failed to approve leave request.");
    }
  };

  const rejectLeaveRequest = async (id: string, comment?: string) => {
    try {
      await apiFetch(`/leaves/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ status: "Rejected", comment })
      });
      addNotification("Request Rejected", "Status updated successfully.", "danger");
      reloadData();
    } catch (e: any) {
      alert(e.message || "Failed to reject leave request.");
    }
  };

  // Settings & Departments
  const createNewDepartment = async (name: string, code: string, managerId?: string) => {
    try {
      await apiFetch("/departments", {
        method: "POST",
        body: JSON.stringify({ name, code, manager_id: managerId ? Number(managerId) : null })
      });
      addNotification("Department Created", `New organizational department "${name}" registered.`, "success");
      reloadData();
    } catch (e: any) {
      alert(e.message || "Failed to create department.");
    }
  };

  const updateCompanySettings = async (holidays: any[]) => {
    try {
      await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ holiday_calendar: holidays })
      });
      addNotification("Settings Saved", "Holiday calendar details synchronized.", "success");
      reloadData();
    } catch (e: any) {
      alert(e.message || "Failed to update settings.");
    }
  };

  const updateCompanyProfile = async (companyData: any) => {
    try {
      await apiFetch("/companies/profile", {
        method: "PUT",
        body: JSON.stringify(companyData)
      });
      addNotification("Profile Updated", "Company profile details were saved successfully.", "success");
      reloadData();
    } catch (e: any) {
      alert(e.message || "Failed to update company profile.");
    }
  };

  const addEmployee = async (employeeData: any): Promise<boolean> => {
    try {
      await apiFetch("/employees", {
        method: "POST",
        body: JSON.stringify(employeeData)
      });
      addNotification("Employee Added", `Profile for ${employeeData.full_name} created successfully.`, "success");
      reloadData();
      return true;
    } catch (e: any) {
      alert(e.message || "Failed to add employee.");
      return false;
    }
  };

  const editEmployee = async (empId: string, employeeData: any): Promise<boolean> => {
    try {
      await apiFetch(`/employees/${empId}`, {
        method: "PUT",
        body: JSON.stringify(employeeData)
      });
      addNotification("Employee Updated", `Profile for ${employeeData.full_name} updated successfully.`, "success");
      reloadData();
      return true;
    } catch (e: any) {
      alert(e.message || "Failed to update employee.");
      return false;
    }
  };

  const deactivateEmployee = async (empId: string): Promise<boolean> => {
    try {
      await apiFetch(`/employees/${empId}/deactivate`, {
        method: "POST"
      });
      addNotification("Employee Suspended", "Employee status was changed to Suspended.", "warning");
      reloadData();
      return true;
    } catch (e: any) {
      alert(e.message || "Failed to deactivate employee.");
      return false;
    }
  };

  const saveReport = async (reportData: any) => {
    try {
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify(reportData)
      });
      addNotification("Report Saved", "Report has been successfully logged to database history.", "success");
      const rawReports = await apiFetch("/reports").catch(() => []);
      setReportsList(rawReports);
    } catch (e: any) {
      alert(e.message || "Failed to save report.");
    }
  };


  const retryLoad = () => {
    setLoadError(null);
    reloadData();
  };

  const resetDatabase = () => {
    logout();
    addNotification("Workspace Reset", "Demo session cleared. Please log in or register a new workspace.", "warning");
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView: handleSetCurrentView,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        sidebarCollapsed,
        setSidebarCollapsed,
        
        employees: employeesList,
        departments: departmentsList,
        leaves: leavesList,
        settings: settingsData,
        logs: logsList,
        reports: reportsList,
        
        token,
        isAuthenticated,
        currentCompanyId,
        isLoading,
        loadError,
        loginViewState,
        setLoginViewState,
        
        searchQuery,
        setSearchQuery,
        activeFilters,
        setActiveFilters,
        
        login,
        logout,
        registerCompany,
        registerEmployee,
        updateUserProfile,
        createNewLeave,
        approveLeaveRequest,
        rejectLeaveRequest,
        createNewDepartment,
        updateCompanySettings,
        retryLoad,
        resetDatabase,
        updateCompanyProfile,
        addEmployee,
        editEmployee,
        deactivateEmployee,
        saveReport,

        
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationsAsRead,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
