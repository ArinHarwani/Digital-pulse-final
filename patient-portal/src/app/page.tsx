'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const PRESET_CONDITIONS = [
  'Diabetes',
  'Thyroid Disorder',
  'Hypertension',
  'Asthma',
  'Cardiac History',
];

export default function LoginGateway() {
  const router = useRouter();
  const [step, setStep] = useState<'identify' | 'register' | 'history'>('identify');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [email, setEmail] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');

  // Step 2 — Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relativePhone, setRelativePhone] = useState('');
  const [age, setAge] = useState('');
  const [bloodType, setBloodType] = useState('Unknown');

  // Step 3 — Medical history
  const [checkedConditions, setCheckedConditions] = useState<Record<string, boolean>>(
    Object.fromEntries(PRESET_CONDITIONS.map(c => [c, false]))
  );
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');

  // Step 1: Check if patient already exists
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !uniqueKey) return;
    setIsLoading(true); setError('');

    try {
      // Add a 5-second timeout fallback
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      const query = supabase
        .from('patients')
        .select('unique_key')
        .eq('unique_key', uniqueKey.trim())
        .maybeSingle(); // maybeSingle() returns null (not error) when no row found

      const result = await Promise.race([query, timeout]);

      if (result && 'data' in result && result.data) {
        // Returning patient — go straight to dashboard
        router.push(`/dashboard?key=${uniqueKey.trim()}`);
      } else {
        // New patient or timeout — show registration form
        setIsLoading(false);
        setStep('register');
      }
    } catch {
      setIsLoading(false);
      setStep('register');
    }
  };

  // Step 2: Save personal info, advance to medical history
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { setError('Full name is required.'); return; }
    setError('');
    setStep('history');
  };

  const toggleCondition = (condition: string) => {
    setCheckedConditions(prev => ({ ...prev, [condition]: !prev[condition] }));
  };

  // Step 3: Save everything — localStorage first (guaranteed), Supabase in background
  const handleSaveHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');

    const conditions = [
      ...PRESET_CONDITIONS.filter(c => checkedConditions[c]),
      ...(otherChecked && otherText.trim() ? [otherText.trim()] : []),
    ];

    const patientProfile = {
      unique_key: uniqueKey,
      email,
      name,
      phone,
      relativePhone,
      age: age ? parseInt(age) : 0,
      bloodType,
      medicalConditions: conditions,
    };

    // Always save to localStorage first — instant and guaranteed
    try {
      localStorage.setItem(`patient_${uniqueKey}`, JSON.stringify(patientProfile));
    } catch { /* ignore storage errors */ }

    // Attempt Supabase in background — don't block the user
    supabase.from('patients').upsert([{
      unique_key: uniqueKey,
      email,
      name,
      phone_number: phone,
      relative_phone: relativePhone,
      age: age ? parseInt(age) : 0,
      blood_type: bloodType,
      medical_conditions: conditions,
    }], { onConflict: 'unique_key' }).then(({ error }) => {
      if (error) console.warn('Supabase background save failed (localStorage used):', error.message);
    });

    // Navigate immediately — don't wait for Supabase
    router.push(`/dashboard?key=${uniqueKey}`);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 16px',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '15px', outline: 'none', background: 'var(--color-surface)',
    color: 'var(--color-text-main)', fontFamily: 'inherit',
    boxSizing: 'border-box', marginTop: '6px',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '600',
    color: 'var(--color-text-muted)', marginBottom: '2px',
  };
  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', transition: 'background 0.15s',
    border: '1px solid var(--color-border)', marginBottom: '8px',
  };

  return (
    <div className="app-container">
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', justifyContent: 'center' }}>
        <div className="clinical-card" style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>

          {/* STEP INDICATOR */}
          {step !== 'identify' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              {(['register', 'history'] as const).map((s, i) => (
                <div key={s} style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold',
                  background: step === s ? 'var(--color-primary)' : (
                    (step === 'history' && s === 'register') ? 'var(--color-secondary)' : 'var(--color-border)'
                  ),
                  color: step === s || (step === 'history' && s === 'register') ? 'white' : 'var(--color-text-muted)',
                }}>
                  {step === 'history' && s === 'register' ? '✓' : i + 1}
                </div>
              ))}
            </div>
          )}

          {/* STEP 1 — IDENTIFY */}
          {step === 'identify' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Welcome to Digital Pulse
                </h1>
                <p className="text-muted" style={{ fontSize: '14px' }}>Enter your credentials to access your health records</p>
              </div>
              <form onSubmit={handleIdentify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" style={inputStyle} placeholder="patient@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Unique Key</label>
                  <input type="text" style={inputStyle} placeholder="e.g. DEMO-001 or your personal key"
                    value={uniqueKey} onChange={e => setUniqueKey(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={isLoading}>
                  {isLoading ? 'Checking Records...' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 — PERSONAL INFO */}
          {step === 'register' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>👤</div>
                <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                  Personal Information
                </h1>
                <p className="text-muted" style={{ fontSize: '13px' }}>
                  Key <strong style={{ color: 'var(--color-text-main)' }}>{uniqueKey}</strong> — Step 1 of 2
                </p>
              </div>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" style={inputStyle} placeholder="e.g. Arin Harwani"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Patient Phone</label>
                    <input type="tel" style={inputStyle} placeholder="+91 98765 43210"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Relative's Phone</label>
                    <input type="tel" style={inputStyle} placeholder="+91 99999 88888"
                      value={relativePhone} onChange={e => setRelativePhone(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Age</label>
                    <input type="number" style={inputStyle} placeholder="e.g. 25" min="0" max="120"
                      value={age} onChange={e => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Blood Type</label>
                    <select style={{ ...inputStyle }} value={bloodType} onChange={e => setBloodType(e.target.value)}>
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p style={{ fontSize: '13px', color: 'var(--color-error)', textAlign: 'center' }}>{error}</p>}
                <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                  Next: Medical History →
                </button>
                <button type="button" onClick={() => setStep('identify')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* STEP 3 — MEDICAL HISTORY */}
          {step === 'history' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🏥</div>
                <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                  Medical History
                </h1>
                <p className="text-muted" style={{ fontSize: '13px' }}>Select your pre-existing conditions (optional)</p>
              </div>
              <form onSubmit={handleSaveHistory}>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                  {PRESET_CONDITIONS.map(condition => (
                    <label key={condition} style={{
                      ...checkboxRowStyle,
                      background: checkedConditions[condition] ? 'var(--color-primary-light)' : 'transparent',
                      borderColor: checkedConditions[condition] ? 'var(--color-primary)' : 'var(--color-border)',
                    }}>
                      <input
                        type="checkbox"
                        checked={checkedConditions[condition]}
                        onChange={() => toggleCondition(condition)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '15px', fontWeight: checkedConditions[condition] ? '600' : '400' }}>
                        {condition}
                      </span>
                    </label>
                  ))}

                  {/* "Other" checkbox */}
                  <label style={{
                    ...checkboxRowStyle,
                    background: otherChecked ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: otherChecked ? 'var(--color-primary)' : 'var(--color-border)',
                    flexDirection: 'column', alignItems: 'flex-start'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <input
                        type="checkbox"
                        checked={otherChecked}
                        onChange={() => setOtherChecked(v => !v)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '15px', fontWeight: otherChecked ? '600' : '400' }}>Other <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--color-text-muted)' }}>(allergy if any)</span></span>
                    </div>
                    {otherChecked && (
                      <input
                        type="text"
                        placeholder="Type your condition here..."
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ ...inputStyle, marginTop: '10px', fontSize: '14px' }}
                        autoFocus
                      />
                    )}
                  </label>
                </div>

                {error && <p style={{ fontSize: '13px', color: 'var(--color-error)', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating Profile...' : '✓ Save Profile & Enter Dashboard'}
                </button>
                <button type="button" onClick={() => setStep('register')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', display: 'block', width: '100%', textAlign: 'center' }}>
                  ← Back to Personal Info
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px' }} className="text-muted">
            <p>Demo keys: <strong>DEMO-001</strong> / <strong>DEMO-002</strong> / <strong>DEMO-003</strong></p>
          </div>
        </div>
      </main>
    </div>
  );
}
