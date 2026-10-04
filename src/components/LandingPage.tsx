import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setCurrentView, setLoginViewState, isAuthenticated } = useApp();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    { title: 'Employee', desc: 'Submits request', color: '#3B82F6' },
    { title: 'Manager', desc: 'Approves structure', color: '#2563EB' },
    { title: 'HR Director', desc: 'Finalizes record', color: '#1D4ED8' },
    { title: 'Database', desc: 'Reduces balance', color: '#10B981' },
    { title: 'Dashboard', desc: 'Visualizes analytics', color: '#8B5CF6' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Header / Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.5rem 5%',
        background: 'rgba(245, 251, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>FlowSphere <span style={{ color: 'var(--primary-blue)' }}>AI</span></span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#features" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}>Features</a>
          <a href="#contact" style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}>Contact</a>
          {isAuthenticated ? (
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="btn btn-outline"
              style={{ padding: '0.6rem 1.4rem', fontWeight: 600, color: 'var(--primary-blue)' }}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button 
                onClick={() => { setLoginViewState('login'); setCurrentView('login'); }}
                style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--primary-blue)', transition: 'color 0.2s' }}
              >
                Login
              </button>
              <button 
                onClick={() => { setLoginViewState('login'); setCurrentView('login'); }}
                className="btn btn-outline"
                style={{ padding: '0.6rem 1.2rem', fontWeight: 600, fontSize: '0.88rem' }}
              >
                Company Login
              </button>
            </>
          )}
          <button 
            onClick={() => { setLoginViewState('employee-signup'); setCurrentView('login'); }}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.4rem' }}
          >
            Employee Register
          </button>
          <button 
            onClick={() => { setLoginViewState('company-reg'); setCurrentView('login'); }}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.4rem' }}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Main Content Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 5% 6rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Left Text Column */}
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', padding: '0.4rem 1rem', background: 'var(--bg-secondary)', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise Workflow Automation</span>
            </div>
            
            <h1 style={{ fontSize: '3.6rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1.5px', color: 'var(--text-main)' }}>
              FlowSphere <span style={{ color: 'var(--primary-blue)' }}>AI</span>
            </h1>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, color: 'var(--primary-blue)', marginTop: '-0.5rem' }}>
              "Automate. Approve. Accelerate."
            </h2>
            
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '560px' }}>
              Digitize leave requests, approvals, purchase workflows, employee processes, and internal operations with a simple, secure, and scalable workflow automation platform.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => { setLoginViewState('company-reg'); setCurrentView('login'); }} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                Get Started
              </button>
              <button 
                onClick={() => {
                  setLoginViewState('company-reg');
                  setCurrentView('login');
                }} 
                className="btn btn-secondary" 
                style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
              >
                Live Demo
              </button>
            </div>
          </div>

          {/* Right Vector Illustration Column */}
          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              width: '100%',
              maxWidth: '520px',
              height: '420px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {/* Dynamic Connecting Lines Background (rendered via HTML/SVG overlay) */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                <path d="M 90,80 L 260,80 L 260,200 L 430,200 L 430,320 L 90,320" fill="none" stroke="#DBEAFE" strokeWidth="3" strokeDasharray="6 4" />
                <path d="M 90,80 L 260,80 L 260,200 L 430,200 L 430,320 L 90,320" fill="none" stroke="var(--primary-blue)" strokeWidth="3" strokeDasharray="12 200" strokeDashoffset="0" style={{ animation: 'flowLine 4s linear infinite' }} />
              </svg>

              <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', justifyContent: 'space-around' }}>
                {steps.map((step, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <div 
                      key={step.title}
                      onMouseEnter={() => setActiveStep(idx)}
                      onMouseLeave={() => setActiveStep(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        transform: isActive ? 'translateX(10px)' : 'none',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default'
                      }}
                    >
                      {/* Step Indicator Ball */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '16px',
                        backgroundColor: isActive ? step.color : 'white',
                        border: `2px solid ${isActive ? step.color : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isActive ? '0 10px 20px -5px ' + step.color : 'var(--shadow-sm)',
                        transition: 'all 0.3s',
                        color: isActive ? 'white' : 'var(--text-main)'
                      }}>
                        {idx === 0 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                        {idx === 1 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                        {idx === 2 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                        {idx === 3 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>}
                        {idx === 4 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>}
                      </div>
                      
                      <div style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: isActive ? 'var(--bg-secondary)' : 'white',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid ' + (isActive ? 'var(--primary-blue)' : 'var(--border-color)'),
                        boxShadow: 'var(--shadow-sm)',
                        flex: 1,
                        transition: 'all 0.3s'
                      }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{step.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics section directly below hero */}
        <div style={{
          marginTop: '6rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '4rem',
          maxWidth: '1280px',
          margin: '6rem auto 0',
          width: '100%'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-blue)', letterSpacing: '-1px' }}>90%</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Reduction in Manual Work</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-blue)', letterSpacing: '-1px' }}>70%</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Faster Approval Process</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-blue)', letterSpacing: '-1px' }}>100%</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>Digital Workflow Tracking</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem 5%',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <span>© {new Date().getFullYear()} FlowSphere AI. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#terms">Terms</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};
