import React from 'react';
import { EmergencyType, EMERGENCY_LABELS, EMERGENCY_ICONS } from '@/types/driver';
import { cn } from '@/lib/utils';

interface EmergencyTypeBadgeProps {
  type: EmergencyType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EmergencyTypeBadge: React.FC<EmergencyTypeBadgeProps> = ({ 
  type, 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-emergency/20 text-emergency font-semibold',
        sizeClasses[size],
        className
      )}
    >
      <span>{EMERGENCY_ICONS[type]}</span>
      <span>{EMERGENCY_LABELS[type]}</span>
    </div>
  );
};

export default EmergencyTypeBadge;
