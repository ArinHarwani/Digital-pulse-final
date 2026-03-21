import { EmergencyAlert } from '@/types/hospital';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeverityBadge, EmergencyTypeBadge } from '@/components/EmergencyBadge';
import { AmbulanceStatusIndicator } from '@/components/StatusIndicator';
import { Clock, Ambulance, User, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyCardProps {
  emergency: EmergencyAlert;
  onViewDetails: (id: string) => void;
  className?: string;
}

export function EmergencyCard({ emergency, onViewDetails, className }: EmergencyCardProps) {
  const isCritical = emergency.severity === 'critical';

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:border-primary/50',
      isCritical && 'border-destructive/50 shadow-critical',
      className
    )}>
      {isCritical && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-destructive via-destructive/80 to-destructive" />
      )}

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <EmergencyTypeBadge type={emergency.emergencyType} />
              <SeverityBadge severity={emergency.severity} />
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{emergency.patient.name}</span>
              </div>
              <span className="text-muted-foreground">
                {emergency.patient.age}y • {emergency.patient.gender}
              </span>
              {emergency.patient.bloodGroup && (
                <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                  {emergency.patient.bloodGroup}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {emergency.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Ambulance className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{emergency.ambulance.vehicleNumber}</span>
                </div>
                <AmbulanceStatusIndicator status={emergency.ambulance.status} />
              </div>
            </div>
          </div>

          {/* ETA & Action */}
          <div className="flex flex-col items-end gap-3">
            {emergency.status === 'arrived' || emergency.status === 'admitted' ? (
              <div className="text-right flex flex-col items-end">
                <span className="text-sm font-bold text-success uppercase tracking-wider mb-2">Hospital Reached</span>
              </div>
            ) : (
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">ETA</span>
                </div>
                <p className={cn(
                  'text-3xl font-bold font-mono',
                  emergency.eta <= 5 ? 'text-destructive' : 'text-foreground'
                )}>
                  {emergency.eta}
                  <span className="text-lg font-normal text-muted-foreground ml-1">min</span>
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 items-end">
              <Button
                onClick={() => onViewDetails(emergency.id)}
                className="gap-2"
                variant="default"
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </Button>
              {emergency.status !== 'arrived' && emergency.status !== 'admitted' && (
                <Button
                  onClick={() => onViewDetails(emergency.id)}
                  className="gap-2"
                  variant="secondary"
                >
                  Track Ambulance
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
