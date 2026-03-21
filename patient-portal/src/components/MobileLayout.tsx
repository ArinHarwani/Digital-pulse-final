import React from 'react';

// Basic className utility since we don't have clsx/tailwind-merge here by default
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

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
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden" style={{ backgroundColor: '#000' }}>
      {/* Animated Background Blobs - matching the original */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-900 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-900 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {showHeader && headerContent && (
        <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10 shadow-sm px-4 py-3">
          {headerContent}
        </header>
      )}
      <main className={cn("flex-1 overflow-y-auto relative z-10", className)}>
        {children}
      </main>
      {footer && (
        <footer className="sticky bottom-0 z-50 bg-black/70 backdrop-blur-md border-t border-white/10 shadow-lg">
          {footer}
        </footer>
      )}
    </div>
  );
};
