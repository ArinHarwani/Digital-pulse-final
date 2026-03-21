import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Ambulance,
  Phone,
  MessageSquare,
  Navigation
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver/ambulance icon
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOSAxN2gybC43OCA0LjYzYS4zLjMgMCAwIDAgLjMuMzcuMy4zIDAgMCAwIC4zLS4zN0wxMyAxN2gyIi8+PHBhdGggZD0iTTExIDJ2NSIvPjxwYXRoIGQ9Ik0xMyAydjUiLz48cGF0aCBkPSJNNiA4aDEydjVIMnoiLz48cGF0aCBkPSJNMTggMTN2M2gtNHYtM00yIDEzdjNoNHYtMyIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Helper component to center map on position update
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const TrackingScreen = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const autoStartAI = searchParams.get('autoStartAI') === 'true';

  const [status, setStatus] = useState('Dispatching...');
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>('Locating...');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Ref for throttling location updates
  const lastLocationUpdateRef = React.useRef(0);

  // Helper to update user location in Supabase (so driver can track)
  const updateLocationInDB = async (lat: number, lng: number) => {
    if (!user?.id) return;

    const now = Date.now();
    if (now - lastLocationUpdateRef.current < 5000) return; // Throttle 5s

    try {
      await supabase
        .from('users')
        .update({
          current_latitude: lat,
          current_longitude: lng,
          last_location_update: new Date().toISOString()
        })
        .eq('id', user.id);

      lastLocationUpdateRef.current = now;
      console.log('📡 User location broadcasted to DB');
    } catch (err) {
      console.error('Failed to broadcast location:', err);
    }
  };

  // Effect to get live location and broadcast it
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });

        // Broadcast to DB so driver can see
        updateLocationInDB(latitude, longitude);

        // Reverse geocoding via Mapbox
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`,
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
  }, [user?.id]);

  // Load emergency location from sessionStorage as fallback
  useEffect(() => {
    if (!liveLocation) {
      const storedLocation = sessionStorage.getItem('emergencyLocation');
      if (storedLocation) {
        try {
          const { lat, lng, address } = JSON.parse(storedLocation);
          setLiveLocation({ lat, lng });
          setLiveAddress(address || 'Emergency location');
          // Broadcast initial location
          updateLocationInDB(lat, lng);
        } catch (e) {
          console.error("Failed to parse stored location", e);
        }
      }
    }
  }, [user?.id]);

  // Real-time subscription for driver location updates and status
  useEffect(() => {
    let statusChannel: any;

    const fetchEmergencyDetails = async () => {
      const emergencyType = sessionStorage.getItem('currentEmergencyType');
      if (!emergencyType) return;

      try {
        const { data } = await supabase
          .from('emergency_alerts')
          .select('id, driver_id, status')
          .eq('type', emergencyType)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const statusMap: Record<string, string> = {
            'pending': 'Dispatching...',
            'dispatched': 'Driver Dispatched',
            'en_route': 'Driver En Route',
            'arrived_pickup': 'Driver Arrived',
            'transporting': 'On Way to Hospital',
            'reached_hospital': 'Arrived at Hospital',
            'resolved': 'Emergency Resolved'
          };
          if (data.status && statusMap[data.status]) {
            setStatus(statusMap[data.status]);
          }

          // Subscribe to status changes
          statusChannel = supabase
            .channel('emergency-status-updates')
            .on('postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'emergency_alerts',
                filter: `id=eq.${data.id}`
              },
              (payload) => {
                console.log('📝 Status updated:', payload.new.status);

                // Update Driver ID if assigned
                if (payload.new.driver_id && payload.new.driver_id !== driverId) {
                  console.log('🚗 Driver Assigned via Realtime:', payload.new.driver_id);
                  setDriverId(payload.new.driver_id);

                  // Fetch initial driver location immediately
                  supabase
                    .from('drivers')
                    .select('current_latitude, current_longitude')
                    .eq('id', payload.new.driver_id)
                    .single()
                    .then(({ data: driverData }) => {
                      if (driverData?.current_latitude && driverData?.current_longitude) {
                        setDriverLocation({
                          lat: driverData.current_latitude,
                          lng: driverData.current_longitude
                        });
                      }
                    });
                }

                if (statusMap[payload.new.status]) {
                  const newStatus = statusMap[payload.new.status];
                  setStatus(newStatus);

                  if (Notification.permission === 'granted' && document.hidden) {
                    new Notification('Emergency Update', {
                      body: newStatus,
                      icon: '/favicon.ico'
                    });
                  }
                }
              }
            )
            .subscribe();

          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }

          if (data.driver_id) {
            setDriverId(data.driver_id);
            console.log('🚗 Driver assigned:', data.driver_id);

            const { data: driverData } = await supabase
              .from('drivers')
              .select('current_latitude, current_longitude')
              .eq('id', data.driver_id)
              .single();

            if (driverData?.current_latitude && driverData?.current_longitude) {
              setDriverLocation({
                lat: driverData.current_latitude,
                lng: driverData.current_longitude
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching emergency details:', err);
      }
    };

    fetchEmergencyDetails();

    return () => {
      if (statusChannel) supabase.removeChannel(statusChannel);
    };
  }, [driverId]);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!driverId) return;

    console.log('📍 Subscribing to driver location updates...');

    const channel = supabase
      .channel('driver-location-updates')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`
        },
        (payload) => {
          console.log('🚗 Driver location updated:', payload.new);
          if (payload.new.current_latitude && payload.new.current_longitude) {
            setDriverLocation({
              lat: payload.new.current_latitude,
              lng: payload.new.current_longitude
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to driver location');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  // Manipal University Jaipur (MUJ) coordinates (default/fallback origin point)
  const MUJ_LOCATION = { lat: 26.8439, lng: 75.5652 };
  const OLA_MAPS_API_KEY = 'k1zvEY6H4bQdKo7kYXdpT0rJFVXbotHKDPKcGhxH';

  // Fetch route from JECRC University to user's current location using OLA Maps API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!liveLocation) return;

      try {
        // OLA Maps Directions API
        const response = await fetch(
          `https://api.olamaps.io/routing/v1/directions?origin=${MUJ_LOCATION.lat},${MUJ_LOCATION.lng}&destination=${liveLocation.lat},${liveLocation.lng}&api_key=${OLA_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];

          // Decode polyline if provided as encoded string, or use geometry directly
          let coords: [number, number][] = [];

          if (route.overview_polyline) {
            // Decode the polyline
            coords = decodePolyline(route.overview_polyline);
          } else if (route.legs && route.legs[0] && route.legs[0].steps) {
            // Extract coordinates from steps
            route.legs[0].steps.forEach((step: any) => {
              if (step.polyline) {
                const stepCoords = decodePolyline(step.polyline);
                coords.push(...stepCoords);
              }
            });
          }

          if (coords.length > 0) {
            setRoutePath(coords);
          } else {
            // Fallback: draw a straight line
            setRoutePath([
              [MUJ_LOCATION.lat, MUJ_LOCATION.lng],
              [liveLocation.lat, liveLocation.lng]
            ]);
          }

          // Extract distance and duration
          const leg = route.legs?.[0];
          if (leg) {
            const distKm = leg.distance ? (leg.distance / 1000).toFixed(1) : '?';
            const durMins = leg.duration ? Math.ceil(leg.duration / 60) : '?';
            setRouteInfo({
              distance: `${distKm} km`,
              duration: `${durMins} mins`
            });
          }
        } else {
          // Fallback to straight line if API fails
          setRoutePath([
            [MUJ_LOCATION.lat, MUJ_LOCATION.lng],
            [liveLocation.lat, liveLocation.lng]
          ]);
        }
      } catch (err) {
        console.error('Error fetching route from OLA Maps:', err);
        // Fallback to straight line on error
        if (liveLocation) {
          setRoutePath([
            [MUJ_LOCATION.lat, MUJ_LOCATION.lng],
            [liveLocation.lat, liveLocation.lng]
          ]);
        }
      }
    };

    fetchRoute();
  }, [liveLocation]);

  // Helper function to decode Google-style encoded polyline
  const decodePolyline = (encoded: string): [number, number][] => {
    const coords: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coords.push([lat / 1e5, lng / 1e5]);
    }

    return coords;
  };

  // Effect to handle autostart AI
  useEffect(() => {
    if (autoStartAI) {
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('autoStartAI');
        navigate(`/tracking?${newParams.toString()}`, { replace: true });
        navigate('/first-aid');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [autoStartAI, navigate, searchParams]);

  const displayLat = liveLocation?.lat || 26.8439;
  const displayLng = liveLocation?.lng || 75.5652;

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Emergency Active</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
              <span className="text-muted-foreground">Live Tracking</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full p-6 space-y-6">

        {/* Status Card */}
        <div className="bg-card rounded-3xl border-2 border-emergency/20 p-6 text-center shadow-lg shadow-emergency/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emergency/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-emergency/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Ambulance className="w-10 h-10 text-emergency" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">{status}</h2>
            <p className="text-sm text-muted-foreground">
              {status === 'Dispatching...' ? 'Locating nearest response team...' : 'Unit #42 is en route'}
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/first-aid')}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-secondary/10 hover:bg-secondary/20 rounded-2xl transition-colors"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-sm font-semibold">AI First Aid</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-700">Call Driver</span>
          </button>
        </div>

        {/* Live Map View */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden space-y-0 min-h-[500px]">
          <div className="p-4 pb-2 flex items-center justify-between bg-card z-10 relative">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Live Tracking Map</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-medical-light text-medical flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-medical"></span>
                </span>
                Live GPS
              </span>
            </div>
          </div>

          <div className="h-[400px] w-full relative z-0">
            <MapContainer
              center={[displayLat, displayLng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              dragging={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                tileSize={512}
                zoomOffset={-1}
              />

              {/* Route Line */}
              {routePath.length > 0 && (
                <Polyline
                  positions={routePath}
                  color="#ef4444"
                  weight={4}
                  opacity={0.7}
                  dashArray="10 10"
                />
              )}

              {/* User location marker */}
              <Marker position={[displayLat, displayLng]}>
                <div className="leaflet-popup-content">
                  <strong>Your Location</strong>
                </div>
              </Marker>

              {/* MUJ University Marker */}
              <Marker position={[MUJ_LOCATION.lat, MUJ_LOCATION.lng]}>
                <div className="leaflet-popup-content">
                  <strong>MUJ University</strong><br />
                  <span>Route Origin</span>
                </div>
              </Marker>

              {/* Driver location marker (optional/legacy) */}
              {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                  <div className="leaflet-popup-content">
                    <strong>Driver Location</strong><br />
                    <span>En route to you</span>
                  </div>
                </Marker>
              )}

              <RecenterMap lat={displayLat} lng={displayLng} />
            </MapContainer>

            {/* Map Controls Info Overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-[400]">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emergency" />
                  <span>You are here</span>
                </p>
              </div>

              {/* ETA Display */}
              {routeInfo && (
                <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-white/20 animate-in fade-in slide-in-from-left-2">
                  <p className="text-xs font-medium text-white flex items-center gap-2">
                    <Ambulance className="w-3 h-3 text-emergency" />
                    <span>{routeInfo.duration} ({routeInfo.distance})</span>
                  </p>
                </div>
              )}
            </div>

            {/* Accuracy Indicator */}
            {liveLocation && (
              <div className="absolute bottom-16 right-3 bg-safe/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md z-[400]">
                <p className="text-xs font-medium text-white">High Accuracy GPS</p>
              </div>
            )}
          </div>

          <div className="p-4 pt-3 bg-card border-t border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emergency-light flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-emergency" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {liveAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  {liveLocation ? 'Precise Location Active' : 'Loading Location...'}
                </p>
              </div>
            </div>

            {/* Map Features Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-safe"></div>
                Drag to explore
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-medical"></div>
                Pinch to zoom
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emergency"></div>
                Real-time tracking
              </span>
            </div>
          </div>
        </div>

      </div>
    </MobileLayout>
  );
};

export default TrackingScreen;
