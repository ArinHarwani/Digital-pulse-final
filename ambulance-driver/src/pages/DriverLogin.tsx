import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ambulance, Phone, IdCard, Locate, MapPin, Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const DriverLogin: React.FC = () => {
  const [driverId, setDriverId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const { login } = useDriver();
  const navigate = useNavigate();
  const { toast } = useToast();

  const JAIPUR_HOSPITALS = [
    { id: 'j1', name: 'Balaji Soni Hospital', location: { lat: 26.811, lng: 75.573 } },
    { id: 'j2', name: 'Jaipur Vatika Hospital', location: { lat: 26.829, lng: 75.647 } },
    { id: 'j3', name: 'Manas Hospital', location: { lat: 26.896, lng: 75.733 } },
    { id: 'j4', name: 'Manipal Hospital Jaipur', location: { lat: 26.960, lng: 75.780 } },
    { id: 'j5', name: 'Manidweep Hospital', location: { lat: 26.816, lng: 75.543 } },
    { id: 'j6', name: 'Bhardwaj Hospital', location: { lat: 26.821, lng: 75.543 } },
    { id: 'j7', name: 'Agrawal Heart & General Hospital', location: { lat: 26.818, lng: 75.542 } }
  ];

  const JODHPUR_HOSPITALS = [
    { id: 'jd1', name: 'JMCH (JIET Medical College)', location: { lat: 26.1491, lng: 73.0426 } },
    { id: 'jd2', name: 'Vyas Hospital (Medicity)', location: { lat: 26.1954, lng: 73.0591 } },
    { id: 'jd3', name: 'AIIMS Jodhpur', location: { lat: 26.2387, lng: 73.0077 } },
    { id: 'jd4', name: 'Medipulse Hospital', location: { lat: 26.2338, lng: 73.0085 } },
    { id: 'jd5', name: 'Induscare Hospital', location: { lat: 26.1394, lng: 73.0534 } },
    { id: 'jd6', name: 'Kudi Hospital', location: { lat: 26.1921, lng: 73.0434 } }
  ];

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS Not Supported', description: 'Please enter location manually.', variant: 'destructive' });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        setLocationCaptured([longitude, latitude]);
        setIsLocating(false);
        // Reverse geocode with Mapbox
        try {
          const token = import.meta.env.VITE_MAPBOX_TOKEN;
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`
          );
          const data = await res.json();
          const place = data.features?.[0]?.place_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocationLabel(place);
        } catch {
          setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        toast({ title: '📍 Location Captured', description: 'Your starting location is set.' });
      },
      (err) => {
        setIsLocating(false);
        toast({ title: 'GPS Error', description: err.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverId || !phone) {
      toast({ title: 'Missing Information', description: 'Please enter your Driver ID and phone number.', variant: 'destructive' });
      return;
    }

    if (!locationCaptured) {
      toast({ title: 'Location Required', description: 'Please share your GPS location to continue.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    login(driverId, phone, locationCaptured);
    toast({ title: 'Login Successful', description: 'Welcome! You are ready to receive alerts.' });
    navigate('/dashboard');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-8 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emergency to-emergency/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-emergency">
            <Ambulance className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Driver Portal</h1>
          <p className="text-muted-foreground mt-1">Emergency Response System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 slide-up">
          {/* Driver ID */}
          <div className="space-y-2">
            <Label htmlFor="driverId" className="text-foreground">Driver ID</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="driverId"
                type="text"
                placeholder="Enter your Driver ID"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="pl-11 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9000000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-11 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* GPS Location */}
          <div className="space-y-4">
            <Label className="text-foreground">Your Starting Location</Label>
            
            {/* Hospital Dropdown for Demo */}
            <div className="space-y-4 pb-2 border-b border-border/50">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Select Base City</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="pl-10 w-full bg-secondary border-border h-11">
                      <SelectValue placeholder="Choose a City" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="Jaipur">Jaipur</SelectItem>
                      <SelectItem value="Jodhpur">Jodhpur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCity && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Select a Hospital to start from</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      onValueChange={(val) => {
                        const list = selectedCity === 'Jaipur' ? JAIPUR_HOSPITALS : JODHPUR_HOSPITALS;
                        const h = list.find(hosp => hosp.id === val);
                        if (h) {
                          setLocationCaptured([h.location.lng, h.location.lat]);
                          setLocationLabel(h.name);
                        }
                      }}
                    >
                      <SelectTrigger className="pl-10 w-full bg-secondary border-border h-11">
                        <SelectValue placeholder="Choose a Starting Hospital" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {(selectedCity === 'Jaipur' ? JAIPUR_HOSPITALS : JODHPUR_HOSPITALS).map(hosp => (
                          <SelectItem key={hosp.id} value={hosp.id}>{hosp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {locationCaptured ? (
              <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/30 rounded-xl">
                <MapPin className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-success">Location Ready ✓</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{locationLabel || 'Hospital Coordinates Set'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0"
                >
                  Auto-GPS
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="full"
                className="h-12 gap-2"
                onClick={handleGetGPS}
                disabled={isLocating}
              >
                {isLocating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Locate className="w-5 h-5" />
                )}
                {isLocating ? 'Getting Location...' : 'Use Auto GPS'}
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="emergency"
            size="full"
            disabled={isLoading || !locationCaptured}
          >
            {isLoading ? 'Signing In...' : 'Sign In & Go On Duty'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Contact dispatch if you need help accessing your account
          </p>
        </form>
      </div>

      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">Emergency Response Driver App v2.0</p>
      </div>
    </div>
  );
};

export default DriverLogin;
