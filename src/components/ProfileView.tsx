import React, { useState, useRef } from 'react';
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
    <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 0 }}>
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

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile } = useApp();

  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    const success = await updateUserProfile({
      phone: phone || null,
      password: password || null,
      avatar: avatar || null
    });
    setSubmitting(false);

    if (success) {
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0 2rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>My Profile</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Manage your personal details, secure your password, and customize your avatar.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Profile Preview Card */}
        <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
          <img
            src={avatar || currentUser.avatar}
            alt={currentUser.name}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--primary-blue)',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{currentUser.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 500, marginTop: '0.1rem' }}>{currentUser.role}</p>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              marginTop: '0.5rem'
            }}>
              {currentUser.status}
            </span>
          </div>

          <div style={{
            width: '100%',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            fontSize: '0.82rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Employee ID</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Email</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Department</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Leave Balance</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{currentUser.leaveBalance} Days</span>
            </div>
          </div>
        </div>

        {/* Right Side: Profile Edit Form */}
        <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Edit Account Details</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <ImageCaptureInput 
                  label="Profile Picture (Upload or Live Capture)" 
                  value={avatar} 
                  onChange={setAvatar} 
                  showCamera={true} 
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Verify new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.75rem 2.5rem', borderRadius: 'var(--radius-md)' }}
              >
                {submitting ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
