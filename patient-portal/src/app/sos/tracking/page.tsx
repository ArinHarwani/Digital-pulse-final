'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Ambulance,
  Phone,
  Navigation
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Fix Leaflet marker icon issue
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

const driverIconTemplate = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOSAxN2gybC43OCA0LjYzYS4zLjMgMCAwIDAgLjMuMzcuMy4zIDAgMCAwIC4zLS4zN0wxMyAxN2gyIi8+PHBhdGggZD0iTTExIDJ2NSIvPjxwYXRoIGQ9Ik0xMyAydjUiLz48cGF0aCBkPSJNNiA4aDEydjVIMnoiLz48cGF0aCBkPSJNMTggMTN2M2gtNHYtM00yIDEzdjNoNHYtMyIvPjwvc3ZnPg==';

// Helper component to center map on position update
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export default function TrackingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emergencyId = searchParams.get('id');

  const [status, setStatus] = useState('Dispatching...');
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>('Locating...');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const [driverIcon, setDriverIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixLeafletIcons();
      setDriverIcon(new L.Icon({
        iconUrl: driverIconTemplate,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      }));
    }
  }, []);

  // Load patient location from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocation = sessionStorage.getItem('emergencyLocation');
      if (storedLocation) {
        try {
          const { lat, lng, address } = JSON.parse(storedLocation);
          setLiveLocation({ lat, lng });
          setLiveAddress(address || 'Emergency location');
        } catch (e) {
          console.error("Failed to parse stored location", e);
        }
      }
    }
  }, []);

  // Real-time subscription for emergency status updates
  useEffect(() => {
    if (!emergencyId) return;

    let statusChannel: any;

    const fetchEmergencyDetails = async () => {
      try {
        const { data } = await supabase
          .from('emergencies')
          .select('*, ambulances(*)')
          .eq('id', emergencyId)
          .single();

        if (data) {
          const statusMap: Record<string, string> = {
            'pending': 'Dispatching...',
            'dispatched': 'Driver Dispatched',
            'picked_up': 'On Way to Hospital',
            'arrived': 'Arrived at Hospital'
          };
          if (data.status && statusMap[data.status]) setStatus(statusMap[data.status]);

          if (data.ambulances?.current_location) {
             // Parse PostGIS Point(lng lat)
             const coords = data.ambulances.current_location.replace('POINT(', '').replace(')', '').split(' ');
             setDriverLocation({ lat: parseFloat(coords[1]), lng: parseFloat(coords[0]) });
          }

          // Subscribe to status changes
          statusChannel = supabase
            .channel('emergency-status-updates')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'emergencies', filter: `id=eq.${emergencyId}` },
              (payload: any) => {
                if (payload.new?.status && statusMap[payload.new.status]) {
                  setStatus(statusMap[payload.new.status]);
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error('Error fetching emergency details:', err);
      }
    };

    fetchEmergencyDetails();

    return () => {
      if (statusChannel) supabase.removeChannel(statusChannel);
    };
  }, [emergencyId]);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  // Fetch Route from Mapbox Directions API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!liveLocation || !driverLocation) return;
      try {
        // Mapbox expects: longitude,latitude
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.lng},${driverLocation.lat};${liveLocation.lng},${liveLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]); // Swap to lat,lng for Leaflet
          setRoutePath(coords);
          
          const distKm = (data.routes[0].distance / 1000).toFixed(1);
          const durMins = Math.ceil(data.routes[0].duration / 60);
          setRouteInfo({ distance: `${distKm} km`, duration: `${durMins} mins` });
        }
      } catch (err) {
        console.error('Mapbox Route Error:', err);
      }
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 30000); // Poll route every 30s
    return () => clearInterval(interval);
  }, [liveLocation, driverLocation]);

  const displayLat = liveLocation?.lat || 19.076;
  const displayLng = liveLocation?.lng || 72.877;

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Emergency Active</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/70">Live Tracking</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full p-6 space-y-6 max-w-md mx-auto">
        {/* Status Card */}
        <div className="bg-black/40 rounded-3xl border-2 border-red-500/20 p-6 text-center shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Ambulance className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{status}</h2>
            <p className="text-sm text-white/50">
              {status === 'Dispatching...' ? 'Locating nearest response team...' : 'Unit is en route'}
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-colors text-white">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold">AI First Aid</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-2xl transition-colors">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shadow-sm">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm font-semibold text-green-400">Call Driver</span>
          </button>
        </div>

        {/* Live Map View */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-white/10 overflow-hidden space-y-0 min-h-[400px] relative">
          <div className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md z-[500] absolute top-0 left-0 right-0 w-full pointer-events-none">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">Live Tracking Map</h3>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 flex items-center gap-1 uppercase tracking-wider">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </span>
            </div>
          </div>

          <div className="h-full w-full absolute inset-0 z-0 pt-[52px]">
            {typeof window !== 'undefined' && (
              <MapContainer center={[displayLat, displayLng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=`} attribution='&copy; Mapbox' />
                
                {/* Mapbox Route Line */}
                {routePath.length > 0 && (
                  <Polyline positions={routePath} color="#ef4444" weight={5} opacity={0.8} />
                )}

                {/* Patient Location */}
                <Marker position={[displayLat, displayLng]}>
                  <div className="leaflet-popup-content"><strong>Your Location</strong></div>
                </Marker>

                {/* Ambulance Location */}
                {driverLocation && driverIcon && (
                  <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                    <div className="leaflet-popup-content"><strong>Ambulance</strong><br/>En route</div>
                  </Marker>
                )}
                
                <RecenterMap lat={displayLat} lng={displayLng} />
              </MapContainer>
            )}
          </div>
          
          {routeInfo && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl z-[400] flex justify-between items-center shadow-2xl">
              <div>
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1">Estimated Arrival</p>
                <div className="flex items-end gap-2 text-white">
                  <span className="text-2xl font-black leading-none">{routeInfo.duration}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1">Distance</p>
                <p className="text-lg font-bold text-white leading-none">{routeInfo.distance}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
