import { Hospital } from '@/types/hospital';
import { Bed, Heart, Baby, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  hospital: Hospital;
  activeEmergencies: number;
}

export function StatsPanel({ hospital, activeEmergencies }: StatsPanelProps) {
  const stats = [
    {
      label: 'Active Emergencies',
      value: activeEmergencies,
      icon: Users,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Emergency Beds',
      value: hospital.bedAvailability.emergency,
      icon: Bed,
      color: 'text-emergency-urgent',
      bgColor: 'bg-emergency-urgent/10',
    },
    {
      label: 'ICU Beds',
      value: hospital.bedAvailability.icu,
      icon: Heart,
      color: 'text-emergency-critical',
      bgColor: 'bg-emergency-critical/10',
    },
    {
      label: 'Maternity Beds',
      value: hospital.bedAvailability.maternity,
      icon: Baby,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', stat.bgColor)}>
                <Icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
