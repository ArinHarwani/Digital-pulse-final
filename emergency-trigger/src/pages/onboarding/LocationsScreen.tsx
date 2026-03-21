import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Home, Briefcase, MapPin, Plus, Check, Navigation, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { SavedLocation } from '@/types';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center when coordinates change
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

// Map Selector Component
const MapSelector = ({
  lat,
  lng,
  onLocationSelect
}: {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void
}) => {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat, lng));

  // Update local position when props change
  React.useEffect(() => {
    setPosition(new L.LatLng(lat, lng));
  }, [lat, lng]);

  const markerRef = React.useRef<L.Marker>(null);

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onLocationSelect(newPos.lat, newPos.lng);
        }
      },
    }),
    [onLocationSelect]
  );

  return (
    <div className="h-[200px] w-full rounded-xl overflow-hidden border border-border mt-3 z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <ChangeView center={[lat, lng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
        />
        <Marker
          position={position}
          draggable={true}
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
      </MapContainer>
    </div>
  );
};

interface LocationCardProps {
  icon: React.ElementType;
  type: 'home' | 'work' | 'frequent';
  label: string;
  address: string;
  isSet: boolean;
  onEdit: () => void;
}

const LocationCard = ({ icon: Icon, type, label, address, isSet, onEdit }: LocationCardProps) => (
  <button
    onClick={onEdit}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${isSet
      ? 'bg-medical-light border-medical'
      : 'bg-card border-border hover:border-muted-foreground/30'
      }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSet ? 'bg-medical text-success-foreground' : 'bg-muted text-muted-foreground'
      }`}>
      {isSet ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className={`text-sm truncate ${isSet ? 'text-foreground' : 'text-muted-foreground'}`}>
        {isSet ? address : `Add your ${type} location`}
      </p>
    </div>
    {!isSet && <Plus className="w-5 h-5 text-muted-foreground" />}
  </button>
);

const LocationsScreen = () => {
  const navigate = useNavigate();
  const { setOnboardingStep, setIsOnboardingComplete, setUser, setVerificationStatus, verificationStatus } = useApp();
  const { toast } = useToast();

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [editingType, setEditingType] = useState<'home' | 'work' | 'frequent' | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Default to Mumbai coordinates if no location set
  const displayLat = currentCoordinates?.lat || 19.076;
  const displayLng = currentCoordinates?.lng || 72.877;

  const getLocation = (type: 'home' | 'work' | 'frequent') =>
    locations.find(l => l.type === type);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`,
        {
          headers: {
            'User-Agent': 'RoadResQ Emergency App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address from location');
      }

      const data = await response.json();
      const placeName = data.features?.[0]?.place_name || 'Unknown Location';
      setAddressInput(placeName);
      return data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: "Address Lookup Failed",
        description: "Could not fetch address for this location",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      await reverseGeocode(latitude, longitude);

      setCurrentCoordinates({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);

      setVerificationStatus({ ...verificationStatus, gps: 'enabled' });

      toast({
        title: "Location Detected",
        description: "Your current address has been automatically filled",
      });
    } catch (error) {
      console.error('Location error:', error);

      let errorMessage = 'Unable to get your current location';

      if (error instanceof GeolocationPositionError) {
        // ... (error handling remains same)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveLocation = () => {
    if (!addressInput || !editingType) return;

    const newLocation: SavedLocation = {
      id: Date.now().toString(),
      type: editingType,
      label: editingType.charAt(0).toUpperCase() + editingType.slice(1),
      address: addressInput,
      coordinates: {
        ...(currentCoordinates || { lat: 19.076, lng: 72.877 }),
        accuracy: locationAccuracy || undefined
      },
    };

    setLocations([...locations.filter(l => l.type !== editingType), newLocation]);
    setEditingType(null);
    setAddressInput('');
    setCurrentCoordinates(null); // Reset coordinates
    setLocationAccuracy(null); // Reset accuracy

    toast({
      title: "Location Saved",
      description: `Your ${editingType} location has been saved`,
    });
  };

  const handleComplete = async () => {
    if (locations.length === 0) {
      toast({
        title: "Add at least one location",
        description: "Please save at least one location to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Get stored user details from registration step
    const storedName = sessionStorage.getItem('pendingName') || 'User';
    const storedPhone = sessionStorage.getItem('pendingPhone') || '';
    const userId = sessionStorage.getItem('userId');

    if (!userId) {
      toast({
        title: "Error",
        description: "User session not found. Please log in again.",
        variant: "destructive",
      });
      navigate('/onboarding/register');
      return;
    }

    try {
      // 1. Prepare user object
      const userData = {
        name: storedName,
        phone: storedPhone.replace('+91', ''),
        saved_locations: locations,
        profile_complete: true,
      };

      // 2. Update Supabase User by ID
      const { data, error } = await supabase
        .from('users' as any)
        .update(userData)
        .eq('id', userId)
        .select() // Ensure we get the updated row back
        .single();

      if (error) throw error;

      if (data) {
        // 3. Update Global State
        setUser({
          id: data.id,
          name: data.name,
          phone: data.phone,
          abhaLinked: verificationStatus.abha === 'verified',
          savedLocations: locations,
          profileComplete: true,
        });

        // Clear session storage
        sessionStorage.removeItem('pendingName');
        sessionStorage.removeItem('pendingPhone');
        // Keep userId in session in case generic session management needs it, or strictly clear it? 
        // Best to keep userId for "remember me" logic if app uses session storage for persistence.

        setIsOnboardingComplete(true);

        toast({
          title: "Setup Complete! 🎉",
          description: "Traffic data saved successfully.",
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/home');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error Saving Profile",
        description: "Could not save your details to the database (Update failed).",
        variant: "destructive",
      });

      // Fallback: Proceed locally if strictly needed, but better to prevent proceeding if DB sync fails
      // setUser({
      //   id: userId,
      //   name: storedName,
      //   phone: storedPhone,
      //   abhaLinked: verificationStatus.abha === 'verified',
      //   savedLocations: locations,
      //   profileComplete: true,
      // });
      // setIsOnboardingComplete(true);
      // navigate('/home');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Saved Locations</h1>
            <p className="text-sm text-muted-foreground">Step 4 of 4</p>
          </div>
        </div>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* Progress Indicator */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="h-1.5 flex-1 rounded-full bg-emergency"
            />
          ))}
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-safe-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-safe" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Save Your Locations</h2>
          <p className="text-muted-foreground">
            Pre-saved locations help us respond faster during emergencies
          </p>
        </div>

        {/* Edit Modal */}
        {editingType && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 animate-scale-in">
            <h3 className="font-semibold text-foreground capitalize">
              Add {editingType} Location
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter full address"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="h-12 rounded-xl bg-muted border-0"
              />
              <Button
                variant="safe-outline"
                size="default"
                className="w-full"
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Use Current Location
              </Button>

              {currentCoordinates && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1 animate-fade-in">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Latitude:</span>
                    <span className="font-mono text-foreground">{currentCoordinates.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Longitude:</span>
                    <span className="font-mono text-foreground">{currentCoordinates.lng.toFixed(6)}</span>
                  </div>
                  {locationAccuracy && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Accuracy:</span>
                      <span className="font-mono text-foreground">±{Math.round(locationAccuracy)}m</span>
                    </div>
                  )}
                </div>
              )}

              {/* Map Display */}
              <MapSelector
                lat={displayLat}
                lng={displayLng}
                onLocationSelect={(lat, lng) => {
                  setCurrentCoordinates({ lat, lng });
                  // Clear accuracy since manual drag might not have same GPS accuracy
                  setLocationAccuracy(null);
                  // Automatically update address
                  reverseGeocode(lat, lng);
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setEditingType(null);
                  setAddressInput('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="safe"
                className="flex-1"
                onClick={handleSaveLocation}
                disabled={!addressInput}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Location Cards */}
        {!editingType && (
          <div className="space-y-3">
            <LocationCard
              icon={Home}
              type="home"
              label="Home"
              address={getLocation('home')?.address || ''}
              isSet={!!getLocation('home')}
              onEdit={() => setEditingType('home')}
            />
            <LocationCard
              icon={Briefcase}
              type="work"
              label="Work"
              address={getLocation('work')?.address || ''}
              isSet={!!getLocation('work')}
              onEdit={() => setEditingType('work')}
            />
            <LocationCard
              icon={MapPin}
              type="frequent"
              label="Frequent Place"
              address={getLocation('frequent')?.address || ''}
              isSet={!!getLocation('frequent')}
              onEdit={() => setEditingType('frequent')}
            />
          </div>
        )}
      </div>

      {/* Complete Button */}
      {!editingType && (
        <div className="px-6 pb-8 mt-auto">
          <Button
            variant="emergency"
            size="xl"
            className="w-full"
            onClick={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </div>
      )}
    </MobileLayout>
  );
};

export default LocationsScreen;
