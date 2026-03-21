export interface User {
  id: string;
  name: string;
  phone: string;
  familyPhone?: string;
  abhaLinked: boolean;
  abhaId?: string;
  savedLocations: SavedLocation[];
  profileComplete: boolean;
}

export interface SavedLocation {
  id: string;
  type: 'home' | 'work' | 'frequent';
  label: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

export interface EmergencyType {
  id: string;
  type: 'accident' | 'heart_attack' | 'stroke' | 'maternal' | 'fire' | 'general';
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface Emergency {
  id: string;
  type: EmergencyType['type'];
  status: 'pending' | 'dispatched' | 'en_route' | 'arrived' | 'resolved';
  location: {
    lat: number;
    lng: number;
    address: string;
    accuracy: number;
  };
  createdAt: Date;
  ambulanceId?: string;
  eta?: number;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  hospitalName: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'dispatched' | 'en_route' | 'busy';
  eta?: number;
}

export interface FirstAidMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  mediaUrl?: string;
  options?: string[];
}

export interface VerificationStatus {
  abha: 'pending' | 'verified' | 'skipped' | 'failed';
  gps: 'enabled' | 'disabled' | 'error';
  deviceTrusted: boolean;
}
