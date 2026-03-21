import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isOnline: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isOnline, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
        isOnline 
          ? 'bg-success/20 text-success' 
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full transition-all duration-300',
          isOnline 
            ? 'bg-success status-pulse' 
            : 'bg-muted-foreground'
        )}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
};

export default StatusBadge;
