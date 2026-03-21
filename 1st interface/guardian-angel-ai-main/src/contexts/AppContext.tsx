import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Emergency, VerificationStatus, SavedLocation } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currentEmergency: Emergency | null;
  setCurrentEmergency: (emergency: Emergency | null) => void;
  verificationStatus: VerificationStatus;
  setVerificationStatus: (status: VerificationStatus) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (complete: boolean) => void;
}

const defaultVerificationStatus: VerificationStatus = {
  abha: 'pending',
  gps: 'disabled',
  deviceTrusted: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentEmergency, setCurrentEmergency] = useState<Emergency | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(defaultVerificationStatus);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Restore session on mount
  React.useEffect(() => {
    const restoreSession = async () => {
      const userId = sessionStorage.getItem('userId');
      if (userId && !user) {
        try {
          const { data, error } = await supabase
            .from('users' as any)
            .select('*')
            .eq('id', userId)
            .single();

          if (data && !error) {
            setUser({
              id: data.id,
              name: data.name || data.username,
              phone: data.phone || '',
              familyPhone: data.family_phone,
              abhaLinked: data.profile_complete,
              savedLocations: data.saved_locations || [],
              profileComplete: data.profile_complete || false,
            });

            // Sync onboarding step if needed
            if (data.profile_complete) {
              setIsOnboardingComplete(true);
            }
          }
        } catch (e) {
          console.error("Session restoration failed", e);
        }
      }
    };
    restoreSession();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currentEmergency,
        setCurrentEmergency,
        verificationStatus,
        setVerificationStatus,
        onboardingStep,
        setOnboardingStep,
        isOnboardingComplete,
        setIsOnboardingComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
