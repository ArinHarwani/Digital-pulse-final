import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
}

export const MobileLayout = ({
  children,
  className,
  showHeader = false,
  headerContent,
  footer,
}: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {showHeader && headerContent && (
        <header className="sticky top-0 z-50 bg-card/70 backdrop-blur-md border-b border-white/20 shadow-sm px-4 py-3">
          {headerContent}
        </header>
      )}
      <main className={cn("flex-1 overflow-y-auto relative z-10", className)}>
        {children}
      </main>
      {footer && (
        <footer className="sticky bottom-0 z-50 bg-card/70 backdrop-blur-md border-t border-white/20 shadow-lg">
          {footer}
        </footer>
      )}
    </div>
  );
};

