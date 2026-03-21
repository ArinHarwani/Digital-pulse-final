export interface MedicalRecord {
    id: string;
    type: string;
    date: string;
    title: string;
    summary: string;
}

export interface Patient {
    email: string;
    uniqueKey: string;
    name: string;
    phone: string;
    age: number;
    bloodType: string;
    medicalConditions: string[];
    records: MedicalRecord[];
}

export const dummyPatients: Record<string, Patient> = {
    'DEMO-001': {
        email: 'john.doe@example.com',
        phone: '+1 555-0101',
        uniqueKey: 'DEMO-001',
        name: 'John Doe',
        age: 45,
        bloodType: 'O+',
        medicalConditions: ['Hypertension', 'Diabetes'],
        records: [
            {
                id: 'rec-1',
                type: 'Lab Result',
                date: '2026-02-15',
                title: 'Comprehensive Metabolic Panel',
                summary: 'Fasting glucose slightly elevated at 105 mg/dL. All other values within normal reference ranges. Liver enzymes normal.'
            },
            {
                id: 'rec-2',
                type: 'Prescription',
                date: '2026-01-10',
                title: 'Lisinopril 10mg',
                summary: 'To be taken once daily in the morning to manage blood pressure.'
            }
        ]
    },
    'DEMO-002': {
        email: 'sarah.smith@example.com',
        phone: '+1 555-0202',
        uniqueKey: 'DEMO-002',
        name: 'Sarah Smith',
        age: 32,
        bloodType: 'A-',
        medicalConditions: ['Asthma'],
        records: [
            {
                id: 'rec-3',
                type: 'Imaging',
                date: '2026-03-01',
                title: 'Chest X-Ray',
                summary: 'Lungs are clear. No acute cardiopulmonary disease. Heart size normal.'
            }
        ]
    },
    'DEMO-003': {
        email: 'michael.j@example.com',
        phone: '+1 555-0303',
        uniqueKey: 'DEMO-003',
        name: 'Michael Johnson',
        age: 58,
        bloodType: 'B+',
        medicalConditions: ['Cardiac History', 'Hypertension'],
        records: [
            {
                id: 'rec-4',
                type: 'Consultation',
                date: '2026-02-28',
                title: 'Cardiology Follow-up',
                summary: 'Patient reports mild shortness of breath during heavy exertion. Echocardiogram recommended.'
            },
            {
                id: 'rec-5',
                type: 'Lab Result',
                date: '2026-01-20',
                title: 'Lipid Panel',
                summary: 'LDL 140 mg/dL (High). HDL 45 mg/dL. Total cholesterol 210 mg/dL. Statin therapy discussed.'
            }
        ]
    }
};
