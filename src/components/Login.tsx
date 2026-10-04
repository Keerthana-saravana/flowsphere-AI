import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface ImageCaptureInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  showCamera?: boolean;
}

const ImageCaptureInput: React.FC<ImageCaptureInputProps> = ({ label, value, onChange, showCamera = true }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (err) {
      alert("Could not access camera. Please verify permissions or upload a file instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onChange(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {value ? (
          <img 
            src={value} 
            alt="Preview" 
            style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 600 }}>
            No Image
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: '8px', margin: 0 }}>
              Upload Image
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {showCamera && (
              <button 
                type="button" 
                onClick={isCameraActive ? stopCamera : startCamera}
                className="btn btn-outline"
                style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: '8px' }}
              >
                {isCameraActive ? 'Close Camera' : 'Use Camera'}
              </button>
            )}
          </div>
          {value && (
            <button 
              type="button" 
              onClick={() => onChange('')} 
              style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              Clear Image
            </button>
          )}
        </div>
      </div>

      {isCameraActive && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: '#FAFDFF' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#000000', transform: 'scaleX(-1)' }} 
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={capturePhoto} 
              className="btn btn-primary"
              style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Capture Frame
            </button>
            <button 
              type="button" 
              onClick={stopCamera} 
              className="btn btn-outline"
              style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Login: React.FC = () => {
  const { login, registerCompany, registerEmployee, setCurrentView, loginViewState: viewState, setLoginViewState: setViewState } = useApp();
  
  // Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Company Registration Fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [country, setCountry] = useState('United States');
  const [stateName, setStateName] = useState('California');
  const [cityName, setCityName] = useState('San Francisco');
  const [numEmployees, setNumEmployees] = useState(10);
  const [companyLogo, setCompanyLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100');

  // Employee Registration Fields
  const [createdCompanyId, setCreatedCompanyId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empRole, setEmpRole] = useState<'Employee' | 'Manager' | 'HR' | 'Company Admin'>('HR');
  const [profilePicture, setProfilePicture] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');

  const [availableDepartments, setAvailableDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/public/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (e) {
      console.error("Failed to fetch companies", e);
    }
  };

  const fetchCompanyDepartments = async (companyId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/public/companies/${companyId}/departments`);
      if (res.ok) {
        const data = await res.json();
        setAvailableDepartments(data);
        if (data.length > 0) {
          setSelectedDeptId(String(data[0].id));
        } else {
          setSelectedDeptId('');
        }
      }
    } catch (e) {
      console.error("Failed to fetch departments", e);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [viewState]);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("fs_created_company_id");
    if (storedCompanyId && viewState === 'employee-reg') {
      const cid = Number(storedCompanyId);
      setCreatedCompanyId(cid);
      fetchCompanyDepartments(cid);
    } else if (createdCompanyId && viewState === 'employee-reg') {
      fetchCompanyDepartments(createdCompanyId);
    }
  }, [viewState, createdCompanyId]);

  useEffect(() => {
    if (viewState === 'employee-signup' && selectedCompanyId) {
      fetchCompanyDepartments(Number(selectedCompanyId));
    }
  }, [viewState, selectedCompanyId]);



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      alert("Company Name is required.");
      return;
    }
    try {
      const companyId = await registerCompany({
        name: companyName,
        industry,
        email: companyEmail || undefined,
        phone: companyPhone || undefined,
        address: companyAddress || undefined,
        country,
        state: stateName,
        city: cityName,
        num_employees: Number(numEmployees),
        logo_url: companyLogo
      });
      setCreatedCompanyId(companyId);
      localStorage.setItem("fs_created_company_id", String(companyId));
      await fetchCompanyDepartments(companyId);
      setViewState('employee-reg');
    } catch (err) {}
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !employeeId || !empEmail || !empPassword) {
      alert("Please fill in all required fields.");
      return;
    }
    if (empPassword !== empConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    const targetCompanyId = createdCompanyId || Number(localStorage.getItem("fs_created_company_id"));
    if (!targetCompanyId) {
      alert("Company registration missing.");
      return;
    }

    const success = await registerEmployee({
      full_name: fullName,
      username: username,
      employee_id: employeeId,
      email: empEmail,
      phone: empPhone || undefined,
      password: empPassword,
      department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
      designation: empDesignation || (empRole === 'Company Admin' ? 'Company Admin' : empRole),
      role: empRole === 'Company Admin' ? 'admin' : empRole.toLowerCase(),
      avatar: profilePicture
    }, targetCompanyId);

    if (success) {
      localStorage.removeItem("fs_created_company_id");
      // Auto login the new user
      await login(empEmail, empPassword);
    }
  };

  const handleEmployeeSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      alert("Please select your company.");
      return;
    }
    if (!fullName || !username || !empEmail || !empPassword) {
      alert("Please fill in all required fields.");
      return;
    }
    if (empPassword !== empConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const companyIdNum = Number(selectedCompanyId);
    
    // Auto-generate employee ID if not provided
    const empId = employeeId || `EMP-${companyIdNum}-${Date.now().toString().slice(-4)}`;

    const success = await registerEmployee({
      full_name: fullName,
      username: username,
      employee_id: empId,
      email: empEmail,
      phone: empPhone || undefined,
      password: empPassword,
      department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
      designation: empDesignation || empRole,
      role: empRole === 'Company Admin' ? 'admin' : empRole.toLowerCase(),
      avatar: profilePicture
    }, companyIdNum);

    if (success) {
      // Auto login the new user
      await login(empEmail, empPassword);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      {/* Background shape blur */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,246,255,0.7) 0%, rgba(245,251,255,0) 70%)',
        zIndex: -1
      }}></div>

      <div className="animate-scale-up" style={{
        width: '100%',
        maxWidth: '550px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        minHeight: '600px',
        transition: 'max-width 0.3s ease'
      }}>
        
        {/* 2. SIGN IN FORM */}
        {viewState === 'login' && (
          <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>FlowSphere AI</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)' }}>Sign In to Workspace</h3>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label>Company Name / Company Email or Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="company email, username, or work email"
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <label style={{ margin: 0 }}>Password</label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Remember this device
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', width: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                Access Workspace
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Need a workspace? </span>
                <button
                  type="button"
                  onClick={() => setViewState('company-reg')}
                  style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 600 }}
                >
                  Register Company
                </button>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Joining an existing company? </span>
                <button
                  type="button"
                  onClick={() => setViewState('employee-signup')}
                  style={{ fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 600 }}
                >
                  Employee Sign Up
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('landing')}
              style={{ fontSize: '0.82rem', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}
            >
              Back to Landing Page
            </button>
          </div>
        )}

        {/* 3. COMPANY REGISTRATION VIEW */}
        {viewState === 'company-reg' && (
          <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Register New Company</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Create isolated multi-tenant organization directory workspaces instantly.
              </p>
            </div>

            <form onSubmit={handleCompanySubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)}>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Employees</label>
                <input
                  type="number"
                  value={numEmployees}
                  onChange={e => setNumEmployees(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label>Company Email</label>
                <input
                  type="email"
                  placeholder="info@company.com"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Company Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 012-3456"
                  value={companyPhone}
                  onChange={e => setCompanyPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Address</label>
                <input
                  type="text"
                  placeholder="123 Corporate St"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input type="text" value={country} onChange={e => setCountry(e.target.value)} />
              </div>

              <div className="form-group">
                <label>State</label>
                <input type="text" value={stateName} onChange={e => setStateName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>City</label>
                <input type="text" value={cityName} onChange={e => setCityName(e.target.value)} />
              </div>

              <ImageCaptureInput 
                label="Company Logo" 
                value={companyLogo} 
                onChange={setCompanyLogo} 
                showCamera={false} 
              />

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setViewState('login')}
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}
                >
                  Already registered? Sign In
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. EMPLOYEE/HR REGISTRATION VIEW (TRIGGERED AFTER COMPANY REGISTRATION) */}
        {viewState === 'employee-reg' && (
          <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Step 2 of 2
              </span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                Create Administrator Profile
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Setup initial user account to configure calendars and manage workspace employees.
              </p>
            </div>

            <form onSubmit={handleEmployeeSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. janedoe"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Employee ID String</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-101"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  placeholder="jane.doe@company.com"
                  value={empEmail}
                  onChange={e => setEmpEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={empPhone}
                  onChange={e => setEmpPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} required>
                  {availableDepartments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {availableDepartments.length === 0 && (
                    <option value="">No departments available</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Director of Operations"
                  value={empDesignation}
                  onChange={e => setEmpDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Administrative Role</label>
                <select value={empRole} onChange={e => setEmpRole(e.target.value as any)}>
                  <option value="Company Admin">Company Admin</option>
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={empPassword}
                  onChange={e => setEmpPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={empConfirmPassword}
                  onChange={e => setEmpConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <ImageCaptureInput 
                label="Profile Picture (Upload or Live Capture)" 
                value={profilePicture} 
                onChange={setProfilePicture} 
                showCamera={true} 
              />

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
                  Complete & Open Dashboard
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. EMPLOYEE SIGNUP VIEW */}
        {viewState === 'employee-signup' && (
          <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Employee Sign Up</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Join your organizational workspace to apply for leave and view dashboard statistics.
              </p>
            </div>

            <form onSubmit={handleEmployeeSignupSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Select Company Workspace</label>
                <select 
                  value={selectedCompanyId} 
                  onChange={e => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- Choose Company --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                  ))}
                </select>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem', display: 'block' }}>Or Enter Company ID Manually</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={selectedCompanyId}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setSelectedCompanyId(val);
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. johnsmith"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Employee ID String (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-105 (autogenerated if blank)"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  placeholder="john.smith@company.com"
                  value={empEmail}
                  onChange={e => setEmpEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={empPhone}
                  onChange={e => setEmpPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} required>
                  {availableDepartments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {availableDepartments.length === 0 && (
                    <option value="">Select company first</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={empDesignation}
                  onChange={e => setEmpDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Select Role</label>
                <select value={empRole} onChange={e => setEmpRole(e.target.value as any)}>
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={empPassword}
                  onChange={e => setEmpPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={empConfirmPassword}
                  onChange={e => setEmpConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <ImageCaptureInput 
                label="Profile Picture (Upload or Live Capture)" 
                value={profilePicture} 
                onChange={setProfilePicture} 
                showCamera={true} 
              />

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setViewState('login')}
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}
                >
                  Already have an account? Sign In
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  Register & Sign In
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
