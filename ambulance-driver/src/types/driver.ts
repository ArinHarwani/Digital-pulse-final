export type EmergencyType = 'accident' | 'cardiac' | 'maternal' | 'respiratory' | 'other';

export type TripStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'arrived_pickup'
  | 'transporting'
  | 'reached_hospital';

export interface EmergencyRequest {
  id: string;
  type: EmergencyType;
  patientName?: string;
  patientPhone?: string;
  pickupAddress: string;
  pickupCoordinates: {
    lat: number;
    lng: number;
  };
  hospitalName?: string;
  hospitalAddress?: string;
  emergencyInfo?: string;
  createdAt: Date;
  estimatedDistance?: string;
  estimatedTime?: string;
  hospitalCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface Trip {
  id: string;
  emergency: EmergencyRequest;
  driver: Driver;
  status: TripStatus;
  acceptedAt?: Date;
  arrivedPickupAt?: Date;
  startedTransportAt?: Date;
  completedAt?: Date;
}

export const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  accident: 'Accident',
  cardiac: 'Cardiac Emergency',
  maternal: 'Maternal Emergency',
  respiratory: 'Respiratory',
  other: 'Other Emergency',
};

export const EMERGENCY_ICONS: Record<EmergencyType, string> = {
  accident: '🚗',
  cardiac: '❤️',
  maternal: '🤰',
  respiratory: '🫁',
  other: '🚨',
};

export const STATUS_LABELS: Record<TripStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_the_way: 'On the Way',
  arrived_pickup: 'Arrived at Pickup',
  transporting: 'Transporting Patient',
  reached_hospital: 'Reached Hospital',
};
