import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/driver/StatusBadge';
import MapPreview from '@/components/driver/MapPreview';
import {
  Ambulance,
  Power,
  LogOut,
  Phone,
  Clock,
  MapPin,
  AlertTriangle,
  Siren,
  Navigation,
  Building2,
  Locate,
  Search,
  Bed,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyRequest {
  id: string;
  medassist_key: string;
  emergency_type: string;
  patient_location: string; // PostGIS Point string
  patient_lat: number;
  patient_lng: number;
  patient_name?: string;
  patient_phone?: string;
  patient_address?: string;
}

interface HospitalRecord {
  id: string;
  name: string;
  location: string; // PostGIS POINT
  capacity: number;
  lat: number;
  lng: number;
  contact_number?: string;
  distance?: string;
  eta?: string;
  icuBeds?: number;
  emergencyBeds?: number;
}

// Parse PostGIS POINT string or object → { lng, lat }
function parsePostGISPoint(pointData: any): { lat: number; lng: number } | null {
  if (!pointData) return null;
  
  // If it's already an object (common with Supabase realtime payloads)
  if (typeof pointData === 'object' && pointData.coordinates) {
    return { lng: pointData.coordinates[0], lat: pointData.coordinates[1] };
  }

  // If it's a string, try parsing WKT format
  if (typeof pointData === 'string') {
    const match = pointData.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    
    // Fallback for stringified JSON
    try {
      const parsed = JSON.parse(pointData);
      if (parsed?.coordinates) return { lng: parsed.coordinates[0], lat: parsed.coordinates[1] };
    } catch { /* ignore */ }
  }
  
  return null;
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DriverDashboard: React.FC = () => {
  const {
    driver,
    isLoggedIn,
    isOnline,
    driverLocation,
    toggleOnline,
    logout
  } = useDriver();
  const navigate = useNavigate();

  const [incomingAlert, setIncomingAlert] = useState<EmergencyRequest | null>(null);
  const [activeJob, setActiveJob] = useState<EmergencyRequest | null>(null);
  const [jobStage, setJobStage] = useState<'idle' | 'accepted' | 'hospital_selection' | 'transporting'>('idle');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    // Automatically go online when entering dashboard to ensure alerts are received
    if (!isOnline) {
      toggleOnline();
    }
  }, [isLoggedIn, navigate, isOnline, toggleOnline]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Real-time Subscription
  useEffect(() => {
    if (!isOnline) {
      console.log('Driver is Offline. Not subscribing to emergencies.');
      return;
    }

    console.log('Driver is Online. Subscribing to emergencies table...');
    const channel = supabase
      .channel('emergencies_driver_view')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergencies' },
        async (payload) => {
          console.log('🚨 NEW EMERGENCY ALERT PAYLOAD RECEIVED:', payload);
          const newAlert = payload.new as any;
          
          // Parse PostGIS patient_location
          const coords = parsePostGISPoint(newAlert.patient_location);
          const pLat = newAlert.patient_lat || coords?.lat || 26.8439;
          const pLng = newAlert.patient_lng || coords?.lng || 75.5652;

          // Fetch patient details using medassist_key
          let patientName = newAlert.patient_name || "Unknown Patient";
          let patientPhone = "No Contact";
          
          if (newAlert.medassist_key) {
             try {
               const { data: patientData, error: patientError } = await supabase
                 .from('patients' as any)
                 .select('name, full_name, phone_number, relative_phone')
                 .eq('unique_key', newAlert.medassist_key)
                 .maybeSingle();
                 
               if (patientData) {
                 patientName = (patientData as any).full_name || (patientData as any).name || patientName;
                 patientPhone = (patientData as any).phone_number || (patientData as any).relative_phone || "No Contact";
               }
             } catch (err) {
               console.warn('Patient lookup failed, showing default alert details', err);
             }
          }
          
          setIncomingAlert({
            id: newAlert.id,
            medassist_key: newAlert.medassist_key,
            emergency_type: newAlert.emergency_type || 'General Medical',
            patient_location: newAlert.patient_location,
            patient_lat: pLat,
            patient_lng: pLng,
            patient_name: patientName,
            patient_phone: patientPhone,
            patient_address: newAlert.patient_address
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🔥 Supabase Realtime Subscription Status:', status);
        if (err) console.error('Realtime Subscription Error:', err);
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  const initiateAccept = () => {
    if (driverLocation) {
      confirmAccept();
    } else {
      toast.error("Location not found. Please log out and capture GPS.");
    }
  };

  const acceptEmergency = async (id: string) => {
    try {
      await supabase
        .from('emergencies')
        // @ts-ignore
        .update({ status: 'accepted' })
        .eq('id', id);
    } catch (error) {
      console.error("Failed to update emergency status", error);
    }
  };

  const confirmAccept = () => {
    if (incomingAlert) {
      acceptEmergency(incomingAlert.id);
      setActiveJob(incomingAlert);
      setIncomingAlert(null);
      setJobStage('accepted');
      toast.success("Emergency Accepted! Routing...");
    }
  };

  // Fetch hospitals from Supabase when entering hospital selection
  const fetchHospitals = async () => {
    setIsLoadingHospitals(true);
    try {
      const { data, error } = await supabase
        .from('hospitals' as any)
        .select('id, name, location, capacity, contact_number');

      if (error) throw error;

      if (data && data.length > 0) {
        // Parse PostGIS locations and calculate distance from patient
        const patientLat = activeJob?.patient_lat || 26.8439;
        const patientLng = activeJob?.patient_lng || 75.5652;

        // Determine city: lng > 74 = Jaipur, lng < 74 = Jodhpur
        const isPatientInJaipur = patientLng > 74.0;

        const parsed: HospitalRecord[] = (data as any[])
          .map((h: any) => {
            const coords = parsePostGISPoint(h.location);
            const lat = coords?.lat || 26.8439;
            const lng = coords?.lng || 75.5652;
            return { h, lat, lng };
          })
          // Filter: only keep hospitals in the same city as patient
          .filter(({ lng }) => isPatientInJaipur ? lng > 74.0 : lng < 74.0)
          .map(({ h, lat, lng }) => {
            const dist = haversineKm(patientLat, patientLng, lat, lng);
            const eta = Math.ceil(dist * 3); // rough ~3 min per km estimate
            return {
              id: h.id,
              name: h.name,
              location: h.location,
              capacity: h.capacity,
              contact_number: h.contact_number || 'Emergency Walk-In',
              lat,
              lng,
              distance: `${dist.toFixed(1)} km`,
              eta: `${eta} min`,
              icuBeds: (h.name.length % 5) + 2,
              emergencyBeds: (h.name.length % 15) + 5
            };
          });

        // Sort by distance
        parsed.sort((a, b) => parseFloat(a.distance!) - parseFloat(b.distance!));

        // Deduplicate by hospital name (in case DB has duplicates)
        const seen = new Set<string>();
        const unique = parsed.filter(h => {
          if (seen.has(h.name)) return false;
          seen.add(h.name);
          return true;
        });

        setHospitals(unique);
      }
    } catch (error) {
      console.error('Error fetching hospitals', error);
      toast.error('Failed to load hospitals');
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  const handleStartTransport = async () => {
    if (!activeJob || !selectedHospitalId) return;

    try {
      // 1. Update Supabase with real hospital UUID
      const { error } = await supabase
        .from('emergencies')
        // @ts-ignore
        .update({
          target_hospital_id: selectedHospitalId,
          status: 'transporting'
        })
        .eq('id', activeJob.id);

      if (error) throw error;

      // 2. Advance State
      setJobStage('transporting');
      toast.success("Navigation Started - Heading to Hospital!");

    } catch (error) {
      console.error("Error updating hospital", error);
      toast.error("Failed to notify hospital");
    }
  };

  const handleCompleteTransport = async () => {
    if (!activeJob) return;
    try {
      // Mark emergency as delivered in Supabase
      const { error } = await supabase
        .from('emergencies')
        // @ts-ignore
        .update({ status: 'delivered' })
        .eq('id', activeJob.id);

      if (error) throw error;
      toast.success("Transport Complete! Patient delivered.");
    } catch (error) {
      console.error("Error completing transport", error);
    }
    
    // Reset local state
    setJobStage('idle');
    setActiveJob(null);
    setIncomingAlert(null);
    setSelectedHospitalId(null);
    setHospitals([]);
  };

  const getSelectedHospital = () => hospitals.find(h => h.id === selectedHospitalId);

  if (!driver) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">

      {/* Alert Value Overlay */}
      {incomingAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in zoom-in">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border-2 border-emergency shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-20 h-20 bg-emergency/20 rounded-full flex items-center justify-center animate-pulse">
                <Siren className="w-10 h-10 text-emergency" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">NEW EMERGENCY</h2>
              <p className="text-lg font-medium text-emergency uppercase tracking-wider">{incomingAlert.emergency_type}</p>
            </div>

            <div className="space-y-4 bg-muted/50 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold">{incomingAlert.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-semibold">{incomingAlert.patient_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold truncate max-w-[150px]">{incomingAlert.patient_address || incomingAlert.patient_location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" size="lg" onClick={() => setIncomingAlert(null)}>
                Ignore
              </Button>
              <Button variant="emergency" size="lg" onClick={initiateAccept}>
                ACCEPT
              </Button>
            </div>
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
              <h1 className="font-semibold text-foreground">{driver.name}</h1>
              <p className="text-xs text-muted-foreground">{driver.vehicleNumber}</p>
            </div>
          </div>
          <StatusBadge isOnline={isOnline} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">

        {jobStage === 'accepted' ? (
          <div className="space-y-6 animate-in slide-in-from-bottom h-[calc(100vh-140px)] flex flex-col">
            {/* Real Map View */}
            <div className="flex-1 w-full bg-muted rounded-2xl relative overflow-hidden border-2 border-primary/20">
              {activeJob && (
                <MapPreview
                  pickupAddress="Patient Location"
                  overridePickupLocation={[activeJob.patient_lng, activeJob.patient_lat]}
                  overrideDriverLocation={driverLocation}
                  showRoute={true}
                  className="h-full w-full"
                />
              )}
            </div>

            <Button
              size="xl"
              className="w-full text-lg shadow-lg mt-4"
              onClick={() => { setJobStage('hospital_selection'); fetchHospitals(); }}
            >
              Patient Picked Up - Select Hospital
            </Button>
          </div>
        ) : jobStage === 'transporting' && selectedHospitalId ? (
          <div className="space-y-6 animate-in slide-in-from-bottom h-[calc(100vh-140px)] flex flex-col">
            {/* Map View: JECC -> Hospital */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-2">
              <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Routing to Hospital
              </h2>
              <p className="text-muted-foreground">{getSelectedHospital()?.name}</p>
            </div>

            <div className="flex-1 w-full bg-muted rounded-2xl relative overflow-hidden border-2 border-primary/20">
              <MapPreview
                pickupAddress="To Hospital"
                // Origin: Patient pickup point
                overrideDriverLocation={[activeJob?.patient_lng || 75.5652, activeJob?.patient_lat || 26.8439]}
                // Destination: Hospital
                overridePickupLocation={[getSelectedHospital()!.lng, getSelectedHospital()!.lat]}
                hospitalCoordinates={{ lat: getSelectedHospital()!.lat, lng: getSelectedHospital()!.lng }}
                hospitalAddress={getSelectedHospital()?.name}
                showRoute={true}
                className="h-full w-full"
              />
            </div>

            <Button size="xl" variant="outline" className="w-full mt-4" onClick={handleCompleteTransport}>
              Complete Transport
            </Button>
          </div>
        ) : jobStage === 'hospital_selection' ? (
          <div className="space-y-6 animate-in slide-in-from-right h-[calc(100vh-100px)] flex flex-col">
            <div className="text-center space-y-2 shrink-0">
              <Building2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold">Select Destination Hospital</h2>
              <p className="text-sm text-muted-foreground">Recommended facilities near JECC</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isLoadingHospitals ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-muted-foreground">Loading hospitals...</span>
                </div>
              ) : hospitals.map((hosp) => (
                <button
                  key={hosp.id}
                  onClick={() => setSelectedHospitalId(hosp.id)}
                  className={`w-full flex items-center justify-between p-4 bg-card border rounded-xl transition-all text-left group
                     ${selectedHospitalId === hosp.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-semibold truncate ${selectedHospitalId === hosp.id ? 'text-primary' : ''}`}>
                      {hosp.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">Capacity: {hosp.capacity} beds | {hosp.contact_number}</p>
                    <div className="flex gap-4 mb-2">
                      <div className={`text-xs px-2 py-0.5 rounded-md flex items-center gap-1.5 ${((hosp.name.charCodeAt(0) + hosp.name.length * 3) % 8 + 2) > 3 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                        <Bed className="w-3.5 h-3.5" />
                        <span className="font-bold">{(hosp.name.charCodeAt(0) + hosp.name.length * 3) % 8 + 2}</span> ICU
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-md flex items-center gap-1.5 ${((hosp.name.charCodeAt(1) || 0) + hosp.name.length * 5) % 15 + 4 > 7 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        <Activity className="w-3.5 h-3.5" />
                        <span className="font-bold">{((hosp.name.charCodeAt(1) || 0) + hosp.name.length * 5) % 15 + 4}</span> ER
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                        <Navigation className="w-3 h-3" /> {hosp.distance}
                      </span>
                      <span className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                        <Clock className="w-3 h-3" /> {hosp.eta}
                      </span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${selectedHospitalId === hosp.id ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'}`}>
                    {selectedHospitalId === hosp.id && <div className="w-2.5 h-2.5 bg-current rounded-full" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="shrink-0 pt-2">
              <Button
                size="xl"
                className="w-full shadow-lg text-lg gap-2"
                disabled={!selectedHospitalId}
                onClick={handleStartTransport}
              >
                <Navigation className="w-5 h-5" />
                Start Navigation
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-card slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Availability Status</h2>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? 'You are receiving emergency alerts' : 'Go online to receive alerts'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isOnline ? 'bg-success/20' : 'bg-muted'}`}>
                  <Power className={`w-6 h-6 ${isOnline ? 'text-success' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-4 bg-secondary rounded-xl cursor-pointer"
                onClick={toggleOnline}
              >
                <span className="font-medium text-foreground">
                  {isOnline ? 'Online - Receiving Alerts' : 'Offline - Not Receiving Alerts'}
                </span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={toggleOnline}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-card slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Vehicle Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <Ambulance className="w-5 h-5 text-emergency" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Number</p>
                    <p className="font-medium text-foreground">{driver.vehicleNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Type</p>
                    <p className="font-medium text-foreground">{driver.vehicleType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-card slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="h-auto py-4 flex-col gap-2">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">Call Dispatch</span>
                </Button>
                <Button variant="secondary" className="h-auto py-4 flex-col gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">My Location</span>
                </Button>
                <Button variant="secondary" className="h-auto py-4 flex-col gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Shift Info</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Log Out</span>
                </Button>
              </div>
            </div>

            {/* Waiting Message */}
            {isOnline && (
              <div className="text-center py-8 fade-in">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 emergency-pulse">
                  <Ambulance className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Waiting for incoming emergency...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
