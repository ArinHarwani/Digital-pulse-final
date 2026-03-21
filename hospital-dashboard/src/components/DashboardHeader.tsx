import { Hospital } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  hospital: Hospital;
  alertCount: number;
  onLogout: () => void;
}

export function DashboardHeader({ hospital, alertCount, onLogout }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Hospital Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{hospital.name}</h1>
            <p className="text-xs text-muted-foreground">{hospital.location}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center',
                'rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground',
                alertCount > 0 && 'animate-pulse'
              )}>
                {alertCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
