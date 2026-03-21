import { cn } from '@/lib/utils';
import { EmergencySeverity, EmergencyType } from '@/types/hospital';
import { Heart, Car, Baby, Wind, AlertCircle } from 'lucide-react';

interface EmergencyBadgeProps {
  severity: EmergencySeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: EmergencyBadgeProps) {
  const severityConfig = {
    critical: { label: 'Critical', class: 'emergency-critical' },
    urgent: { label: 'Urgent', class: 'emergency-urgent' },
    moderate: { label: 'Moderate', class: 'emergency-moderate' },
    stable: { label: 'Stable', class: 'emergency-stable' },
  };

  const config = severityConfig[severity] || severityConfig['stable'];

  return (
    <span className={cn('emergency-badge', config.class, className)}>
      {config.label}
    </span>
  );
}

interface EmergencyTypeBadgeProps {
  type: EmergencyType;
  className?: string;
  showIcon?: boolean;
}

export function EmergencyTypeBadge({ type, className, showIcon = true }: EmergencyTypeBadgeProps) {
  const typeConfig = {
    accident: { label: 'Accident', icon: Car, color: 'text-emergency-critical' },
    cardiac: { label: 'Cardiac', icon: Heart, color: 'text-emergency-critical' },
    maternity: { label: 'Maternity', icon: Baby, color: 'text-emergency-urgent' },
    respiratory: { label: 'Respiratory', icon: Wind, color: 'text-emergency-urgent' },
    other: { label: 'Other', icon: AlertCircle, color: 'text-emergency-moderate' },
  };

  const config = typeConfig[type] || typeConfig['other'];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', config.color, className)}>
      {showIcon && <Icon className="h-4 w-4" />}
      <span className="font-medium">{config.label}</span>
    </div>
  );
}
