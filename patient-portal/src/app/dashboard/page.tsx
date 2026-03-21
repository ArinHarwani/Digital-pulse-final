'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Uploader from '@/components/Uploader';
import ExplainerChat from '@/components/ExplainerChat';
import MedicinesPanel from '@/components/MedicinesPanel';
import EmergencyButton from '@/components/EmergencyButton';
import { dummyPatients, Patient, MedicalRecord } from '@/data/dummy';
import { supabase } from '@/lib/supabase';

function DashboardContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get('key') || '';
    const router = useRouter();

    // State to hold the actively displayed patient profile
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [medicines, setMedicines] = useState<any[]>([]);

    useEffect(() => {
        async function fetchPatientData() {
            if (!key) {
                setIsLoading(false);
                return;
            }

            try {
                // First: Attempt to fetch live data from Supabase DB
                const { data: dbPatient, error: dbError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('unique_key', key)
                    .single();

                if (dbPatient && !dbError) {
                    // Fetch associated medical records
                    const { data: dbRecords } = await supabase
                        .from('medical_records')
                        .select('*')
                        .eq('patient_key', key)
                        .order('created_at', { ascending: false });

                    // Map Supabase response to our unified UI interface
                    setPatient({
                        email: dbPatient.email,
                        uniqueKey: dbPatient.unique_key,
                        name: dbPatient.name,
                        phone: dbPatient.phone_number || '',
                        age: dbPatient.age,
                        bloodType: dbPatient.blood_type,
                        medicalConditions: dbPatient.medical_conditions || [],
                        records: dbRecords || []
                    });
                } else {
                    throw new Error("No live DB patient found"); // Trigger the catch block fallback
                }
            } catch (err) {
                // Fallback 2: Check localStorage for patients registered offline
                const localData = localStorage.getItem(`patient_${key}`);
                if (localData) {
                    try {
                        const p = JSON.parse(localData);
                        setPatient({
                            email: p.email || '',
                            uniqueKey: key,
                            name: p.name || key,
                            phone: p.phone || '',
                            age: p.age || 0,
                            bloodType: p.bloodType || 'Unknown',
                            medicalConditions: p.medicalConditions || [],
                            records: []
                        });
                    } catch { /* corrupted data */ }
                }
                // Fallback 3: Hardcoded demo profiles
                else if (dummyPatients[key]) {
                    setPatient(dummyPatients[key]);
                } else {
                    // Fallback 4: Blank template for brand-new keys
                    setPatient({
                        email: 'live.judge@demo.com',
                        uniqueKey: key,
                        name: 'Live Demo Patient',
                        phone: '',
                        age: 0,
                        bloodType: 'Unknown',
                        medicalConditions: [],
                        records: []
                    });
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchPatientData();
    }, [key]);

    // Re-fetch ONLY the medical records after a successful upload, updating UI + Chat context
    const refreshRecords = async () => {
        const { data: freshRecords } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_key', key)
            .order('created_at', { ascending: false });
        if (freshRecords) {
            setPatient(prev => prev ? { ...prev, records: freshRecords } : prev);
        }
    };

    // Delete a single medical record from Supabase and immediately update local state
    const deleteRecord = async (recordId: string) => {
        // Optimistically remove from UI first for instant feedback
        setPatient(prev => prev ? {
            ...prev,
            records: prev.records.filter((r: MedicalRecord) => r.id !== recordId)
        } : prev);

        // Then delete from Supabase (fire and forget for MVP)
        await supabase.from('medical_records').delete().eq('id', recordId);
    };

    // Delete all patient data — records first (FK constraint), then the patient row
    const deletePatient = async () => {
        const confirmed = window.confirm(
            `⚠️ Delete all data for "${patient?.name}" (${key})?\n\nThis will permanently remove all medical records and the patient profile from the database. This cannot be undone.`
        );
        if (!confirmed) return;

        // 1. Delete all medical records for this patient
        await supabase.from('medical_records').delete().eq('patient_key', key);

        // 2. Delete the patient row itself
        await supabase.from('patients').delete().eq('unique_key', key);

        // 3. Redirect back to login / home
        window.location.href = '/';
    };

    // Delete ALL medical records for this patient only (keeps the patient profile)
    const deleteAllRecords = async () => {
        if (!patient || patient.records.length === 0) return;
        const confirmed = window.confirm(
            `⚠️ Delete all ${patient.records.length} record(s) for "${patient.name}"?\n\nThis cannot be undone.`
        );
        if (!confirmed) return;

        await supabase.from('medical_records').delete().eq('patient_key', key);
        setPatient(prev => prev ? { ...prev, records: [] } : prev);
    };

    if (isLoading) {
        return <div className="app-container"><Header /><main style={{ padding: '24px', textAlign: 'center' }}>Loading Patient Profile...</main></div>;
    }

    if (!patient) {
        return <div className="app-container"><Header /><main style={{ padding: '24px', textAlign: 'center' }}>Initialization Error.</main></div>;
    }

    return (
        <div className="app-container">
            <Header />

            <main className="dashboard-grid">
                {/* LEFT COLUMN: Profile, SOS, and Records */}
                <div className="dashboard-column">
                    <div className="clinical-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back,</p>
                            <h2 className="font-bold" style={{ fontSize: '24px', margin: '4px 0' }}>{patient.name}</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => router.push(`/profile?key=${patient.uniqueKey}`)}
                                className="btn-primary"
                                style={{ padding: '8px 16px', width: 'auto', fontSize: '14px' }}
                            >
                                👤 Profile
                            </button>
                            <button
                                onClick={deletePatient}
                                style={{
                                    padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
                                    borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)',
                                    fontSize: '14px', fontWeight: '600', color: 'var(--color-error)'
                                }}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>

                    <EmergencyButton patientKey={patient.uniqueKey} patientName={patient.name} />

                    <section className="clinical-card" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="font-bold" style={{ fontSize: '18px' }}>Medical History</h3>
                            {patient.records.length > 0 && (
                                <button
                                    onClick={deleteAllRecords}
                                    style={{ fontSize: '12px', color: 'var(--color-error)', opacity: 0.8 }}
                                >
                                    Clear History
                                </button>
                            )}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <Uploader uniqueKey={patient.uniqueKey} onUploadComplete={refreshRecords} />
                            <p className="text-muted" style={{ marginTop: '12px', fontSize: '12px', textAlign: 'center' }}>
                                Drag & drop lab reports for instant AI analysis
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {patient.records.length > 0 ? (
                                patient.records.map((record: MedicalRecord) => (
                                    <div key={record.id} style={{ 
                                        padding: '16px', background: 'rgba(255,255,255,0.03)', 
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' 
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                                {record.type}
                                            </span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <span className="text-muted" style={{ fontSize: '11px' }}>{record.date}</span>
                                                <button onClick={() => deleteRecord(record.id)} style={{ color: 'var(--color-error)', fontSize: '12px' }}>✕</button>
                                            </div>
                                        </div>
                                        <h4 className="font-semibold" style={{ fontSize: '15px', color: 'white', marginBottom: '4px' }}>{record.title}</h4>
                                        <p className="text-muted" style={{ fontSize: '13px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{record.summary}</p>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                    <p className="text-muted">No documents uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: AI Chat and Medicines */}
                <div className="dashboard-column">
                    <ExplainerChat
                        patientRecordsContext={patient.records}
                        medicinesContext={medicines}
                    />

                    <MedicinesPanel
                        patientKey={patient.uniqueKey}
                        onMedicinesChange={setMedicines}
                    />
                </div>
            </main>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
