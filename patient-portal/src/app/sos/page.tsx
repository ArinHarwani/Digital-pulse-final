'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Heart,
  Baby,
  MapPin,
  Navigation,
  Car,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Fix Leaflet marker icon issue for SSR/Next.js
const fixLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

// Helper component to center map on position update
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export default function SOSScreen() {
  const router = useRouter();
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>('Locating...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingEmergency, setPendingEmergency] = useState<string | null>(null);
  const [medassistKey, setMedassistKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixLeafletIcons();
      // Try to grab the key from URL if they clicked from Dashboard, or fallback to localStorage if needed
      const urlParams = new URLSearchParams(window.location.search);
      const key = urlParams.get('key') || localStorage.getItem('last_active_key') || 'UNKNOWN_KEY';
      setMedassistKey(key);
    }
  }, []);

  // Effect to get live location
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });

        // Reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'RoadResQ Emergency App' } }
          );
          if (response.ok) {
            const data = await response.json();
            setLiveAddress(data.display_name);
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
  }, []);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      if (pendingEmergency) {
        triggerEmergency(pendingEmergency);
      }
      setCountdown(null);
      setPendingEmergency(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, pendingEmergency]);

  const triggerEmergency = async (type: string) => {
    const lat = liveLocation?.lat || 19.076;
    const lng = liveLocation?.lng || 72.877;
    const addr = liveAddress;

    try {
      // Create Emergency in the unified Supabase
      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          medassist_key: medassistKey,
          emergency_type: type,
          status: 'pending',
          patient_location: `POINT(${lng} ${lat})` // PostGIS format Longitude Latitude
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating emergency:', error);
        alert('Failed to send SOS to the hospital backend. Please call local authorities immediately.');
        return;
      }

      // Store ID in storage for the tracking screen
      sessionStorage.setItem('active_emergency_id', data.id);
      sessionStorage.setItem('emergencyLocation', JSON.stringify({ lat, lng, address: addr }));

      // Navigate to tracking screen
      router.push(`/sos/tracking?type=${type}&id=${data.id}`);

    } catch (err) {
      console.error("Navigation Error:", err);
    }
  };

  const handleEmergencyType = (type: string) => {
    setPendingEmergency(type);
    setCountdown(10);
  };

  const cancelEmergency = () => {
    setCountdown(null);
    setPendingEmergency(null);
  };

  const emergencyTypes = [
    { id: 'accident', icon: Car, label: 'Vehicle Accident', color: 'bg-red-500' },
    { id: 'heart_emergency', icon: Heart, label: 'Cardiac Issue', color: 'bg-orange-500' },
    { id: 'maternal', icon: Baby, label: 'Maternity', color: 'bg-purple-500' },
    { id: 'other', icon: MoreHorizontal, label: 'Other Critical', color: 'bg-blue-500' },
  ];

  const displayLat = liveLocation?.lat || 19.076;
  const displayLng = liveLocation?.lng || 72.877;

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Emergency Dispatch</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/70">System Armed</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="px-6 py-6 space-y-6 max-w-md mx-auto">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider text-center">
            Tap to immediately trigger SOS
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {emergencyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleEmergencyType(type.id)}
                className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 overflow-hidden bg-white/10 backdrop-blur-md"
              >
                <div className={`w-16 h-16 rounded-2xl ${type.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <type.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-base font-bold text-white/90 text-center leading-tight">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Location Status with Map */}
        <div className="rounded-3xl border border-white/10 overflow-hidden shadow-xl bg-white/5 backdrop-blur-md">
          <div className="p-4 pb-2 flex items-center justify-between z-10 relative">
            <h3 className="font-bold text-white/80 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Dispatch Location
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Live GPS
            </span>
          </div>

          <div className="h-[200px] w-full relative z-0 mt-2 bg-gray-900">
            {typeof window !== 'undefined' && (
              <MapContainer
                center={[displayLat, displayLng]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                dragging={false}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; Mapbox'
                  url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=`}
                />
                <Marker position={[displayLat, displayLng]} />
                <RecenterMap lat={displayLat} lng={displayLng} />
              </MapContainer>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none z-[400]" />
          </div>

          <div className="p-4 border-t border-white/10 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {liveAddress}
              </p>
              <p className="text-xs text-white/50 font-medium">
                {liveLocation ? 'Precise Location Active' : 'Loading Location...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay (The Lock Bypass Shatter Simulator) */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm flex flex-col items-center space-y-8 text-center">
            <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-red-500 transition-all duration-1000 ease-linear" strokeDasharray="283" strokeDashoffset={283 - (283 * countdown) / 10} strokeLinecap="round" />
              </svg>
              <span className="text-5xl font-bold text-red-500">{countdown}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Sending Alert...</h2>
              <p className="text-white/70">
                Contacting emergency services and unlocking MedAssist key in {countdown}s.
              </p>
              <p className="text-sm text-yellow-500 font-bold tracking-widest uppercase mt-4">
                DO NOT CLOSE THIS PAGE
              </p>
            </div>

            <button
              onClick={cancelEmergency}
              className="mt-8 w-full py-5 text-lg font-bold text-white border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-colors"
            >
              SLIDE TO CANCEL
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
