import { useState } from 'react';
import { EmergencyAlert, AdmissionStatus } from '@/types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ArrowRightCircle, 
  HeartPulse, 
  ClipboardCheck,
  Ambulance
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ArrivalPanelProps {
  emergency: EmergencyAlert;
  onConfirmArrival: () => void;
  onUpdateAdmission: (status: AdmissionStatus) => void;
}

export function ArrivalPanel({ emergency, onConfirmArrival, onUpdateAdmission }: ArrivalPanelProps) {
  const { toast } = useToast();
  const [arrived, setArrived] = useState(emergency.status === 'arrived' || emergency.status === 'admitted');
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus | null>(null);

  const handleArrival = () => {
    setArrived(true);
    onConfirmArrival();
    toast({
      title: 'Arrival Confirmed',
      description: 'Patient has been marked as arrived at the hospital.',
    });
  };

  const handleAdmission = (status: AdmissionStatus) => {
    setAdmissionStatus(status);
    onUpdateAdmission(status);
    toast({
      title: 'Admission Updated',
      description: `Patient status updated to: ${status}`,
    });
  };

  const admissionOptions = [
    { 
      status: 'admitted' as AdmissionStatus, 
      label: 'Admitted', 
      icon: CheckCircle2,
      description: 'Patient admitted for treatment',
      color: 'bg-success hover:bg-success/90 text-foreground'
    },
    { 
      status: 'referred' as AdmissionStatus, 
      label: 'Referred', 
      icon: ArrowRightCircle,
      description: 'Patient referred to another facility',
      color: 'bg-warning hover:bg-warning/90 text-background'
    },
    { 
      status: 'stabilized' as AdmissionStatus, 
      label: 'Stabilized', 
      icon: HeartPulse,
      description: 'Emergency stabilized, further care planned',
      color: 'bg-info hover:bg-info/90 text-background'
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Patient Arrival & Admission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Arrival Confirmation */}
        {!arrived ? (
          <div className="p-6 rounded-lg bg-secondary/50 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Ambulance className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-semibold">Awaiting Arrival</p>
              <p className="text-sm text-muted-foreground">
                Ambulance ETA: {emergency.eta} minutes
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleArrival}
              className="w-full gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              Confirm Patient Arrival
            </Button>
          </div>
        ) : (
          <>
            {/* Arrival Confirmed Badge */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <p className="font-semibold text-success">Patient Arrived</p>
                <p className="text-xs text-muted-foreground">
                  Confirmed at {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Admission Status Selection */}
            {!admissionStatus ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Update Admission Status</p>
                <div className="grid gap-3">
                  {admissionOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.status}
                        variant="outline"
                        className={cn(
                          'h-auto p-4 justify-start gap-4 border-border/50',
                          'hover:border-primary/50 transition-all'
                        )}
                        onClick={() => handleAdmission(option.status)}
                      >
                        <div className={cn('p-2 rounded-lg', option.color.split(' ')[0] + '/20')}>
                          <Icon className={cn('h-5 w-5', option.color.includes('success') ? 'text-success' : option.color.includes('warning') ? 'text-warning' : 'text-info')} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="font-semibold text-primary">Case Completed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: <span className="capitalize font-medium">{admissionStatus}</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Digital Handover Summary */}
        {arrived && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Digital Handover Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient</span>
                <span>{emergency.patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emergency Type</span>
                <span className="capitalize">{emergency.emergencyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ambulance</span>
                <span className="font-mono">{emergency.ambulance.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paramedic</span>
                <span>{emergency.ambulance.paramedicName}</span>
              </div>
              {emergency.assignedUnit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Unit</span>
                  <span>{emergency.assignedUnit}</span>
                </div>
              )}
              {emergency.assignedDoctor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Doctor</span>
                  <span>{emergency.assignedDoctor}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
