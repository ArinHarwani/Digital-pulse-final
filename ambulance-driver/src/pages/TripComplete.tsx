import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, MapPin, Hospital, Ambulance } from 'lucide-react';

const TripComplete: React.FC = () => {
  const { currentTrip, isLoggedIn, completeTrip } = useDriver();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
  }, [isLoggedIn, navigate]);

  const handleEndTrip = () => {
    completeTrip();
    navigate('/dashboard');
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (!currentTrip?.acceptedAt || !currentTrip?.completedAt) {
      return '-- min';
    }
    const diff = currentTrip.completedAt.getTime() - currentTrip.acceptedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Trip Completed</h1>
          <Button onClick={() => navigate('/dashboard')} className="mt-6">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { emergency } = currentTrip;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Success Header */}
      <div className="bg-success/10 p-8 text-center">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-success-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Trip Completed</h1>
        <p className="text-muted-foreground">Patient successfully transported</p>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Trip Summary */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4">Trip Summary</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Ambulance className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trip ID</p>
                <p className="font-medium text-foreground">{currentTrip.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trip Duration</p>
                <p className="font-medium text-foreground">{getTripDuration()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emergency/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emergency" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pickup Location</p>
                <p className="font-medium text-foreground text-sm">{emergency.pickupAddress}</p>
              </div>
            </div>

            {emergency.hospitalName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <Hospital className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Hospital</p>
                  <p className="font-medium text-foreground text-sm">{emergency.hospitalName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
          
          <div className="space-y-4">
            {currentTrip.acceptedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-sm text-foreground ml-auto">
                  {currentTrip.acceptedAt.toLocaleTimeString()}
                </p>
              </div>
            )}
            {currentTrip.arrivedPickupAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <p className="text-sm text-muted-foreground">Arrived at Pickup</p>
                <p className="text-sm text-foreground ml-auto">
                  {currentTrip.arrivedPickupAt.toLocaleTimeString()}
                </p>
              </div>
            )}
            {currentTrip.startedTransportAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <p className="text-sm text-muted-foreground">Started Transport</p>
                <p className="text-sm text-foreground ml-auto">
                  {currentTrip.startedTransportAt.toLocaleTimeString()}
                </p>
              </div>
            )}
            {currentTrip.completedAt && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-sm text-foreground ml-auto">
                  {currentTrip.completedAt.toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Action Button */}
      <div className="p-4 bg-card border-t border-border">
        <Button 
          variant="success" 
          size="full" 
          onClick={handleEndTrip}
        >
          End Trip & Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TripComplete;
