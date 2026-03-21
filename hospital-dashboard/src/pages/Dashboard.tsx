import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockHospital } from '@/data/mockData';
import { EmergencyAlert } from '@/types/hospital';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsPanel } from '@/components/StatsPanel';
import { EmergencyCard } from '@/components/EmergencyCard';
import { PatientProfile } from '@/components/PatientProfile';
import { AmbulanceTracker } from '@/components/AmbulanceTracker';
import { ArrivalPanel } from '@/components/ArrivalPanel';
import { MedAssistLookup } from '@/components/MedAssistLookup';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Parse PostGIS POINT string or object → { lng, lat }
function parsePostGISPoint(pointData: any): { lat: number; lng: number } | null {
  if (!pointData) return null;
  
  if (typeof pointData === 'object' && pointData.coordinates) {
    return { lng: pointData.coordinates[0], lat: pointData.coordinates[1] };
  }

  if (typeof pointData === 'string') {
    const match = pointData.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    
    try {
      const parsed = JSON.parse(pointData);
      if (parsed?.coordinates) return { lng: parsed.coordinates[0], lat: parsed.coordinates[1] };
    } catch { /* ignore */ }
  }
  return null;
}

interface DashboardProps {
  onLogout: () => void;
  hospital: any; // The hospital selected at login
}

// Parse PostGIS POINT string → { lng, lat }
function parseHospitalLocation(loc: any): { lat: number; lng: number } {
  if (!loc) return { lat: 26.8439, lng: 75.5652 }; // MUJ Jaipur default
  if (typeof loc === 'string') {
    const match = loc.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    try {
      const parsed = JSON.parse(loc);
      if (parsed?.coordinates) return { lng: parsed.coordinates[0], lat: parsed.coordinates[1] };
    } catch { /* ignore */ }
  }
  if (typeof loc === 'object' && loc.coordinates) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  return { lat: 26.8439, lng: 75.5652 };
}

export function Dashboard({ onLogout, hospital }: DashboardProps) {
  const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyAlert | null>(null);
  const [activeTab, setActiveTab] = useState('incoming');
  const { toast } = useToast();

  // Build a Hospital-shaped object from the Supabase row
  const HOSPITAL_DATA = {
    ...mockHospital,
    id: hospital?.id || 'd03270cc-acca-4634-bd61-22dbf116554c',
    name: hospital?.name || 'Hospital Portal',
    emergencyContact: hospital?.contact_number || 'N/A',
    location: hospital?.name || 'Jodhpur, Rajasthan',
  };

  // Parse hospital coordinates from PostGIS location column
  const hospitalCoords = parseHospitalLocation(hospital?.location);

  const incomingEmergencies = emergencies.filter(e => e.status === 'incoming');
  const arrivedEmergencies = emergencies.filter(e => e.status === 'arrived' || e.status === 'admitted');

  const handleViewDetails = (id: string) => {
    const emergency = emergencies.find(e => e.id === id);
    if (emergency) {
      setSelectedEmergency(emergency);
    }
  };

  const processIncomingRequest = async (requestData: any) => {
    try {
      console.log(`Processing request ${requestData.id}`);

      // Fetch Medical Profile & History from MedAssist
      let medicalProfile: any = null;
      let patientRecords: any[] = [];
      let patientMedicines: any[] = [];
      let patientIdForLookup = requestData.user_id;

      // 1. If we don't have user_id but have medassist_key, find the patient
      if (!patientIdForLookup && requestData.medassist_key) {
        try {
          const { data: pData } = await supabase
            .from('patients' as any)
            .select('*')
            .eq('unique_key', requestData.medassist_key)
            .maybeSingle();
            
          if (pData) {
            const patient = pData as any;
            medicalProfile = {
              age: patient.age,
              blood_group: patient.blood_type,
              allergies: '',
              medical_conditions: Array.isArray(patient.medical_conditions) 
                ? patient.medical_conditions.join(', ') : '',
              important_medical_info: `Phone: ${patient.phone_number || ''}`
            };
            if (patient.name) {
              requestData.patient_name = patient.name;
            }
          }
        } catch (err) {
          console.warn('Could not fetch patient data', err);
        }
      }

      // 2. Fetch Profile, Records, and Medicines
      if (patientIdForLookup) {
        try {
          const [profRes, recRes, medRes] = await Promise.all([
            supabase.from('medical_profiles' as any).select('*').eq('user_id', patientIdForLookup).maybeSingle(),
            supabase.from('records' as any).select('*').eq('user_id', patientIdForLookup),
            supabase.from('medicines' as any).select('*').eq('user_id', patientIdForLookup)
          ]);

          if (profRes.data) medicalProfile = profRes.data;
          if (recRes.data) patientRecords = recRes.data as any[];
          if (medRes.data) patientMedicines = medRes.data as any[];
        } catch (err) {
          console.warn('Could not fetch medical history', err);
        }
      }

      // Parse PostGIS patient_location
      const coords = parsePostGISPoint(requestData.patient_location);
      const pLat = requestData.patient_lat || coords?.lat || 26.8439;
      const pLng = requestData.patient_lng || coords?.lng || 75.5652;

      // Handle Allergies: DB Text -> String Array
      let allergyArray: string[] = [];
      if (medicalProfile?.allergies) {
        allergyArray = medicalProfile.allergies.split(',').map((s: string) => s.trim());
      }

      // Fetch User Name if requestData name is generic or missing
      let finalName = requestData.patient_name || 'Unknown Patient';
      if ((!finalName || finalName === 'Unknown Patient') && patientIdForLookup) {
        const { data: userData } = await supabase
          .from('users' as any)
          .select('name, username')
          .eq('id', patientIdForLookup)
          .maybeSingle();
        if (userData) {
          finalName = (userData as any).name || (userData as any).username || finalName;
        }
      }

      // Age Extraction Logic
      let finalAge = medicalProfile?.age || 0;

      // Clean the text for display
      let finalImportantInfo = medicalProfile?.important_medical_info || '';
      finalImportantInfo = finalImportantInfo.replace(/\[Age: \d+\]\s*/, '');

      let mappedStatus: 'incoming' | 'arrived' | 'preparing' | 'admitted' = 'incoming';
      let ambStatus: 'en_route' | 'arriving_soon' | 'arrived' = 'en_route';
      let mappedEta = 15;

      if (['arrived', 'delivered', 'admitted', 'completed'].includes(requestData.status)) {
         mappedStatus = 'arrived';
         ambStatus = 'arrived';
         mappedEta = 0;
      }

      const newAlert: EmergencyAlert = {
        id: requestData.id,
        emergencyType: requestData.emergency_type || 'other',
        severity: 'critical',
        patient: {
          id: patientIdForLookup || `pat-${Date.now()}`,
          name: finalName,
          age: finalAge,
          gender: medicalProfile?.gender || requestData.patient_gender || 'other',
          emergencyContact: requestData.patient_phone || 'Ask Patient',
          bloodGroup: medicalProfile?.blood_group || medicalProfile?.blood_type || 'Unknown',
          allergies: allergyArray,
          conditions: medicalProfile?.medical_conditions,
          importantInfo: finalImportantInfo,
          medassistKey: requestData.medassist_key,
          records: patientRecords,
          medicines: patientMedicines
        },
        ambulance: {
          id: 'amb-live',
          vehicleNumber: 'RJ-14-EA-1234',
          driverName: 'Manish Kumar',
          paramedicName: 'TBD',
          contactNumber: requestData.patient_phone || '',
          currentLocation: {
            lat: pLat,
            lng: pLng
          },
          status: ambStatus
        },
        eta: mappedEta,
        createdAt: new Date(requestData.created_at),
        description: `Incoming ${requestData.emergency_type || 'Emergency'} - from ${requestData.patient_address || 'Detected Location'}`,
        status: mappedStatus
      };

      setEmergencies(prev => {
        // If it exists, update it so status changes trigger UI updates
        if (prev.some(e => e.id === newAlert.id)) {
           return prev.map(e => e.id === newAlert.id ? newAlert : e);
        }
        return [newAlert, ...prev];
      });

      // Show toast if recent (last 5 mins)
      const isRecent = (new Date().getTime() - new Date(requestData.created_at).getTime()) < 5 * 60 * 1000;
      if (isRecent) {
        toast({
          title: "🚨 INCOMING EMERGENCY!",
          description: `${requestData.patient_name || 'Patient'} is en route.`,
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (e) {
      console.error("Error processing incoming request:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchEmergencies = async () => {
      try {
        const query = supabase
          .from('emergencies' as any)
          .select('*')
          .in('status', ['transporting', 'delivered', 'pending', 'accepted'])
          .order('created_at', { ascending: false });

        if (hospital?.id) {
          query.eq('target_hospital_id', hospital.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (mounted && data && data.length > 0) {
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const recentData = (data as any[]).filter((req: any) => {
            return new Date(req.created_at) > twoHoursAgo;
          });

          for (const req of recentData.slice(0, 5)) {
            await processIncomingRequest(req);
          }
        }
      } catch (e) {
        console.error("Error fetching emergencies:", e);
      }
    };

    setEmergencies([]);
    fetchEmergencies();

    // Polling fallback every 10s to catch missed real-time events
    const pollInterval = setInterval(() => {
      if (mounted) fetchEmergencies();
    }, 10000);

    // Real-time subscription
    const channel = supabase
      .channel('hospital-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergencies' },
        async (payload) => {
          if (!mounted) return;
          try {
            const newEmergency = payload.new as any;
            if (hospital?.id && newEmergency.target_hospital_id && newEmergency.target_hospital_id !== hospital.id) {
              return;
            }
            await processIncomingRequest(newEmergency);
          } catch (e) {
            console.error("Error handling real-time INSERT:", e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'emergencies' },
        async (payload) => {
          if (!mounted) return;
          try {
            const updated = payload.new as any;
            if (updated.status === 'transporting') {
              if (hospital?.id && updated.target_hospital_id && updated.target_hospital_id !== hospital.id) {
                return;
              }
              await processIncomingRequest(updated);
            }
            if (updated.status === 'delivered') {
              setEmergencies(prev =>
                prev.map(e => e.id === updated.id ? { ...e, status: 'arrived' } : e)
              );
              toast({
                title: "🏥 Patient Arrived!",
                description: `Ambulance has reached the hospital.`,
                duration: 5000
              });
            }
          } catch (e) {
            console.error("Error handling real-time UPDATE:", e);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [hospital?.id]);

  const handleUpdateEmergency = (updates: Partial<EmergencyAlert>) => {
    if (!selectedEmergency) return;
    const updated = { ...selectedEmergency, ...updates };
    setEmergencies(prev => prev.map(e => e.id === updated.id ? updated : e));
    setSelectedEmergency(updated);
  };

  const handleConfirmArrival = () => { handleUpdateEmergency({ status: 'arrived' }); };
  const handleUpdateAdmission = () => { handleUpdateEmergency({ status: 'admitted' }); };

  if (selectedEmergency) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          hospital={HOSPITAL_DATA}
          alertCount={incomingEmergencies.length}
          onLogout={onLogout}
        />
        <main className="container px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedEmergency(null)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ErrorBoundary>
                <PatientProfile emergency={selectedEmergency} />
              </ErrorBoundary>
              <ErrorBoundary>
                <AmbulanceTracker emergency={selectedEmergency} hospitalLocation={hospitalCoords} />
              </ErrorBoundary>
            </div>

            <div className="space-y-6">
              <ArrivalPanel
                emergency={selectedEmergency}
                onConfirmArrival={handleConfirmArrival}
                onUpdateAdmission={handleUpdateAdmission}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        hospital={HOSPITAL_DATA}
        alertCount={incomingEmergencies.length}
        onLogout={onLogout}
      />

      <main className="container px-4 py-6 space-y-6">
        <StatsPanel
          hospital={HOSPITAL_DATA}
          activeEmergencies={emergencies.length}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-secondary/50">
            <TabsTrigger value="incoming" className="gap-2 data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Incoming
              {incomingEmergencies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {incomingEmergencies.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="arrived" className="gap-2 data-[state=active]:bg-success/20 data-[state=active]:text-success">
              <CheckCircle className="h-4 w-4" />
              Arrived
              {arrivedEmergencies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-success text-foreground">
                  {arrivedEmergencies.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="medassist" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <CreditCard className="h-4 w-4" />
              Digital Pulse Key
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4 animate-fade-in">
            {incomingEmergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No incoming emergencies</p>
              </div>
            ) : (
              incomingEmergencies.map((emergency, index) => (
                <div
                  key={emergency.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <EmergencyCard
                    emergency={emergency}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="arrived" className="space-y-4 animate-fade-in">
            {arrivedEmergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No arrived patients</p>
              </div>
            ) : (
              arrivedEmergencies.map((emergency, index) => (
                <div
                  key={emergency.id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <EmergencyCard
                    emergency={emergency}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="medassist" className="animate-in fade-in duration-500">
            <MedAssistLookup hospitalId={HOSPITAL_DATA.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
