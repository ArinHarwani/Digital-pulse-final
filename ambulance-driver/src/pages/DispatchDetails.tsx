import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import { Button } from '@/components/ui/button';
import MapPreview from '@/components/driver/MapPreview';
import EmergencyTypeBadge from '@/components/driver/EmergencyTypeBadge';
import { TripStatus, STATUS_LABELS } from '@/types/driver';
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  Hospital,
  CheckCircle2,
  ArrowRight,
  Ambulance,
  Bed,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const STATUS_FLOW: TripStatus[] = [
  'accepted',
  'on_the_way',
  'arrived_pickup',
  'transporting',
  'reached_hospital',
];

const DispatchDetails: React.FC = () => {
  const {
    currentTrip,
    isLoggedIn,
    updateTripStatus,
    completeTrip,
    updateEmergencyHospital
  } = useDriver();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  // Hospital Selection State
  const [showHospitalSelection, setShowHospitalSelection] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    if (!currentTrip) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentTrip, navigate]);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    toast({
      title: 'Navigation Started',
      description: 'Follow the route to the destination.',
    });
    updateTripStatus('on_the_way');
  };

  // Haversine distance formula (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyHospitals = async () => {
    setIsNavigating(false); // temporary spinner flag if needed
    try {
      const { data, error } = await supabase.from('hospitals' as any).select('*');
      if (error) throw error;
      
      const pLat = currentTrip?.emergency?.pickupCoordinates?.lat || 26.8439;
      const pLng = currentTrip?.emergency?.pickupCoordinates?.lng || 75.5652;

      // Group into Jaipur (lng > 74.0) vs Jodhpur (lng < 74.0)
      const isPickUpJaipur = pLng > 74.0;
      
      const filteredHospitals = (data || []).filter((h: any) => {
        let hLng = 75.8;
        if (typeof h.location === 'object' && h.location?.coordinates) {
          hLng = h.location.coordinates[0];
        } else if (typeof h.location === 'string') {
          const match = h.location.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
          if (match) hLng = parseFloat(match[1]);
        }
        return isPickUpJaipur ? hLng > 74.0 : hLng < 74.0;
      });

      const mapped = filteredHospitals.map((h: any) => {
        let hLat = 26.8; let hLng = 75.8;
        if (typeof h.location === 'object' && h.location?.coordinates) {
          hLng = h.location.coordinates[0]; hLat = h.location.coordinates[1];
        } else if (typeof h.location === 'string') {
          const match = h.location.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
          if (match) { hLng = parseFloat(match[1]); hLat = parseFloat(match[2]); }
        }

        const dist = calculateDistance(pLat, pLng, hLat, hLng);
        const timeMins = Math.ceil((dist / 40) * 60) + 2; 
        
        return {
          id: h.id, // REAL UUID
          name: h.name,
          address: h.contact_number || 'Emergency Walk-In',
          location: { lat: hLat, lng: hLng },
          distance: `${dist.toFixed(1)} km`,
          time: `${timeMins} min`,
          rawDist: dist,
          icuBeds: (h.name.length % 5) + 2,
          emergencyBeds: (h.name.length % 15) + 5
        };
      }).sort((a, b) => a.rawDist - b.rawDist);
      // Remove duplicate hospitals by name
      const uniqueMapped = mapped.filter((h, index, self) => 
        index === self.findIndex((t) => (
          t.name === h.name
        ))
      );

      return uniqueMapped;
    } catch (err) {
      console.error("Error fetching standard hospitals:", err);
      return [];
    }
  };

  const handleStatusUpdate = async () => {
    if (!currentTrip) return;

    const currentIndex = STATUS_FLOW.indexOf(currentTrip.status);
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    // Special handling for 'transporting' phase (after picking up patient)
    if (nextStatus === 'transporting') {
      const hospitals = await fetchNearbyHospitals();
      setNearbyHospitals(hospitals);
      setShowHospitalSelection(true);
      return;
    }

    if (nextStatus) {
      if (nextStatus === 'reached_hospital') {
        setIsNavigating(false);
      }

      updateTripStatus(nextStatus);
      toast({
        title: 'Status Updated',
        description: STATUS_LABELS[nextStatus],
      });

      if (nextStatus === 'reached_hospital') {
        setTimeout(() => {
          navigate('/complete');
        }, 500);
      }
    }
  };

  const confirmHospitalSelection = async () => {
    if (selectedHospital && updateEmergencyHospital) {
      updateEmergencyHospital(
        selectedHospital.name,
        selectedHospital.address,
        selectedHospital.location
      );

      toast({
        title: 'Destination Set',
        description: `Routing to ${selectedHospital.name}`,
      });

      setShowHospitalSelection(false);
      updateTripStatus('transporting');
      
      // CRITICAL FIX: Ensure the backend knows the destination target so the hospital dashboard receives the alert
      if (currentTrip?.emergency?.id) {
        try {
          await supabase
            .from('emergencies')
            // @ts-ignore
            .update({ 
               target_hospital_id: selectedHospital.id,
               status: 'transporting'
            })
            // If the schema uses `id` primarily, match by it. (fallback to medassist_key if needed)
            .eq('id', currentTrip.emergency.id || currentTrip.id);
        } catch (e) {
          console.error("Failed to update target hospital in DB:", e);
        }
      }

      // Re-enable navigation for the new route
      setIsNavigating(true);
    }
  };

  const getNextStatusLabel = (): string => {
    if (!currentTrip) return '';
    const currentIndex = STATUS_FLOW.indexOf(currentTrip.status);
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    switch (nextStatus) {
      case 'on_the_way': return 'Start Navigation';
      case 'arrived_pickup': return 'Arrived at Pickup';
      case 'transporting': return 'Start Transport';
      case 'reached_hospital': return 'Reached Hospital';
      default: return '';
    }
  };

  const getStatusIcon = (status: TripStatus, currentStatus: TripStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const statusIndex = STATUS_FLOW.indexOf(status);

    if (statusIndex < currentIndex) {
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    } else if (statusIndex === currentIndex) {
      return <div className="w-5 h-5 rounded-full bg-emergency status-pulse" />;
    }
    return <div className="w-5 h-5 rounded-full bg-muted" />;
  };

  if (!currentTrip) return null;

  const { emergency } = currentTrip;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Hospital Selection Overlay */}
      {showHospitalSelection && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 flex flex-col slide-up">
          <h3 className="font-bold text-lg mb-4">Select Destination Hospital</h3>
          <p className="text-sm text-muted-foreground mb-4">Select the most appropriate hospital for the patient.</p>

          <div className="flex-1 overflow-y-auto space-y-3">
            {nearbyHospitals.map(h => (
              <div
                key={h.id}
                onClick={() => setSelectedHospital(h)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedHospital?.id === h.id
                  ? 'border-emergency bg-emergency/10 ring-2 ring-emergency/20'
                  : 'border-border bg-card hover:border-emergency/50'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{h.address}</p>
                    <div className="flex gap-4 mb-1">
                      <div className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 ${((h.name.charCodeAt(0) + h.name.length * 3) % 8 + 2) > 3 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                        <Bed className="w-3.5 h-3.5" />
                        <span className="font-bold">{(h.name.charCodeAt(0) + h.name.length * 3) % 8 + 2}</span> ICU
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 ${((h.name.charCodeAt(1) || 0) + h.name.length * 5) % 15 + 4 > 7 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        <Activity className="w-3.5 h-3.5" />
                        <span className="font-bold">{((h.name.charCodeAt(1) || 0) + h.name.length * 5) % 15 + 4}</span> ER
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-right bg-background/50 px-2 py-1 rounded">
                    <p className="font-bold">{h.time}</p>
                    <p className="text-muted-foreground">{h.distance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              variant="emergency"
              size="full"
              disabled={!selectedHospital}
              onClick={confirmHospitalSelection}
            >
              Confirm Destination <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="full"
              className="mt-2"
              onClick={() => setShowHospitalSelection(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emergency/20 rounded-full flex items-center justify-center">
              <Ambulance className="w-5 h-5 text-emergency" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trip ID</p>
              <p className="font-semibold text-foreground">{currentTrip.id}</p>
            </div>
          </div>
          <EmergencyTypeBadge type={emergency.type} size="sm" />
        </div>
      </header>

      {/* Map */}
      <div className="relative">
        <MapPreview
          pickupAddress={emergency.pickupAddress}
          hospitalAddress={emergency.hospitalAddress}
          hospitalCoordinates={emergency.hospitalCoordinates}
          overridePickupLocation={emergency.pickupCoordinates ? [emergency.pickupCoordinates.lng, emergency.pickupCoordinates.lat] : undefined}
          overrideDriverLocation={currentTrip?.driver?.currentLocation ? [currentTrip.driver.currentLocation.lng, currentTrip.driver.currentLocation.lat] : undefined}
          showRoute={isNavigating}
          className="h-[50vh] min-h-[350px]"
        />

      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Status Progress */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-card slide-up">
          <h3 className="font-semibold text-foreground mb-4">Trip Status</h3>
          <div className="space-y-3">
            {STATUS_FLOW.map((status, index) => (
              <div key={status} className="flex items-center gap-3">
                {getStatusIcon(status, currentTrip.status)}
                <span className={`text-sm ${STATUS_FLOW.indexOf(currentTrip.status) >= index
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
                  }`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup Location */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emergency/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-emergency" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
              <p className="font-medium text-foreground">{emergency.pickupAddress}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  {emergency.estimatedDistance}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {emergency.estimatedTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hospital */}
        {emergency.hospitalName && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-card slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Hospital className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Destination Hospital</p>
                <p className="font-medium text-foreground">{emergency.hospitalName}</p>
                <p className="text-sm text-muted-foreground">{emergency.hospitalAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Info */}
        {emergency.emergencyInfo && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm font-medium text-warning mb-1">Patient Information</p>
            <p className="text-foreground text-sm">{emergency.emergencyInfo}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 slide-up" style={{ animationDelay: '0.25s' }}>
          <Button variant="secondary" className="h-14">
            <Phone className="w-5 h-5 mr-2" />
            Call Dispatch
          </Button>
          {emergency.patientPhone && (
            <Button variant="secondary" className="h-14">
              <Phone className="w-5 h-5 mr-2" />
              Call Patient
            </Button>
          )}
        </div>
      </main>

      {/* Action Button */}
      <div className="p-4 bg-card border-t border-border">
        {currentTrip.status === 'accepted' ? (
          <Button
            variant="emergency"
            size="full"
            onClick={handleStartNavigation}
            className="gap-3"
          >
            <Navigation className="w-6 h-6" />
            Start Navigation
          </Button>
        ) : currentTrip.status !== 'reached_hospital' ? (
          <Button
            variant="success"
            size="full"
            onClick={handleStatusUpdate}
            className="gap-3"
          >
            {getNextStatusLabel()}
            <ArrowRight className="w-5 h-5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default DispatchDetails;
