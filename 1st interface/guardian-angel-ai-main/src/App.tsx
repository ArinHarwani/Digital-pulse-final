import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { useEffect } from "react";
import { requestForToken, onMessageListener } from "./integrations/firebase/client";

// Onboarding Screens
import WelcomeScreen from "./pages/onboarding/WelcomeScreen";
import RegisterScreen from "./pages/onboarding/RegisterScreen";
import OTPScreen from "./pages/onboarding/OTPScreen";
import ABHAScreen from "./pages/onboarding/ABHAScreen";
import LocationsScreen from "./pages/onboarding/LocationsScreen";

import MedicalProfileScreen from "./pages/onboarding/MedicalProfileScreen";

// Main App Screens
import HomeScreen from "./pages/HomeScreen";
import FirstAidScreen from "./pages/FirstAidScreen";
import TrackingScreen from "./pages/TrackingScreen";
import VerificationScreen from "./pages/VerificationScreen";
import SettingsScreen from "./pages/SettingsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    try {
      // Request permission for push notifications (optional, won't crash if Firebase fails)
      requestForToken();

      // Listen for messages in foreground
      onMessageListener().then((payload: any) => {
        console.log('Foreground Push Notification Received:', payload);
      }).catch(() => {});
    } catch (e) {
      console.warn('Firebase not configured, skipping push notifications:', e);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/RRQ">
            <Routes>
              {/* Onboarding Flow */}
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/onboarding/register" element={<RegisterScreen />} />
              <Route path="/onboarding/otp" element={<OTPScreen />} />
              <Route path="/onboarding/abha" element={<ABHAScreen />} />
              <Route path="/onboarding/medical-profile" element={<MedicalProfileScreen />} />
              <Route path="/onboarding/locations" element={<LocationsScreen />} />

              {/* Main App */}
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/first-aid" element={<FirstAidScreen />} />
              <Route path="/tracking" element={<TrackingScreen />} />
              <Route path="/verification" element={<VerificationScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
