from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import datetime
from typing import List, Optional, Any
from database import engine, get_db
import models
import schemas
import auth

# Initialize FastAPI App
app = FastAPI(title="FlowSphere AI Leave Management SaaS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Database Initialization
@app.on_event("startup")
def startup_db_setup():
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if 'users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('users')]
        if 'username' not in columns:
            print("Detected legacy schema. Recreating tables for SaaS upgrade...")
            with engine.connect() as connection:
                with connection.begin():
                    connection.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS notifications CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS leave_requests CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS departments CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS company_settings CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS companies CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS roles CASCADE;"))
                    connection.execute(text("DROP TABLE IF EXISTS leave_types CASCADE;"))
            
    models.Base.metadata.create_all(bind=engine)
    
    # Seed metadata
    db = next(get_db())
    try:
        if db.query(models.Role).count() == 0:
            print("Seeding roles...")
            for r_name in ['Company Admin', 'HR', 'Manager', 'Employee']:
                db.add(models.Role(name=r_name))
        
        if db.query(models.LeaveType).count() == 0:
            print("Seeding leave types...")
            for lt_name in ['Annual', 'Sick', 'Personal', 'Maternity/Paternity', 'Unpaid']:
                db.add(models.LeaveType(name=lt_name))
                
        db.commit()
    finally:
        db.close()

def seed_default_data(db: Session):
    print("Database seeding bypassed to keep application state completely clean.")


# ==========================================
# PUBLIC ENDPOINTS
# ==========================================

@app.get("/api/public/companies/{company_id}/departments", response_model=List[schemas.DepartmentOut])
def get_company_departments_public(company_id: int, db: Session = Depends(get_db)):
    return db.query(models.Department).filter(models.Department.company_id == company_id).all()


# ==========================================
# AUTH ENDPOINTS
# ==========================================

def seed_50_employees(company_id: int, db: Session):
    import random
    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
        "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", 
        "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", 
        "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", 
        "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", 
        "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa"
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", 
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", 
        "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", 
        "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", 
        "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", 
        "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
    ]

    # Get created departments
    depts = db.query(models.Department).filter(models.Department.company_id == company_id).all()
    if not depts:
        return

    # Seed random employees
    roles = ['employee', 'manager', 'hr']
    designations = {
        'employee': ["Software Engineer", "Marketing Associate", "HR Executive", "Financial Analyst", "Operations Clerk"],
        'manager': ["Engineering Manager", "Marketing Manager", "HR Manager", "Finance Manager", "Operations Manager"],
        'hr': ["HR Director", "Recruiting Lead", "Employee Relations Specialist"]
    }
    
    avatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
    ]

    # Create manager candidates first
    managers_by_dept = {}
    for i, d in enumerate(depts):
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        full_name = f"{f_name} {l_name}"
        username = f"{f_name.lower()}.{l_name.lower()}{random.randint(10, 99)}"
        email = f"{username}@flowsphere-saas.com"
        emp_id = f"EMP-{company_id}-MGR{i+1}"
        hashed_password = auth.get_password_hash("123456")
        
        manager_user = models.User(
            company_id=company_id,
            full_name=full_name,
            username=username,
            employee_id=emp_id,
            email=email,
            phone=f"+1 (555) 019-99{i:02d}",
            hashed_password=hashed_password,
            department_id=d.id,
            designation=random.choice(designations['manager']),
            role='manager',
            avatar=random.choice(avatars),
            status='Active'
        )
        db.add(manager_user)
        db.flush()
        managers_by_dept[d.id] = manager_user.id
        
        # Link department manager
        d.manager_id = manager_user.id
        
        # Create leave balances
        balances = [
            models.LeaveBalance(company_id=company_id, user_id=manager_user.id, leave_type='Annual', allowed_days=15, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=manager_user.id, leave_type='Sick', allowed_days=10, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=manager_user.id, leave_type='Personal', allowed_days=12, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=manager_user.id, leave_type='Maternity/Paternity', allowed_days=12, used_days=0)
        ]
        db.add_all(balances)

    # Now create remaining employees
    for i in range(44): # 6 managers + 44 employees = 50 users
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        full_name = f"{f_name} {l_name}"
        username = f"{f_name.lower()}.{l_name.lower()}{random.randint(100, 999)}"
        email = f"{username}@flowsphere-saas.com"
        emp_id = f"EMP-{company_id}-{i+10:03d}"
        hashed_password = auth.get_password_hash("123456")
        
        d = random.choice(depts)
        role = random.choice(['employee', 'employee', 'hr']) # skew employee
        
        user = models.User(
            company_id=company_id,
            full_name=full_name,
            username=username,
            employee_id=emp_id,
            email=email,
            phone=f"+1 (555) 018-88{i:02d}",
            hashed_password=hashed_password,
            department_id=d.id,
            designation=random.choice(designations[role]),
            role=role,
            avatar=random.choice(avatars),
            status=random.choice(['Active', 'Active', 'Active', 'On Leave']) # some on leave
        )
        db.add(user)
        db.flush()
        
        # Create leave balances
        balances = [
            models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Annual', allowed_days=15, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Sick', allowed_days=10, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Personal', allowed_days=12, used_days=0),
            models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Maternity/Paternity', allowed_days=12, used_days=0)
        ]
        db.add_all(balances)

    db.flush()

    # Seed sample leave requests for employees
    all_users = db.query(models.User).filter(models.User.company_id == company_id).all()
    leave_types = ['Annual', 'Sick', 'Personal', 'Unpaid']
    statuses = ['Approved', 'Approved', 'Pending', 'Rejected']
    reasons = [
        "Annual family vacation and wellness break",
        "Seasonal flu recovery and medical rest",
        "Personal family commitment and relocation",
        "Attending industry technology conference",
        "Emergency personal matter requiring time off"
    ]
    
    for u in all_users[:25]:
        num_leaves = random.randint(1, 3)
        for k in range(num_leaves):
            l_type = random.choice(leave_types)
            status = random.choice(statuses)
            dur = random.randint(1, 4)
            s_date = datetime.date.today() - datetime.timedelta(days=random.randint(5, 40))
            e_date = s_date + datetime.timedelta(days=dur - 1)
            
            lr = models.LeaveRequest(
                company_id=company_id,
                user_id=u.id,
                leave_type=l_type,
                start_date=s_date,
                end_date=e_date,
                duration_days=dur,
                reason=random.choice(reasons),
                status=status,
                history=[{
                    "stage": "Submission",
                    "actorName": u.full_name,
                    "action": "Submitted",
                    "timestamp": s_date.strftime("%Y-%m-%d 09:00")
                }]
            )
            db.add(lr)
            
            if status == 'Approved':
                if l_type == 'Annual':
                    u.earned_leave = max(0, u.earned_leave - dur)
                elif l_type == 'Sick':
                    u.medical_leave = max(0, u.medical_leave - dur)
                elif l_type == 'Personal':
                    u.casual_leave = max(0, u.casual_leave - dur)
                elif l_type == 'Unpaid':
                    u.loss_of_pay += dur

    db.commit()


@app.post("/api/auth/register-company", response_model=schemas.CompanyOut)
def register_company(data: schemas.CompanyCreate, db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(models.Company).filter(models.Company.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company name already registered.")
        
    company = models.Company(**data.dict())
    db.add(company)
    db.flush()
    
    # Initialize Settings
    settings = models.CompanySettings(company_id=company.id, holiday_calendar=[])
    db.add(settings)
    
    # Initialize standard departments
    dept_details = [
        {"name": "Engineering", "code": "ENG"},
        {"name": "Marketing", "code": "MKT"},
        {"name": "Human Resources", "code": "HR"},
        {"name": "Finance", "code": "FIN"},
        {"name": "Operations", "code": "OPS"},
        {"name": "Executive", "code": "EXEC"}
    ]
    for d_info in dept_details:
        d = models.Department(
            company_id=company.id,
            name=d_info["name"],
            code=d_info["code"],
            manager_id=None
        )
        db.add(d)
        
    db.flush()
    seed_50_employees(company.id, db)
    
    db.commit()
    db.refresh(company)
    return company

@app.post("/api/auth/register-employee", response_model=schemas.UserOut)
def register_employee(data: schemas.UserCreate, company_id: int = Query(...), db: Session = Depends(get_db)):
    # Verify Company exists
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
        
    # Validation
    if not data.username or len(data.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username is required.")
        
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    # Check duplicate username
    existing_username = db.query(models.User).filter(models.User.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")
        
    # Check duplicate email
    existing_email = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    # Force admin role if first user
    is_first = db.query(models.User).filter(models.User.company_id == company_id).count() == 0
    if is_first:
        data.role = "admin"
        data.designation = "Company Admin"

    # Auto generate employee ID if missing
    if not data.employee_id or len(data.employee_id.strip()) == 0:
        count = db.query(models.User).filter(models.User.company_id == company_id).count()
        data.employee_id = f"EMP-{company_id}-{count + 1:03d}"

    hashed_password = auth.get_password_hash(data.password)
    user_dict = data.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    user_dict["company_id"] = company_id
    
    user = models.User(**user_dict)
    db.add(user)
    db.flush()
    
    # Create leave balances
    balances = [
        models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Annual', allowed_days=15, used_days=0),
        models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Sick', allowed_days=10, used_days=0),
        models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Personal', allowed_days=12, used_days=0),
        models.LeaveBalance(company_id=company_id, user_id=user.id, leave_type='Maternity/Paternity', allowed_days=12, used_days=0)
    ]
    db.add_all(balances)
    
    # Auto assign manager
    if user.role in ["manager", "hr"] and user.department_id:
        dept = db.query(models.Department).filter(
            models.Department.id == user.department_id,
            models.Department.company_id == company_id
        ).first()
        if dept:
            dept.manager_id = user.id
            
    db.commit()
    db.refresh(user)
    
    # Add audit log
    db.add(models.AuditLog(
        company_id=company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Employee profile created ({user.role})",
        category="Auth",
        type="success"
    ))
    db.commit()
    
    return user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Login via username or email
    user = db.query(models.User).filter(
        (models.User.email == data.email) | (models.User.username == data.email)
    ).first()
    
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = auth.create_access_token(
        data={"sub": user.email, "company_id": user.company_id, "role": user.role}
    )
    
    # Log audit event
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description="User signed in to workspace",
        category="Auth",
        type="info"
    ))
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(auth.get_current_user)):
    return user


# ==========================================
# EMPLOYEES & PROFILE ENDPOINTS
# ==========================================

@app.get("/api/employees", response_model=List[schemas.UserOut])
def get_employees(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Multi-tenant constraint: only return employees belonging to the logged-in user's company
    employees = db.query(models.User).filter(models.User.company_id == user.company_id).all()
    return employees

@app.put("/api/users/profile", response_model=schemas.UserOut)
def update_profile(data: schemas.UserUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        if data.email != user.email:
            existing = db.query(models.User).filter(models.User.email == data.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered.")
            user.email = data.email
    if data.phone is not None:
        user.phone = data.phone
    if data.avatar is not None:
        user.avatar = data.avatar
    if data.password:
        user.hashed_password = auth.get_password_hash(data.password)
        
    db.commit()
    db.refresh(user)
    return user


# ==========================================
# LEAVE MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/leaves/apply", response_model=schemas.LeaveRequestOut)
def apply_leave(data: schemas.LeaveRequestCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Duration Calculation
    time_diff = data.end_date - data.start_date
    duration = time_diff.days + 1
    if duration <= 0:
        raise HTTPException(status_code=400, detail="End date must be after or equal to start date.")
        
    # Check leave balance limit
    balance = 0
    if data.leave_type == "Annual":
        balance = user.earned_leave
    elif data.leave_type == "Sick":
        balance = user.medical_leave
    elif data.leave_type in ["Personal", "Maternity/Paternity"]:
        balance = user.casual_leave
        
    if data.leave_type != "Unpaid" and balance < duration:
        raise HTTPException(status_code=400, detail=f"Insufficient leave balance. You have {balance} days but requested {duration} days.")

    history_json = [
        {
            "stage": "Submission",
            "actorName": user.full_name,
            "action": "Submitted",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        }
    ]

    lr = models.LeaveRequest(
        company_id=user.company_id,
        user_id=user.id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        duration_days=duration,
        reason=data.reason,
        attachment_name=data.attachment_name,
        status="Pending",
        history=history_json
    )
    db.add(lr)
    
    # Notify department manager if exists
    dept = db.query(models.Department).filter(models.Department.id == user.department_id).first()
    if dept and dept.manager_id:
        notif = models.Notification(
            company_id=user.company_id,
            user_id=dept.manager_id,
            title="New Leave Request",
            message=f"{user.full_name} submitted a request for {duration} day(s) of {data.leave_type} leave.",
            type="info"
        )
        db.add(notif)
        
    # Log Audit
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Applied for {duration} days of {data.leave_type} leave",
        category="Leave",
        type="info"
    ))
    db.commit()
    db.refresh(lr)
    return lr

@app.get("/api/leaves/pending", response_model=List[schemas.LeaveRequestOut])
def get_pending_leaves(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # HR role: sees all leaves currently approved by Manager (awaiting HR approval)
    if user.role == "hr":
        return db.query(models.LeaveRequest).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.LeaveRequest.status == "Manager Approved"
        ).all()
        
    # Manager role: sees pending leaves of employees belonging to their department
    if user.role == "manager":
        # Find managed departments
        dept_ids = [d.id for d in user.managed_departments]
        return db.query(models.LeaveRequest).join(models.User, models.LeaveRequest.user_id == models.User.id).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.LeaveRequest.status == "Pending",
            models.User.department_id.in_(dept_ids)
        ).all()
        
    return []

@app.get("/api/leaves/history", response_model=List[schemas.LeaveRequestOut])
def get_leaves_history(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Employee role: sees only their own requests
    if user.role == "employee":
        return db.query(models.LeaveRequest).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.LeaveRequest.user_id == user.id
        ).order_by(models.LeaveRequest.created_at.desc()).all()
        
    # Manager, HR, Admin: sees all leave requests in company
    return db.query(models.LeaveRequest).filter(
        models.LeaveRequest.company_id == user.company_id
    ).order_by(models.LeaveRequest.created_at.desc()).all()

@app.post("/api/leaves/{lr_id}/approve", response_model=schemas.LeaveRequestOut)
def approve_leave(lr_id: int, data: schemas.LeaveRequestUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    lr = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == lr_id,
        models.LeaveRequest.company_id == user.company_id
    ).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Manager Approval
    if user.role == "manager":
        if lr.status != "Pending":
            raise HTTPException(status_code=400, detail="Request is already approved or rejected.")
        lr.status = "Manager Approved"
        lr.manager_comment = data.comment
        
        # Append history
        h = list(lr.history)
        h.append({
            "stage": "Manager Review",
            "actorName": user.full_name,
            "action": "Approved",
            "timestamp": now_str,
            "comment": data.comment
        })
        lr.history = h
        
        # Notify HR
        hr_users = db.query(models.User).filter(
            models.User.company_id == user.company_id,
            models.User.role == "hr"
        ).all()
        for hr_u in hr_users:
            db.add(models.Notification(
                company_id=user.company_id,
                user_id=hr_u.id,
                title="Leave Ready for HR",
                message=f"Leave request for {lr.user.full_name} approved by manager and needs HR sign-off.",
                type="warning"
            ))
            
        # Notify Employee
        db.add(models.Notification(
            company_id=user.company_id,
            user_id=lr.user_id,
            title="Manager Approved Leave",
            message=f"Your request has been approved by {user.full_name} and is awaiting HR finalized audit.",
            type="info"
        ))

    # HR Final Approval
    elif user.role == "hr":
        if lr.status != "Manager Approved" and lr.status != "Pending": # In case manager bypassed
            raise HTTPException(status_code=400, detail="Final approval requires prior Manager approval.")
        lr.status = "Approved"
        lr.hr_comment = data.comment
        lr.approved_by_id = user.id
        lr.approved_at = datetime.datetime.utcnow()
        
        # Append history
        h = list(lr.history)
        h.append({
            "stage": "HR Review",
            "actorName": user.full_name,
            "action": "Approved",
            "timestamp": now_str,
            "comment": data.comment
        })
        lr.history = h
        
        # Deduct leave balance of the target employee
        emp = db.query(models.User).filter(models.User.id == lr.user_id).first()
        if emp:
            if lr.leave_type == "Annual":
                emp.earned_leave = max(0, emp.earned_leave - lr.duration_days)
            elif lr.leave_type == "Sick":
                emp.medical_leave = max(0, emp.medical_leave - lr.duration_days)
            elif lr.leave_type in ["Personal", "Maternity/Paternity"]:
                emp.casual_leave = max(0, emp.casual_leave - lr.duration_days)
            else:
                emp.loss_of_pay += lr.duration_days
                
            emp.status = "On Leave"  # Flag status representation

        # Deduct in LeaveBalance table
        balance_record = db.query(models.LeaveBalance).filter(
            models.LeaveBalance.user_id == lr.user_id,
            models.LeaveBalance.leave_type == lr.leave_type
        ).first()
        if balance_record:
            balance_record.used_days += lr.duration_days
        elif lr.leave_type != 'Unpaid':
            new_bal = models.LeaveBalance(
                company_id=lr.company_id,
                user_id=lr.user_id,
                leave_type=lr.leave_type,
                allowed_days=15 if lr.leave_type == 'Annual' else (10 if lr.leave_type == 'Sick' else 12),
                used_days=lr.duration_days
            )
            db.add(new_bal)


        # Notify Employee
        db.add(models.Notification(
            company_id=user.company_id,
            user_id=lr.user_id,
            title="Leave Fully Approved",
            message=f"Your leave request has been officially approved. Balances adjusted.",
            type="success"
        ))

    else:
        raise HTTPException(status_code=403, detail="Unauthorized action for your role.")
        
    # Log Audit
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Approved Leave request {lr.id} ({lr.status})",
        category="Leave",
        type="success"
    ))
    db.commit()
    return lr

@app.post("/api/leaves/{lr_id}/reject", response_model=schemas.LeaveRequestOut)
def reject_leave(lr_id: int, data: schemas.LeaveRequestUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    lr = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == lr_id,
        models.LeaveRequest.company_id == user.company_id
    ).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    lr.status = "Rejected"
    
    if user.role == "manager":
        lr.manager_comment = data.comment
        stage_str = "Manager Review"
    elif user.role == "hr":
        lr.hr_comment = data.comment
        stage_str = "HR Review"
    else:
        raise HTTPException(status_code=403, detail="Unauthorized action for your role.")
        
    h = list(lr.history)
    h.append({
        "stage": stage_str,
        "actorName": user.full_name,
        "action": "Rejected",
        "timestamp": now_str,
        "comment": data.comment
    })
    lr.history = h
    
    # Notify Employee
    db.add(models.Notification(
        company_id=user.company_id,
        user_id=lr.user_id,
        title="Leave Request Rejected",
        message=f"Your request was rejected. Reason: {data.comment or 'None'}",
        type="danger"
    ))
    
    # Log Audit
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Rejected Leave request {lr.id}",
        category="Leave",
        type="danger"
    ))
    
    db.commit()
    return lr


# ==========================================
# NOTIFICATIONS ENDPOINTS
# ==========================================

@app.get("/api/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(
        models.Notification.company_id == user.company_id,
        models.Notification.user_id == user.id
    ).order_by(models.Notification.created_at.desc()).all()

@app.post("/api/notifications/read")
def read_notifications(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.company_id == user.company_id,
        models.Notification.user_id == user.id
    ).update({"read": True})
    db.commit()
    return {"message": "Notifications marked as read."}

@app.post("/api/notifications/clear")
def clear_notifications(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.company_id == user.company_id,
        models.Notification.user_id == user.id
    ).delete()
    db.commit()
    return {"message": "Notifications cleared."}


# ==========================================
# SETTINGS & DEPARTMENTS
# ==========================================

@app.get("/api/settings", response_model=schemas.CompanySettingsOut)
def get_settings(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    settings = db.query(models.CompanySettings).filter(models.CompanySettings.company_id == user.company_id).first()
    if not settings:
        settings = models.CompanySettings(company_id=user.company_id, holiday_calendar=[])
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/api/settings", response_model=schemas.CompanySettingsOut)
def update_settings(data: schemas.CompanySettingsUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["hr", "admin"]:
        raise HTTPException(status_code=403, detail="Only HR and Admin can update company settings.")
        
    settings = db.query(models.CompanySettings).filter(models.CompanySettings.company_id == user.company_id).first()
    if not settings:
        settings = models.CompanySettings(company_id=user.company_id, holiday_calendar=data.holiday_calendar)
        db.add(settings)
    else:
        settings.holiday_calendar = data.holiday_calendar
        
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description="Updated holiday calendar settings",
        category="Settings",
        type="info"
    ))
    db.commit()
    db.refresh(settings)
    return settings

@app.get("/api/departments", response_model=List[schemas.DepartmentOut])
def get_departments(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Department).filter(models.Department.company_id == user.company_id).all()

@app.post("/api/departments", response_model=schemas.DepartmentOut)
def create_department(data: schemas.DepartmentCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["hr", "admin"]:
        raise HTTPException(status_code=403, detail="Only HR and Admin can create departments.")
        
    dept = models.Department(
        company_id=user.company_id,
        name=data.name,
        code=data.code,
        manager_id=data.manager_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


# ==========================================
# ANALYTICS & AUDIT LEDGER ENDPOINTS
# ==========================================

@app.get("/api/analytics/kpis", response_model=schemas.DashboardStats)
def get_dashboard_kpis(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. Pending approvals count
    pending_count = 0
    if user.role == "hr":
        pending_count = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.LeaveRequest.status == "Manager Approved"
        ).count()
    elif user.role == "manager":
        dept_ids = [d.id for d in user.managed_departments]
        pending_count = db.query(models.LeaveRequest).join(models.User, models.LeaveRequest.user_id == models.User.id).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.LeaveRequest.status == "Pending",
            models.User.department_id.in_(dept_ids)
        ).count()
        
    # 2. Approved today
    today_approved = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.company_id == user.company_id,
        models.LeaveRequest.status == "Approved",
        models.LeaveRequest.approved_at >= datetime.datetime.utcnow().date()
    ).count()
    
    # 3. Total employees
    total_emps = db.query(models.User).filter(models.User.company_id == user.company_id).count()
    
    # 4. Average approval speed dynamically based on approved requests
    approved_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.company_id == user.company_id,
        models.LeaveRequest.status == "Approved",
        models.LeaveRequest.approved_at.isnot(None)
    ).all()
    
    if len(approved_leaves) > 0:
        total_hours = 0.0
        for al in approved_leaves:
            diff = al.approved_at - al.created_at
            total_hours += diff.total_seconds() / 3600.0
        avg_speed = round(total_hours / len(approved_leaves), 1)
    else:
        avg_speed = 0.0
        
    # 5. User leave balance total
    balance = user.earned_leave + user.medical_leave + user.casual_leave
    
    return {
        "pending_approvals": pending_count,
        "approved_today": today_approved,
        "total_employees": total_emps,
        "avg_approval_speed_hours": avg_speed,
        "leave_balance": balance
    }

@app.get("/api/analytics/charts", response_model=schemas.AnalyticsSummary)
def get_analytics_charts(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Scoped leaves
    leaves_query = db.query(models.LeaveRequest).filter(models.LeaveRequest.company_id == user.company_id)
    if user.role == "employee":
        leaves_query = leaves_query.filter(models.LeaveRequest.user_id == user.id)
    elif user.role == "manager":
        # Scoped to department
        dept_ids = [d.id for d in user.managed_departments]
        leaves_query = leaves_query.join(models.User, models.LeaveRequest.user_id == models.User.id).filter(
            models.User.department_id.in_(dept_ids)
        )
    leaves = leaves_query.all()
    
    # 1. Leave Type distribution
    type_counts = {"Annual": 0, "Sick": 0, "Personal": 0, "Maternity/Paternity": 0, "Unpaid": 0}
    for l in leaves:
        if l.leave_type in type_counts:
            type_counts[l.leave_type] += 1
            
    type_dist = [
        schemas.ChartDataPoint(label="Annual Paid", value=type_counts["Annual"], color="var(--primary-blue)"),
        schemas.ChartDataPoint(label="Medical Sick", value=type_counts["Sick"], color="var(--danger)"),
        schemas.ChartDataPoint(label="Personal Off", value=type_counts["Personal"], color="var(--warning)"),
        schemas.ChartDataPoint(label="Parental", value=type_counts["Maternity/Paternity"], color="#8B5CF6"),
        schemas.ChartDataPoint(label="Unpaid Off", value=type_counts["Unpaid"], color="var(--text-light)")
    ]
    
    # 2. Status breakdown
    status_counts = {"Pending": 0, "Manager Approved": 0, "Approved": 0, "Rejected": 0}
    for l in leaves:
        if l.status in status_counts:
            status_counts[l.status] += 1
            
    status_dist = [
        schemas.ChartDataPoint(label="Awaiting Manager", value=status_counts["Pending"], color="var(--warning)"),
        schemas.ChartDataPoint(label="Awaiting HR", value=status_counts["Manager Approved"], color="#8B5CF6"),
        schemas.ChartDataPoint(label="Fully Approved", value=status_counts["Approved"], color="var(--success)"),
        schemas.ChartDataPoint(label="Rejected", value=status_counts["Rejected"], color="var(--danger)")
    ]
    
    # 3. Monthly trend (last 4 months) dynamically grouped
    today = datetime.date.today()
    trend = []
    for i in range(3, -1, -1):
        m_date = today - datetime.timedelta(days=i*30)
        m_label = m_date.strftime("%b")
        m_num = m_date.month
        m_year = m_date.year
        
        cnt = 0
        for l in leaves:
            if l.start_date.month == m_num and l.start_date.year == m_year:
                cnt += 1
        trend.append(schemas.ChartDataPoint(label=m_label, value=cnt, color="var(--primary-blue)"))
        
    # 4. Department volumes
    depts = db.query(models.Department).filter(models.Department.company_id == user.company_id).all()
    dept_dist = []
    for d in depts:
        count = db.query(models.LeaveRequest).join(models.User, models.LeaveRequest.user_id == models.User.id).filter(
            models.LeaveRequest.company_id == user.company_id,
            models.User.department_id == d.id
        ).count()
        dept_dist.append(schemas.ChartDataPoint(label=d.name, value=count, color="var(--primary-blue)"))
        
    return {
        "leave_type_distribution": type_dist,
        "status_breakdown": status_dist,
        "monthly_trend": trend,
        "department_volumes": dept_dist
    }

@app.get("/api/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Returns last 100 system audit logs (isolated by tenant company)
    return db.query(models.AuditLog).filter(
        models.AuditLog.company_id == user.company_id
    ).order_by(models.AuditLog.created_at.desc()).limit(100).all()


@app.get("/api/public/companies", response_model=List[schemas.CompanyOut])
def get_public_companies(db: Session = Depends(get_db)):
    return db.query(models.Company).all()


@app.put("/api/companies/profile", response_model=schemas.CompanyOut)
def update_company_profile(data: schemas.CompanyUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Company Admin can update company profile.")
    company = db.query(models.Company).filter(models.Company.id == user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(company, key, value)
    
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description="Updated company profile settings",
        category="Settings",
        type="info"
    ))
    db.commit()
    db.refresh(company)
    return company


@app.post("/api/employees", response_model=schemas.UserOut)
def add_employee(data: schemas.UserCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Company Admin can add employees.")
    
    # Check duplicates
    existing_username = db.query(models.User).filter(models.User.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")
    existing_email = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = auth.get_password_hash(data.password)
    user_dict = data.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    user_dict["company_id"] = user.company_id
    
    # Auto generate employee ID if missing
    if not user_dict.get("employee_id") or len(user_dict.get("employee_id").strip()) == 0:
        count = db.query(models.User).filter(models.User.company_id == user.company_id).count()
        user_dict["employee_id"] = f"EMP-{user.company_id}-{count + 1:03d}"
        
    new_user = models.User(**user_dict)
    db.add(new_user)
    db.flush()
    
    # Create leave balances
    balances = [
        models.LeaveBalance(company_id=user.company_id, user_id=new_user.id, leave_type='Annual', allowed_days=15, used_days=0),
        models.LeaveBalance(company_id=user.company_id, user_id=new_user.id, leave_type='Sick', allowed_days=10, used_days=0),
        models.LeaveBalance(company_id=user.company_id, user_id=new_user.id, leave_type='Personal', allowed_days=12, used_days=0),
        models.LeaveBalance(company_id=user.company_id, user_id=new_user.id, leave_type='Maternity/Paternity', allowed_days=12, used_days=0)
    ]
    db.add_all(balances)
    
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Admin added new employee {new_user.full_name} ({new_user.role})",
        category="Auth",
        type="success"
    ))
    db.commit()
    db.refresh(new_user)
    return new_user


@app.put("/api/employees/{emp_id}", response_model=schemas.UserOut)
def edit_employee(emp_id: int, data: schemas.UserCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Company Admin can edit employee profiles.")
    
    emp = db.query(models.User).filter(models.User.id == emp_id, models.User.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    
    # Check email / username duplicates
    if data.username != emp.username:
        existing_username = db.query(models.User).filter(models.User.username == data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken.")
        emp.username = data.username
        
    if data.email != emp.email:
        existing_email = db.query(models.User).filter(models.User.email == data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered.")
        emp.email = data.email
    
    emp.full_name = data.full_name
    emp.phone = data.phone
    emp.department_id = data.department_id
    emp.designation = data.designation
    emp.role = data.role
    if data.avatar:
        emp.avatar = data.avatar
        
    if data.password and len(data.password.strip()) > 0:
        emp.hashed_password = auth.get_password_hash(data.password)
        
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Admin updated profile of employee {emp.full_name}",
        category="Auth",
        type="info"
    ))
    db.commit()
    db.refresh(emp)
    return emp


@app.post("/api/employees/{emp_id}/deactivate", response_model=schemas.UserOut)
def deactivate_employee(emp_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Company Admin can deactivate employees.")
    
    emp = db.query(models.User).filter(models.User.id == emp_id, models.User.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    
    emp.status = "Suspended"
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Admin deactivated employee {emp.full_name} (Status: Suspended)",
        category="Auth",
        type="warning"
    ))
    db.commit()
    db.refresh(emp)
    return emp


@app.post("/api/reports", response_model=schemas.ReportOut)
def save_report(data: schemas.ReportCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    report = models.Report(
        company_id=user.company_id,
        name=data.name,
        report_type=data.report_type,
        format=data.format,
        data=data.data,
        created_at=datetime.datetime.utcnow()
    )
    db.add(report)
    db.add(models.AuditLog(
        company_id=user.company_id,
        user_id=user.id,
        actor_name=user.full_name,
        description=f"Generated and saved {data.report_type} report ({data.format})",
        category="Settings",
        type="success"
    ))
    db.commit()
    db.refresh(report)
    return report


@app.get("/api/reports", response_model=List[schemas.ReportOut])
def get_reports(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Report).filter(models.Report.company_id == user.company_id).order_by(models.Report.created_at.desc()).all()

