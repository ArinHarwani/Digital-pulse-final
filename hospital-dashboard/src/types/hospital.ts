export type EmergencyType = 'accident' | 'cardiac' | 'maternity' | 'respiratory' | 'other';
export type EmergencySeverity = 'critical' | 'urgent' | 'moderate' | 'stable';
export type AdmissionStatus = 'pending' | 'admitted' | 'referred' | 'stabilized';
export type AmbulanceStatus = 'en_route' | 'arriving_soon' | 'arrived';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  conditions?: string; // Mapped from DB text
  importantInfo?: string; // Critical notes
  medications?: string[];
  emergencyContact?: string;
  abhaId?: string;
  dateOfBirth?: string;
  mobileNumber?: string;
  medassistKey?: string;
  records?: any[];
  medicines?: any[];
}

export interface AbhaPatientRecord {
  abhaId: string;
  name: string;
  bloodGroup: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  mobileNumber: string;
  cardImage?: string; // Path to ABHA card image
  // Health Metrics
  height?: string;
  weight?: string;
  bloodPressure?: string;
  sugarLevel?: string;
  allergies?: string[];
  foodIntolerance?: string;
  energyLevel?: string;
  lastTest?: string;
  recentIssue?: string;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverName: string;
  paramedicName: string;
  contactNumber: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  status: AmbulanceStatus;
}

export interface EmergencyAlert {
  id: string;
  emergencyType: EmergencyType;
  severity: EmergencySeverity;
  patient: Patient;
  ambulance: Ambulance;
  eta: number; // minutes
  createdAt: Date;
  description: string;
  injurySnapshot?: string;
  assignedUnit?: string;
  assignedDoctor?: string;
  notes?: string;
  status: 'incoming' | 'preparing' | 'arrived' | 'admitted';
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  specializations: string[];
  emergencyContact: string;
  bedAvailability: {
    trauma: number;
    cardiac: number;
    maternity: number;
    general: number;
    icu: number;
    emergency: number;
  };
}

export interface EmergencyUnit {
  id: string;
  name: string;
  type: 'trauma' | 'cardiac' | 'maternity' | 'general';
  status: 'available' | 'preparing' | 'occupied';
}
