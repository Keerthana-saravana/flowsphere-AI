import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    industry = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    num_employees = Column(Integer, default=1)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="company", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="company", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="company", cascade="all, delete-orphan")
    settings = relationship("CompanySettings", back_populates="company", uselist=False, cascade="all, delete-orphan")
    leave_balances = relationship("LeaveBalance", back_populates="company", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    employee_id = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String, nullable=True)
    role = Column(String, nullable=False)  # 'employee', 'manager', 'hr', 'admin'
    avatar = Column(String, nullable=True)
    status = Column(String, default="Active")  # 'Active', 'On Leave', 'Suspended'

    # Leave balances stored individually
    casual_leave = Column(Integer, default=12)
    medical_leave = Column(Integer, default=10)
    earned_leave = Column(Integer, default=15)
    loss_of_pay = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="users")
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    managed_departments = relationship("Department", foreign_keys="[Department.manager_id]", back_populates="manager")
    leave_requests = relationship("LeaveRequest", foreign_keys="[LeaveRequest.user_id]", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    leave_balances = relationship("LeaveBalance", back_populates="user", cascade="all, delete-orphan")

    @property
    def company_name(self) -> str:
        return self.company.name if self.company else ""


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="departments")
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_departments")
    employees = relationship("User", foreign_keys="[User.department_id]", back_populates="department")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String, nullable=False)  # 'Annual', 'Sick', 'Personal', 'Maternity/Paternity', 'Unpaid'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    attachment_name = Column(String, nullable=True)
    status = Column(String, default="Pending")  # 'Pending', 'Manager Approved', 'Approved', 'Rejected'
    
    manager_comment = Column(String, nullable=True)
    hr_comment = Column(String, nullable=True)
    
    # Audit trail details
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    history = Column(JSON, default=list)  # list of history transitions (stage, actorName, action, timestamp, comment)

    # Relationships
    company = relationship("Company", back_populates="leave_requests")
    user = relationship("User", foreign_keys=[user_id], back_populates="leave_requests")
    approved_by = relationship("User", foreign_keys=[approved_by_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")  # 'info', 'success', 'warning', 'danger'
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="notifications")
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    actor_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)  # 'Leave', 'Auth', 'System', 'Settings'
    type = Column(String, default="info")  # 'info', 'success', 'warning', 'danger'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    holiday_calendar = Column(JSON, default=list)  # list of holidays: {date: "2026-12-25", name: "Christmas"}
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="settings")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String, nullable=False)  # 'Annual', 'Sick', 'Personal', 'Maternity/Paternity', 'Unpaid'
    allowed_days = Column(Integer, default=0)
    used_days = Column(Integer, default=0)

    # Relationships
    company = relationship("Company", back_populates="leave_balances")
    user = relationship("User", back_populates="leave_balances")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # 'Weekly', 'Monthly', 'Yearly', 'Department', 'Employee'
    format = Column(String, nullable=False)  # 'PDF', 'Excel', 'CSV'
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="reports")
