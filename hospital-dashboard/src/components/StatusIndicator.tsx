import { cn } from '@/lib/utils';
import { AmbulanceStatus } from '@/types/hospital';

interface StatusIndicatorProps {
  status: AmbulanceStatus;
  className?: string;
}

export function AmbulanceStatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusConfig = {
    en_route: { 
      label: 'On the Way', 
      dotClass: 'bg-info',
      textClass: 'text-info',
      pulseClass: 'bg-info/50'
    },
    arriving_soon: { 
      label: 'Arriving Soon', 
      dotClass: 'bg-warning',
      textClass: 'text-warning',
      pulseClass: 'bg-warning/50'
    },
    arrived: { 
      label: 'Arrived', 
      dotClass: 'bg-success',
      textClass: 'text-success',
      pulseClass: 'bg-success/50'
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <span className={cn('block h-2.5 w-2.5 rounded-full', config.dotClass)} />
        <span className={cn(
          'absolute inset-0 h-2.5 w-2.5 rounded-full animate-pulse-ring',
          config.pulseClass
        )} />
      </div>
      <span className={cn('text-sm font-medium', config.textClass)}>
        {config.label}
      </span>
    </div>
  );
}
