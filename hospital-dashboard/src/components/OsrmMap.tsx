import { useEffect, useState } from 'react';
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

const ambulanceIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOSAxN2gybC43OCA0LjYzYS4zLjMgMCAwIDAgLjMuMzcuMy4zIDAgMCAwIC4zLS4zN0wxMyAxN2gyIi8+PHBhdGggZD0iTTExIDJ2NSIvPjxwYXRoIGQ9Ik0xMyAydjUiLz48cGF0aCBkPSJNNiA4aDEydjVIMnoiLz48cGF0aCBkPSJNMTggMTN2M2gtNHYtM00yIDEzdjNoNHYtMyIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const hospitalIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMnYyMCIvPjxwYXRoIGQ9Ik0yIDEyaDIwIi8+PC9zdmc+',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const MapController = ({ ambulanceCoord, hospitalCoord, routePath }: { ambulanceCoord: [number, number], hospitalCoord: [number, number], routePath: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (ambulanceCoord && hospitalCoord) {
      const bounds = L.latLngBounds([ambulanceCoord, hospitalCoord]);
      if (routePath.length > 0) {
        routePath.forEach(p => bounds.extend(p));
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [ambulanceCoord, hospitalCoord, routePath, map]);
  return null;
};

interface OsrmMapProps {
    ambulanceLocation: { lat: number; lng: number };
    hospitalLocation: { lat: number; lng: number };
    className?: string;
}

export function OsrmMap({ ambulanceLocation, hospitalLocation, className }: OsrmMapProps) {
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [routeInfo, setRouteInfo] = useState<{ eta: string; distance: string } | null>(null);

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

    useEffect(() => {
        fixLeafletIcons();
    }, []);

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                // Mapbox expects: lng,lat
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${ambulanceLocation.lng},${ambulanceLocation.lat};${hospitalLocation.lng},${hospitalLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
                );
                const data = await response.json();
                
                if (data.routes && data.routes[0]) {
                    // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
                    const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                    setRoutePath(coords as [number, number][]);
                    
                    const distKm = (data.routes[0].distance / 1000).toFixed(1);
                    const durMins = Math.ceil(data.routes[0].duration / 60);
                    setRouteInfo({ distance: `${distKm} km`, eta: `${durMins} min` });
                }
            } catch (err) {
                console.error('Mapbox Route Error:', err);
            }
        };

        fetchRoute();
        const interval = setInterval(fetchRoute, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [ambulanceLocation, hospitalLocation]);

    const ambCoord: [number, number] = [ambulanceLocation.lat, ambulanceLocation.lng];
    const hospCoord: [number, number] = [hospitalLocation.lat, hospitalLocation.lng];

    return (
        <div className="relative w-full h-full">
            <div className={className || 'w-full h-full rounded-lg'} style={{ minHeight: '400px' }}>
                {typeof window !== 'undefined' && (
                    <MapContainer 
                        center={ambCoord} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; Mapbox'
                            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                            tileSize={512}
                            zoomOffset={-1}
                        />
                        
                        <MapController ambulanceCoord={ambCoord} hospitalCoord={hospCoord} routePath={routePath} />
                        
                        {routePath.length > 0 && (
                            <Polyline positions={routePath} color="#3b82f6" weight={5} opacity={0.8} />
                        )}

                        <Marker position={hospCoord} icon={hospitalIcon}>
                            <Popup><strong>MGH Hospital</strong></Popup>
                        </Marker>

                        <Marker position={ambCoord} icon={ambulanceIcon}>
                            <Popup><strong>Ambulance</strong></Popup>
                        </Marker>
                        
                    </MapContainer>
                )}
            </div>

            {/* Overlay Info Box */}
            <div className="absolute top-4 right-4 bg-white/95 p-3 rounded-lg shadow-md text-sm z-[1000] border border-border/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-semibold text-primary">Live Tracking</span>
                </div>
                <div className="space-y-1">
                    <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="font-mono font-bold">{routeInfo ? routeInfo.eta : '-- min'}</span>
                    </p>
                    <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-mono font-bold">{routeInfo ? routeInfo.distance : '-- km'}</span>
                    </p>
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <p>Pickup ➔ MGH (Trauma)</p>
                </div>
            </div>
        </div>
    );
}
