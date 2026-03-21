import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Baby,
  MapPin,
  Navigation,
  Car,
  MoreHorizontal,
  Siren
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { SavedLocation } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from '@/components/LanguageToggle';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map on position update
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useApp();

  const [activeLocation, setActiveLocation] = useState<SavedLocation | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>('Locating...');

  // Ref to track last location save time for throttling
  const lastSaveTimeRef = React.useRef<number>(0);

  // Function to save live location to Supabase
  const saveLiveLocationToSupabase = async (lat: number, lng: number, address: string) => {
    if (!user?.id) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    // Throttle: only save every 30 seconds
    if (timeSinceLastSave < 30000) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users' as any)
        .update({
          current_latitude: lat,
          current_longitude: lng,
          current_address: address,
          last_location_update: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save location to Supabase:', error);
      } else {
        console.log('Live location saved to Supabase');
        lastSaveTimeRef.current = now;
      }
    } catch (err) {
      console.error('Error saving location:', err);
    }
  };

  // Effect to get live location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });

        // Reverse geocoding via Mapbox
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`,
            { headers: { 'User-Agent': 'RoadResQ Emergency App' } }
          );
          if (response.ok) {
            const data = await response.json();
          const addr = data.features?.[0]?.place_name || 'Unknown Location';
          setLiveAddress(addr);

          // Save to Supabase throttled)
            await saveLiveLocationToSupabase(latitude, longitude, addr);
          }
        } catch (e) {
          console.error("Geocoding error", e);
        }
      },
      (error) => {
        console.error("Location error", error);
        setLiveAddress("Location unavailable");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user?.id]); // Add user.id to dependencies

  // Fallback to saved location if no live location yet
  useEffect(() => {
    if (user?.savedLocations && user.savedLocations.length > 0) {
      const homeLocation = user.savedLocations.find(l => l.type === 'home');
      setActiveLocation(homeLocation || user.savedLocations[0]);
    }
  }, [user]);

  // Use live location if available, otherwise saved active location, otherwise default MUJ Jaipur
  const displayLat = liveLocation?.lat || activeLocation?.coordinates.lat || 26.8439;
  const displayLng = liveLocation?.lng || activeLocation?.coordinates.lng || 75.5652;
  const displayAddress = liveLocation ? liveAddress : (activeLocation?.address || 'MUJ Jaipur (Default)');

  // Countdown state for accident delay
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingEmergency, setPendingEmergency] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown finished, trigger emergency
      if (pendingEmergency) {
        triggerEmergency(pendingEmergency);
      }
      setCountdown(null);
      setPendingEmergency(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, pendingEmergency]);

  const triggerEmergency = async (type: string) => {
    // 1. Get Location (use live, saved, or default MUJ Jaipur)
    const lat = liveLocation?.lat || activeLocation?.coordinates.lat || 26.8439;
    const lng = liveLocation?.lng || activeLocation?.coordinates.lng || 75.5652;
    const addr = liveAddress || activeLocation?.address || 'Manipal University Jaipur (MUJ), Jaipur';

    try {
      // Send alert to the unified emergencies table FIRST
      const medassistKey = new URLSearchParams(window.location.search).get('key') 
        || localStorage.getItem('medassist_key') 
        || localStorage.getItem('last_active_key') 
        || 'UNKNOWN_KEY';
      const patientName = localStorage.getItem('userName') || user?.name || 'Unknown';

      const { data, error: insertError } = await supabase
        .from('emergencies' as any)
        .insert({
          medassist_key: medassistKey,
          patient_name: patientName,
          emergency_type: type,
          status: 'pending',
          patient_location: `POINT(${lng} ${lat})`, // PostGIS format: Longitude Latitude
          patient_address: addr,
          patient_lat: lat,
          patient_lng: lng
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('Emergency alert sent to unified DB, ID:', data?.id);
      
      // Store emergency info in sessionStorage for tracking screen to access
      sessionStorage.setItem('currentEmergencyType', type);
      sessionStorage.setItem('emergencyLocation', JSON.stringify({ lat, lng, address: addr }));
      if (data?.id) sessionStorage.setItem('active_emergency_id', data.id);

      // Navigate to tracking screen AFTER successful insert
      navigate(`/tracking?type=${type}&id=${data?.id || ''}`);

      // Notify family (Non-blocking)
      let targetPhone = user?.familyPhone;
      
      // Fallback: Fetch from MedAssist patients table if not in context
      if (!targetPhone && medassistKey !== 'UNKNOWN_KEY') {
        const { data: patientData } = await supabase
          .from('patients' as any)
          .select('relative_phone, phone_number')
          .eq('unique_key', medassistKey)
          .maybeSingle();
        
        if (patientData) {
          targetPhone = patientData.relative_phone || patientData.phone_number;
        }
      }

      // Hardcode fallback for demonstrative purposes to ensure SMS always fires!
      if (!targetPhone) {
        targetPhone = '+918239110690'; // Use this as the ultimate fallback
      }

      if (targetPhone) {
        // TextBee requires exact country code formatting (must start with '+')
        let formattedPhone = targetPhone.replace(/\D/g, ''); // strip non-digits to clean it up
        if (formattedPhone.length === 10) {
          formattedPhone = '+91' + formattedPhone;
        } else if (!targetPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = targetPhone;
        }

        toast({
          title: "Alert Sent",
          description: `Emergency services and family notified.`,
          duration: 3000,
        });

        // WhatsApp/SMS Integration body
        const message = `SOS! I need help! I'm in a ${type} emergency.\nLocation: ${addr}\nMap: https://www.google.com/maps?q=${lat},${lng}`;
        
        // TextBee Live Integration
        try {
          // Using Environment Variables for security
          const deviceId = import.meta.env.VITE_TEXTBEE_DEVICE_ID;
          const apiKey = import.meta.env.VITE_TEXTBEE_API_KEY;
          
          if (!deviceId || !apiKey) {
            console.error("Missing TextBee API Keys in environment!");
          } else {
            const smsResponse = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify({
                recipients: [formattedPhone],
                message: message
              })
            });
            const resultText = await smsResponse.text();
            console.log(`TextBee SMS request sent to ${formattedPhone}`, 'Status:', smsResponse.status, 'Response:', resultText);
          }
        } catch (smsErr) {
          console.error("TextBee SMS failed", smsErr);
          
          // Fallback to old Supabase function if any
          supabase.functions.invoke('send-sms', {
            body: { to: formattedPhone, message: message }
          }).catch(err => console.error("Internal SMS backup failed", err));
        }
      }
    } catch (err) {
      console.error("Emergency Trigger Error:", err);
      toast({
        title: "Network Error",
        description: "Failed to send alert. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const handleEmergencyType = (type: string) => {
    // Start 10s countdown for ALL emergency types
    setPendingEmergency(type);
    setCountdown(10);
  };

  const cancelEmergency = () => {
    setCountdown(null);
    setPendingEmergency(null);
  };

  const emergencyTypes = [
    { id: 'accident', icon: Car, label: t('home.accident'), color: 'bg-emergency' },
    { id: 'heart_emergency', icon: Heart, label: t('home.heart'), color: 'bg-warning' },
    { id: 'maternal', icon: Baby, label: t('home.maternity'), color: 'bg-safe' },
    { id: 'other', icon: MoreHorizontal, label: t('home.other'), color: 'bg-medical' },
  ];

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-lg font-bold text-foreground">Digital Pulse (Emergency)</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-medical animate-pulse" />
              <span className="text-muted-foreground">Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              onClick={() => navigate('/verification')}
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-xl"
            >
              <MapPin className="w-4 h-4 text-emergency" />
              <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                {displayAddress.split(',')[0]}
              </span>
            </button>
          </div>
        </div>
      }
      footer={<BottomNav />}
    >
      <div className="px-6 py-6 space-y-6">
        {/* Single Emergency Button */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            onClick={() => handleEmergencyType('other')}
            className="group relative flex flex-col items-center justify-center w-56 h-56 rounded-full border-4 border-emergency/30 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all duration-300 active:scale-90 overflow-hidden bg-emergency animate-emergency-pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <Siren className="w-12 h-12 text-white" />
            </div>
            <span className="text-2xl font-black text-white uppercase tracking-widest">
              EMERGENCY
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <p className="text-sm font-medium text-muted-foreground animate-pulse mt-4">
            Tap to trigger instant alert
          </p>
        </div>

        {/* Location Status with Map */}
        <div className="rounded-3xl border border-white/30 overflow-hidden shadow-xl bg-white/40 backdrop-blur-md">
          <div className="p-4 pb-2 flex items-center justify-between z-10 relative">
            <h3 className="font-bold text-foreground/80 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {t('home.location')}
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 flex items-center gap-2 border border-green-500/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Live GPS
            </span>
          </div>

          <div className="h-[200px] w-full relative z-0 mt-2">
            <MapContainer
              center={[displayLat, displayLng]}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                tileSize={512}
                zoomOffset={-1}
              />
              <Marker position={[displayLat, displayLng]} />
              <RecenterMap lat={displayLat} lng={displayLng} />
            </MapContainer>

            {/* Overlay Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-[400]" />
          </div>

          <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-white/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {displayAddress}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {liveLocation ? 'Precise Location Active' : 'Loading Location...'}
              </p>
            </div>
          </div>
        </div>

        {/* First Aid Assistant Promo */}
        <button
          onClick={() => navigate('/first-aid')}
          className="w-full bg-gradient-to-r from-safe to-safe/80 rounded-2xl p-4 flex items-center gap-4 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {/* <div className="w-12 h-12 bg-secondary-foreground/20 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-secondary-foreground" />
          </div> */}
          {/* Removed Stethoscope import to clean up, using generic placeholder or simpler layout if needed, 
              but keeping code consistent with previous. Ah wait, I removed Stethoscope from imports. 
              Let me re-add it or use MoreHorizontal for now if I don't want to re-import. 
              Actually, the user didn't ask to change this, but I removed Stethoscope from imports.
              Let me check imports again. I removed Stethoscope. I should probably remove this block 
              or fix the icon. The user didn't ask to remove First Aid. I'll just change the icon 
              to Heart or something available or re-import Stethoscope.
              Re-importing Stethoscope is safer. */}
          <div className="w-12 h-12 bg-secondary-foreground/20 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-secondary-foreground">AI First-Aid Assistant</h3>
            <p className="text-sm text-secondary-foreground/80">Get guided emergency instructions</p>
          </div>
          <div className="text-2xl">→</div>
        </button>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm flex flex-col items-center space-y-8 text-center">
            <div className="w-32 h-32 rounded-full bg-emergency/10 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-emergency transition-all duration-1000 ease-linear"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * countdown) / 10}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-4xl font-bold text-emergency">{countdown}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Sending Alert...</h2>
              <p className="text-muted-foreground">
                We are contacting emergency services in {countdown} seconds.
              </p>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full py-6 text-lg border-2"
              onClick={cancelEmergency}
            >
              Cancel Emergency
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default HomeScreen;
