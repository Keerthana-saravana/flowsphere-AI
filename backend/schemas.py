from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import date, datetime

# Token & Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    company_id: Optional[int] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# Company Schemas
class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    num_employees: Optional[int] = 1
    logo_url: Optional[str] = None

class CompanyOut(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    num_employees: int
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True

# User Schemas
class UserCreate(BaseModel):
    full_name: str
    username: str
    employee_id: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    password: str
    department_id: Optional[int] = None
    designation: Optional[str] = None
    role: str  # 'employee', 'manager', 'hr', 'admin'
    avatar: Optional[str] = None

class UserOut(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None
    full_name: str
    username: str
    employee_id: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    role: str
    avatar: Optional[str] = None
    status: str
    casual_leave: int
    medical_leave: int
    earned_leave: int
    loss_of_pay: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    code: str
    manager_id: Optional[int] = None

class DepartmentOut(BaseModel):
    id: int
    company_id: int
    name: str
    code: str
    manager_id: Optional[int] = None

    class Config:
        from_attributes = True

# LeaveRequest Schemas
class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    attachment_name: Optional[str] = None

class LeaveRequestUpdate(BaseModel):
    status: str  # 'Manager Approved', 'Approved', 'Rejected'
    comment: Optional[str] = None

class LeaveRequestOut(BaseModel):
    id: int
    company_id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    duration_days: int
    reason: str
    attachment_name: Optional[str] = None
    status: str
    manager_comment: Optional[str] = None
    hr_comment: Optional[str] = None
    created_at: datetime
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    history: List[Any] = []
    
    # We can embed employee details for direct usage in queues
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    company_id: int
    user_id: int
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# AuditLog Schemas
class AuditLogOut(BaseModel):
    id: int
    company_id: int
    user_id: Optional[int] = None
    actor_name: str
    description: str
    category: str
    type: str
    created_at: datetime

    class Config:
        from_attributes = True

# CompanySettings Schemas
class CompanySettingsOut(BaseModel):
    id: int
    company_id: int
    holiday_calendar: List[Any] = []
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanySettingsUpdate(BaseModel):
    holiday_calendar: List[Any]

# Analytics & Reports Schemas
class DashboardStats(BaseModel):
    pending_approvals: int
    approved_today: int
    total_employees: int
    avg_approval_speed_hours: float
    leave_balance: int  # for employees

class ChartDataPoint(BaseModel):
    label: str
    value: float
    color: Optional[str] = None

class AnalyticsSummary(BaseModel):
    leave_type_distribution: List[ChartDataPoint]
    status_breakdown: List[ChartDataPoint]
    monthly_trend: List[ChartDataPoint]
    department_volumes: List[ChartDataPoint]


# LeaveBalance Schemas
class LeaveBalanceOut(BaseModel):
    id: int
    company_id: int
    user_id: int
    leave_type: str
    allowed_days: int
    used_days: int

    class Config:
        from_attributes = True


# Report Schemas
class ReportCreate(BaseModel):
    name: str
    report_type: str
    format: str
    data: Optional[Any] = None


class ReportOut(BaseModel):
    id: int
    company_id: int
    name: str
    report_type: str
    format: str
    data: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Company Update Schema
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    num_employees: Optional[int] = None
    logo_url: Optional[str] = None

