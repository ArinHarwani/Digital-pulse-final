import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Ruler, Hospital } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

interface MapPreviewProps {
  pickupAddress: string;
  hospitalAddress?: string;
  hospitalCoordinates?: { lat: number; lng: number };
  showRoute?: boolean;
  className?: string;
  overrideDriverLocation?: [number, number] | null; // Note: these are passed as [lng, lat] from DriverDashboard
  overridePickupLocation?: [number, number] | null; // Note: these are passed as [lng, lat]
}

const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOSAxN2gybC43OCA0LjYzYS4zLjMgMCAwIDAgLjMuMzcuMy4zIDAgMCAwIC4zLS4zN0wxMyAxN2gyIi8+PHBhdGggZD0iTTExIDJ2NSIvPjxwYXRoIGQ9Ik0xMyAydjUiLz48cGF0aCBkPSJNNiA4aDEydjVIMnoiLz48cGF0aCBkPSJNMTggMTN2M2gtNHYtM00yIDEzdjNoNHYtMyIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Component to handle dynamic map bounds and recentering
const MapController = ({ driverCoord, targetCoord, routePath }: { driverCoord: [number, number], targetCoord: [number, number], routePath: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (driverCoord && targetCoord) {
      const bounds = L.latLngBounds([driverCoord, targetCoord]);
      if (routePath.length > 0) {
        routePath.forEach(p => bounds.extend(p));
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [driverCoord, targetCoord, routePath, map]);
  return null;
};

const MapPreview: React.FC<MapPreviewProps> = ({
  pickupAddress,
  hospitalAddress,
  hospitalCoordinates,
  showRoute = false,
  className,
  overrideDriverLocation,
  overridePickupLocation
}) => {
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(
    overrideDriverLocation ? [overrideDriverLocation[1], overrideDriverLocation[0]] : null // Convert to [lat, lng]
  );
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(
    overridePickupLocation ? [overridePickupLocation[1], overridePickupLocation[0]] : null
  );

  useEffect(() => {
    if (overridePickupLocation) {
      setPickupCoords([overridePickupLocation[1], overridePickupLocation[0]]);
    }
  }, [overridePickupLocation]);

  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeMetrics, setRouteMetrics] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // 1. Get Driver Location 
  useEffect(() => {
    if (overrideDriverLocation) {
      setDriverLocation([overrideDriverLocation[1], overrideDriverLocation[0]]);
    } else if (!("geolocation" in navigator)) {
      setDriverLocation([26.9124, 75.7873]);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => setDriverLocation([position.coords.latitude, position.coords.longitude]),
        () => setDriverLocation([26.9124, 75.7873])
      );
    }
  }, [overrideDriverLocation]);

  // 2. Fetch OSRM Route
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLocation) return;
      
      const isTransporting = !!hospitalCoordinates && showRoute;
      const target = isTransporting && hospitalCoordinates 
        ? [hospitalCoordinates.lat, hospitalCoordinates.lng] 
        : pickupCoords;

      if (!target) return;

      try {
        // Mapbox expects: lng,lat
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation[1]},${driverLocation[0]};${target[1]},${target[0]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          setRoutePath(coords as [number, number][]);
          
          const distKm = (data.routes[0].distance / 1000).toFixed(1);
          const durMins = Math.ceil(data.routes[0].duration / 60);
          setRouteMetrics({ distance: `${distKm} km`, duration: `${durMins} min` });
        }
      } catch (err) {
        console.error('Mapbox Route Error:', err);
      }
    };

    if (showRoute) {
      fetchRoute();
      const interval = setInterval(fetchRoute, 30000); // Poll every 30s
      return () => clearInterval(interval);
    } else {
      setRoutePath([]);
      setRouteMetrics(null);
    }
  }, [driverLocation, pickupCoords, hospitalCoordinates, showRoute]);

  if (!driverLocation) return <div className={cn("bg-secondary flex items-center justify-center min-h-[300px]", className)}>Loading Map...</div>;

  const isTransporting = !!hospitalCoordinates;
  const destinationCoord: [number, number] = isTransporting && hospitalCoordinates 
    ? [hospitalCoordinates.lat, hospitalCoordinates.lng] 
    : (pickupCoords || [26.7905, 75.8122]);

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-secondary', className)}>
      <div className="w-full h-full absolute inset-0 z-0">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={driverLocation} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; Mapbox'
              url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
            />
            
            <MapController driverCoord={driverLocation} targetCoord={destinationCoord} routePath={routePath} />
            
            {/* Mapbox Route Line */}
            {routePath.length > 0 && showRoute && (
              <Polyline positions={routePath} color="#ef4444" weight={5} opacity={0.8} />
            )}

            {/* Destination Marker */}
            <Marker position={destinationCoord}>
               <Popup><strong>{isTransporting ? 'Hospital' : 'Patient'}</strong></Popup>
            </Marker>

            {/* Ambulance Location */}
            <Marker position={driverLocation} icon={driverIcon}>
               <Popup><strong>Ambulance</strong></Popup>
            </Marker>
            
          </MapContainer>
        )}
      </div>

      {/* Metrics Overlay */}
      {showRoute && routeMetrics && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-border z-10 pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">{routeMetrics.distance}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">{routeMetrics.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 z-10 pointer-events-none">
        <div className="flex items-start gap-3">
          <div className="bg-emergency/20 p-2 rounded-lg">
            {hospitalCoordinates ? <Hospital className="w-4 h-4 text-emergency" /> : <MapPin className="w-4 h-4 text-emergency" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5" style={{textShadow: "0 0 10px black"}}>
              {hospitalCoordinates ? 'Destination Hospital' : 'Pickup Location'}
            </p>
            <p className="text-sm font-medium text-foreground truncate" style={{textShadow: "0 0 10px black"}}>
              {hospitalCoordinates ? hospitalAddress : pickupAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPreview;
