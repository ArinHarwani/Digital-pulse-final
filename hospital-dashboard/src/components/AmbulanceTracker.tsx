import { EmergencyAlert } from '@/types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AmbulanceStatusIndicator } from '@/components/StatusIndicator';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OsrmMap } from '@/components/OsrmMap';

interface AmbulanceTrackerProps {
  emergency: EmergencyAlert;
  hospitalLocation?: { lat: number; lng: number };
}

export function AmbulanceTracker({ emergency, hospitalLocation }: AmbulanceTrackerProps) {
  const { ambulance, eta } = emergency;

  // Fallback to AIIMS Jodhpur if no hospital location provided
  const Hospital_LOCATION = hospitalLocation || { lat: 26.8439, lng: 75.5652 };

  // Logic: Use the ambulance location provided by input, BUT if it is far away (like Mumbai) or default 0,
  // revert to JECC for the demo.

  let currentLocation = emergency.ambulance.currentLocation;

  // Safe-guard: If lat is < 24 (Mumbai/South) or default 0/undefined, fallback to Jodhpur city centre
  if (!currentLocation || currentLocation.lat < 24 || currentLocation.lat === 0) {
    currentLocation = { lat: 26.8439, lng: 75.5652 }; // MUJ Jaipur default
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4 text-primary" />
            Live Tracking
          </CardTitle>
          <AmbulanceStatusIndicator status={ambulance.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free OSRM Maps Integration */}
        <div className="relative aspect-video rounded-lg border border-border overflow-hidden bg-secondary/20">
          <OsrmMap
            ambulanceLocation={currentLocation}
            hospitalLocation={Hospital_LOCATION}
            className="w-full h-full"
          />
        </div>

        {/* ETA Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <Clock className={cn(
              'h-8 w-8',
              eta <= 5 ? 'text-destructive' : 'text-primary'
            )} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimated Arrival</p>
              <p className={cn(
                'text-3xl font-bold font-mono',
                eta <= 5 ? 'text-destructive' : 'text-foreground'
              )}>
                {eta} <span className="text-lg font-normal text-muted-foreground">minutes</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-lg font-semibold">{(eta * 0.8).toFixed(1)} km</p>
          </div>
        </div>

        {/* Location Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Start Location</span>
            </div>
            <p className="text-sm font-mono">
              JECC Sitapura
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">Heading</span>
            </div>
            <p className="text-sm">Northeast • 45 km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
