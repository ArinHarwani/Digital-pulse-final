import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import { Button } from '@/components/ui/button';
import MapPreview from '@/components/driver/MapPreview';
import EmergencyTypeBadge from '@/components/driver/EmergencyTypeBadge';
import CountdownTimer from '@/components/driver/CountdownTimer';
import { MapPin, Clock, Ruler, Phone, X, Check } from 'lucide-react';

const EmergencyAlert: React.FC = () => {
  const { 
    currentEmergency, 
    isLoggedIn, 
    acceptEmergency, 
    rejectEmergency 
  } = useDriver();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    if (!currentEmergency) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, currentEmergency, navigate]);

  const handleAccept = () => {
    acceptEmergency();
    navigate('/dispatch');
  };

  const handleReject = () => {
    rejectEmergency();
    navigate('/dashboard');
  };

  const handleTimeout = () => {
    rejectEmergency();
    navigate('/dashboard');
  };

  if (!currentEmergency) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Emergency Header */}
      <div className="bg-emergency/10 border-b border-emergency/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emergency rounded-full emergency-pulse" />
            <span className="font-bold text-emergency text-lg">INCOMING EMERGENCY</span>
          </div>
          <CountdownTimer seconds={30} onComplete={handleTimeout} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Emergency Type */}
        <div className="text-center slide-up">
          <EmergencyTypeBadge type={currentEmergency.type} size="lg" />
        </div>

        {/* Map Preview */}
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <MapPreview 
            pickupAddress={currentEmergency.pickupAddress}
            className="h-48"
          />
        </div>

        {/* Location Details */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-card slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emergency/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-emergency" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
              <p className="font-medium text-foreground">{currentEmergency.pickupAddress}</p>
            </div>
          </div>
        </div>

        {/* Distance & Time */}
        <div className="grid grid-cols-2 gap-3 slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-card rounded-xl p-4 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Ruler className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-bold text-foreground text-lg">{currentEmergency.estimatedDistance}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ETA</p>
                <p className="font-bold text-foreground text-lg">{currentEmergency.estimatedTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Info */}
        {currentEmergency.emergencyInfo && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 slide-up" style={{ animationDelay: '0.25s' }}>
            <p className="text-sm font-medium text-warning mb-1">Emergency Information</p>
            <p className="text-foreground text-sm">{currentEmergency.emergencyInfo}</p>
          </div>
        )}

        {/* Patient Contact */}
        {currentEmergency.patientPhone && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-card slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient/Bystander</p>
                  <p className="font-medium text-foreground">{currentEmergency.patientPhone}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Call
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Action Buttons */}
      <div className="p-4 bg-card border-t border-border space-y-3 slide-up" style={{ animationDelay: '0.35s' }}>
        <Button 
          variant="emergency" 
          size="full" 
          onClick={handleAccept}
          className="gap-3"
        >
          <Check className="w-6 h-6" />
          Accept Emergency
        </Button>
        <Button 
          variant="outline" 
          size="full" 
          onClick={handleReject}
          className="text-muted-foreground"
        >
          <X className="w-5 h-5 mr-2" />
          Reject
        </Button>
      </div>

      {/* Pulsing border effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-1 bg-emergency emergency-pulse" />
      </div>
    </div>
  );
};

export default EmergencyAlert;
