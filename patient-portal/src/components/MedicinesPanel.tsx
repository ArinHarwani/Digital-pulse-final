'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
}

interface MedicinesPanelProps {
    patientKey: string;
    onMedicinesChange?: (medicines: Medicine[]) => void;
}

export default function MedicinesPanel({ patientKey, onMedicinesChange }: MedicinesPanelProps) {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Load medicines on mount
    useEffect(() => {
        const fetchMedicines = async () => {
            const { data } = await supabase
                .from('medicines')
                .select('*')
                .eq('patient_key', patientKey)
                .order('created_at', { ascending: true });
            if (data) {
                setMedicines(data);
                onMedicinesChange?.(data);
            }
        };
        fetchMedicines();
    }, [patientKey]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);

        // First ensure patient exists (same FK guard as file upload)
        await supabase.from('patients').upsert([{
            unique_key: patientKey,
            name: `Patient (${patientKey})`,
            email: `${patientKey.toLowerCase()}@medassist.demo`,
            age: 0, blood_type: 'Unknown'
        }], { onConflict: 'unique_key', ignoreDuplicates: true });

        const { data: newMed, error } = await supabase
            .from('medicines')
            .insert([{ patient_key: patientKey, name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim() }])
            .select()
            .single();

        if (newMed && !error) {
            const updated = [...medicines, newMed];
            setMedicines(updated);
            onMedicinesChange?.(updated);
        }

        setName(''); setDosage(''); setFrequency('');
        setIsAdding(false);
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        await supabase.from('medicines').delete().eq('id', id);
        const updated = medicines.filter(m => m.id !== id);
        setMedicines(updated);
        onMedicinesChange?.(updated);
    };

    const inputStyle: React.CSSProperties = {
        padding: '8px 12px', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', fontSize: '14px',
        background: 'var(--color-surface)', outline: 'none', flex: 1,
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 className="font-bold" style={{ fontSize: '18px' }}>Active Medications</h3>
                    <p className="text-muted" style={{ fontSize: '13px' }}>Current prescriptions and supplements</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', width: 'auto', fontSize: '13px' }}
                    >
                        + Add New
                    </button>
                )}
            </div>

            {/* Add Medicine Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="clinical-card" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'var(--color-primary)', padding: '20px', marginBottom: '24px' }}>
                    <p className="font-bold" style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Register Medication</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input className="input-field" style={{ marginBottom: 0 }} placeholder="Medicine name (e.g. Lipitor) *" value={name} onChange={e => setName(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input className="input-field" style={{ marginBottom: 0 }} placeholder="Dosage (e.g. 20mg)" value={dosage} onChange={e => setDosage(e.target.value)} />
                            <input className="input-field" style={{ marginBottom: 0 }} placeholder="Frequency (e.g. Nightly)" value={frequency} onChange={e => setFrequency(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" disabled={isSaving} className="btn-primary" style={{ width: 'auto', flex: 1 }}>
                                {isSaving ? 'Saving...' : 'Confirm Entry'}
                            </button>
                            <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '10px', color: 'white', opacity: 0.6, fontSize: '13px', fontWeight: 'bold' }}>
                                Dismiss
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Medicines List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {medicines.length > 0 ? (
                    medicines.map(med => (
                        <div key={med.id} className="clinical-card" style={{ padding: '16px 20px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                    💊
                                </div>
                                <div>
                                    <p className="font-bold" style={{ fontSize: '16px', color: 'white' }}>{med.name}</p>
                                    <p className="text-muted" style={{ fontSize: '13px' }}>
                                        {med.dosage && <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{med.dosage}</span>}
                                        {med.dosage && med.frequency && ' • '}
                                        {med.frequency}
                                        {!med.dosage && !med.frequency && 'Standard dose'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(med.id)}
                                style={{ color: 'var(--color-error)', opacity: 0.5, transition: 'opacity 0.2s', padding: '8px' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                            >
                                ✕
                            </button>
                        </div>
                    ))
                ) : (
                    !isAdding && (
                        <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                            <p className="text-muted" style={{ fontSize: '14px' }}>No active medications listed.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
