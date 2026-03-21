'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { dummyPatients } from '@/data/dummy';

interface ProfileData {
    uniqueKey: string;
    name: string;
    email: string;
    phone: string;
    age: number;
    bloodType: string;
    medicalConditions: string[];
}

const CONDITION_COLORS: Record<string, string> = {
    'Diabetes': '#ef4444',
    'Thyroid Disorder': '#8b5cf6',
    'Hypertension': '#f97316',
    'Asthma': '#06b6d4',
    'Cardiac History': '#ec4899',
};

function getConditionColor(condition: string): string {
    return CONDITION_COLORS[condition] || '#3b82f6';
}

function PatientProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const key = searchParams.get('key') || '';

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            if (!key) { setIsLoading(false); return; }

            // 1. Try Supabase
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('unique_key', key)
                    .maybeSingle();

                if (data && !error) {
                    setProfile({
                        uniqueKey: data.unique_key,
                        name: data.name || key,
                        email: data.email || '',
                        phone: data.phone_number || '',
                        age: data.age || 0,
                        bloodType: data.blood_type || 'Unknown',
                        medicalConditions: data.medical_conditions || [],
                    });
                    setIsLoading(false);
                    return;
                }
            } catch { /* fall through */ }

            // 2. Try localStorage (offline-registered patients)
            const localData = localStorage.getItem(`patient_${key}`);
            if (localData) {
                try {
                    const p = JSON.parse(localData);
                    setProfile({
                        uniqueKey: key,
                        name: p.name || key,
                        email: p.email || '',
                        phone: p.phone || '',
                        age: p.age || 0,
                        bloodType: p.bloodType || 'Unknown',
                        medicalConditions: p.medicalConditions || [],
                    });
                    setIsLoading(false);
                    return;
                } catch { /* fall through */ }
            }

            // 3. Try dummy data
            if (dummyPatients[key]) {
                const d = dummyPatients[key];
                setProfile({
                    uniqueKey: key,
                    name: d.name,
                    email: d.email,
                    phone: d.phone,
                    age: d.age,
                    bloodType: d.bloodType,
                    medicalConditions: d.medicalConditions,
                });
                setIsLoading(false);
                return;
            }

            // 4. Not found
            setProfile(null);
            setIsLoading(false);
        }

        loadProfile();
    }, [key]);

    const sectionCard: React.CSSProperties = {
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    };

    const fieldRow: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border)',
    };

    return (
        <div className="app-container">
            <Header />
            <main style={{ flex: 1, padding: '24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

                {/* Back Button */}
                <button
                    onClick={() => router.push(`/dashboard?key=${key}`)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-primary)', fontSize: '14px', fontWeight: '600',
                        marginBottom: '20px', padding: '6px 0',
                    }}
                >
                    ← Back to Dashboard
                </button>

                <h1 className="font-bold" style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--color-primary)' }}>
                    Patient Profile
                </h1>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{
                            width: '40px', height: '40px', border: '4px solid var(--color-border)',
                            borderTopColor: 'var(--color-primary)', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                        }} />
                        <p className="text-muted">Loading patient profile...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Not Found */}
                {!isLoading && !profile && (
                    <div style={{ ...sectionCard, textAlign: 'center', padding: '48px' }}>
                        <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
                        <p className="font-bold" style={{ fontSize: '18px' }}>Patient not found</p>
                        <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                            No profile found for key <strong>{key}</strong>
                        </p>
                    </div>
                )}

                {/* Profile Content */}
                {!isLoading && profile && (
                    <>
                        {/* Section 1: Personal Information */}
                        <div style={sectionCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid var(--color-primary)' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--color-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '20px', fontWeight: 'bold', flexShrink: 0,
                                }}>
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-bold" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                                        {profile.name}
                                    </h2>
                                    <p className="text-muted" style={{ fontSize: '13px' }}>Personal Information</p>
                                </div>
                            </div>

                            {[
                                { label: 'Unique Patient Key', value: profile.uniqueKey, mono: true },
                                { label: 'Email', value: profile.email || '—' },
                                { label: 'Phone', value: profile.phone || '—' },
                                { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
                                { label: 'Blood Group', value: profile.bloodType || '—' },
                            ].map((field, i, arr) => (
                                <div key={field.label} style={{ ...fieldRow, borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                    <span className="text-muted" style={{ fontSize: '14px' }}>{field.label}</span>
                                    <span className="font-medium" style={{
                                        fontSize: '14px',
                                        fontFamily: field.mono ? 'monospace' : 'inherit',
                                        background: field.mono ? 'var(--color-background)' : 'transparent',
                                        padding: field.mono ? '2px 8px' : '0',
                                        borderRadius: 'var(--radius-sm)',
                                    }}>
                                        {field.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Section 2: Medical Information */}
                        <div style={sectionCard}>
                            <h3 className="font-bold" style={{ fontSize: '16px', marginBottom: '8px' }}>
                                🏥 Chronic Conditions & Medical History
                            </h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
                                Pre-existing conditions as reported during registration
                            </p>

                            {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {profile.medicalConditions.map(condition => {
                                        const color = getConditionColor(condition);
                                        return (
                                            <div key={condition} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                                                border: `1.5px solid ${color}20`,
                                                background: `${color}12`,
                                            }}>
                                                <span style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: color, flexShrink: 0,
                                                }} />
                                                <span style={{ fontSize: '14px', fontWeight: '600', color }}>
                                                    {condition}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '24px', textAlign: 'center',
                                    background: 'var(--color-background)', borderRadius: 'var(--radius-md)',
                                    border: '1px dashed var(--color-border)',
                                }}>
                                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>✅</p>
                                    <p className="font-medium" style={{ fontSize: '14px' }}>No pre-existing conditions recorded.</p>
                                    <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                                        This patient reported no chronic conditions at registration.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Footer */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                onClick={() => router.push(`/dashboard?key=${key}`)}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                Go to Dashboard →
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default function PatientProfile() {
    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>}>
            <PatientProfileContent />
        </Suspense>
    );
}
