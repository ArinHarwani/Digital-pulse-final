import React from 'react';
import Link from 'next/link';

export default function Header() {
  // Get patient key from URL or localStorage for passing to the 1st Interface
  const getPatientKey = () => {
    if (typeof window === 'undefined') return '';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('key') || localStorage.getItem('last_active_key') || '';
  };

  const handleSOSClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Scroll to the embedded emergency button on this page
    const btn = document.querySelector('[data-emergency-button]');
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="glass-header" style={{ height: '80px', padding: '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '12px', 
          background: 'linear-gradient(135deg, var(--color-primary), #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
        }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
        </div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="font-bold" style={{ fontSize: '22px', color: 'white', letterSpacing: '-0.5px' }}>
            Digital<span style={{ color: 'var(--color-primary)' }}>Pulse</span>
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <nav style={{ display: 'flex', gap: '32px' }}>
          <Link href="#" style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}>Dashboard</Link>
          <Link href="#" style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}>Health Insights</Link>
        </nav>
        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', margin: 0 }}>Arin Harwani</p>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', margin: 0 }}>Premium Member</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: 'full', background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Arin" alt="avatar" />
          </div>
        </div>
      </div>
    </header>
  );
}

