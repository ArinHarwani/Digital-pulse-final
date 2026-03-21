import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  seconds, 
  onComplete,
  className 
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const progress = (timeLeft / seconds) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className={cn('relative', className)}>
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={isUrgent ? 'hsl(var(--emergency))' : 'hsl(var(--primary))'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={cn(
              'text-2xl font-bold transition-colors duration-300',
              isUrgent ? 'text-emergency countdown-pulse' : 'text-foreground'
            )}
          >
            {timeLeft}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">seconds left</p>
    </div>
  );
};

export default CountdownTimer;
