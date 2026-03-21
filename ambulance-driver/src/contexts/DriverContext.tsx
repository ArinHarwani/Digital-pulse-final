import React, { createContext, useContext, useState, useCallback } from 'react';
import { Driver, EmergencyRequest, Trip, TripStatus } from '@/types/driver';

interface DriverContextType {
  driver: Driver | null;
  isLoggedIn: boolean;
  isOnline: boolean;
  driverLocation: [number, number] | null; // [lng, lat]
  currentEmergency: EmergencyRequest | null;
  currentTrip: Trip | null;
  login: (driverId: string, phone: string, location?: [number, number]) => void;
  logout: () => void;
  toggleOnline: () => void;
  setCurrentEmergency: (emergency: EmergencyRequest | null) => void;
  acceptEmergency: () => void;
  rejectEmergency: () => void;
  updateTripStatus: (status: TripStatus) => void;
  completeTrip: () => void;
  updateEmergencyHospital: (name: string, address: string, coords: { lat: number, lng: number }) => void;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

export const DriverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyRequest | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  const login = useCallback((driverId: string, phone: string, location?: [number, number]) => {
    setDriver({
      id: driverId,
      name: 'Driver ' + driverId,
      phone,
      vehicleNumber: 'AMB-' + driverId.slice(-4).toUpperCase(),
      vehicleType: 'Advanced Life Support',
      isOnline: false,
    });
    if (location) setDriverLocation(location);
  }, []);

  const logout = useCallback(() => {
    setDriver(null);
    setIsOnline(false);
    setDriverLocation(null);
    setCurrentEmergency(null);
    setCurrentTrip(null);
  }, []);

  const toggleOnline = useCallback(() => {
    setIsOnline(prev => !prev);
  }, []);

  const acceptEmergency = useCallback(() => {
    if (currentEmergency && driver) {
      setCurrentTrip({
        id: 'TRIP-' + Date.now(),
        emergency: currentEmergency,
        driver,
        status: 'accepted',
        acceptedAt: new Date(),
      });
      setCurrentEmergency(null);
    }
  }, [currentEmergency, driver]);

  const rejectEmergency = useCallback(() => {
    setCurrentEmergency(null);
  }, []);

  const updateTripStatus = useCallback((status: TripStatus) => {
    setCurrentTrip(prev => {
      if (!prev) return prev;
      const updates: Partial<Trip> = { status };
      switch (status) {
        case 'arrived_pickup':
          updates.arrivedPickupAt = new Date();
          break;
        case 'transporting':
          updates.startedTransportAt = new Date();
          break;
        case 'reached_hospital':
          updates.completedAt = new Date();
          break;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const completeTrip = useCallback(() => {
    setCurrentTrip(null);
  }, []);

  return (
    <DriverContext.Provider
      value={{
        driver,
        isLoggedIn: !!driver,
        isOnline,
        driverLocation,
        currentEmergency,
        currentTrip,
        login,
        logout,
        toggleOnline,
        setCurrentEmergency,
        acceptEmergency,
        rejectEmergency,
        updateTripStatus,
        completeTrip,
        updateEmergencyHospital: (name: string, address: string, coords: { lat: number, lng: number }) => {
          if (currentTrip && currentTrip.emergency) {
            setCurrentTrip(prev => {
              if (!prev) return null;
              return {
                ...prev,
                emergency: {
                  ...prev.emergency,
                  hospitalName: name,
                  hospitalAddress: address,
                  hospitalCoordinates: coords
                }
              };
            });
          }
        }
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};
