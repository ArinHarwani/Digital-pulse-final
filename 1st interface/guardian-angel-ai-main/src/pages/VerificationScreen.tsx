import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Smartphone,
  MapPin,
  Link2,
  RefreshCw
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StatusItemProps {
  icon: React.ElementType;
  label: string;
  status: 'verified' | 'pending' | 'failed' | 'warning';
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const StatusItem = ({ icon: Icon, label, status, description, action }: StatusItemProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { 
          color: 'text-medical', 
          bg: 'bg-medical-light', 
          icon: CheckCircle2,
          badge: 'Verified'
        };
      case 'pending':
        return { 
          color: 'text-warning', 
          bg: 'bg-warning-light', 
          icon: RefreshCw,
          badge: 'Pending'
        };
      case 'warning':
        return { 
          color: 'text-warning', 
          bg: 'bg-warning-light', 
          icon: AlertTriangle,
          badge: 'Warning'
        };
      case 'failed':
        return { 
          color: 'text-emergency', 
          bg: 'bg-emergency-light', 
          icon: XCircle,
          badge: 'Failed'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground">{label}</h3>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.badge}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const VerificationScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verificationStatus } = useApp();

  const handleRetryGPS = () => {
    toast({
      title: "Checking GPS...",
      description: "Attempting to get your location",
    });
  };

  const handleLinkABHA = () => {
    navigate('/onboarding/abha');
  };

  // Mock security warnings
  const securityWarnings = [
    {
      id: '1',
      type: 'info',
      message: 'All systems normal. Your device is trusted.',
    }
  ];

  return (
    <MobileLayout
      showHeader
      headerContent={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Verification Status</h1>
            <p className="text-sm text-muted-foreground">Security & Identity</p>
          </div>
        </div>
      }
      footer={<BottomNav />}
    >
      <div className="px-4 py-6 space-y-4">
        {/* Security Score Card */}
        <div className="bg-gradient-to-br from-medical to-medical/80 rounded-2xl p-5 text-center">
          <div className="w-16 h-16 bg-success-foreground/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-success-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-success-foreground mb-1">Verified User</h2>
          <p className="text-success-foreground/80 text-sm">
            Your identity has been verified. Fake call prevention is active.
          </p>
        </div>

        {/* Status Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Verification Status
          </h3>

          <StatusItem
            icon={Link2}
            label="ABHA Linkage"
            status={
              verificationStatus.abha === 'verified' 
                ? 'verified' 
                : verificationStatus.abha === 'skipped' 
                ? 'pending' 
                : 'pending'
            }
            description={
              verificationStatus.abha === 'verified'
                ? "Health records are accessible during emergencies"
                : "Link your ABHA for faster medical assistance"
            }
            action={
              verificationStatus.abha !== 'verified' 
                ? { label: 'Link Now', onClick: handleLinkABHA }
                : undefined
            }
          />

          <StatusItem
            icon={MapPin}
            label="GPS Location"
            status={verificationStatus.gps === 'enabled' ? 'verified' : 'warning'}
            description={
              verificationStatus.gps === 'enabled'
                ? "Location services are active with high accuracy"
                : "Enable GPS for accurate emergency response"
            }
            action={
              verificationStatus.gps !== 'enabled'
                ? { label: 'Enable GPS', onClick: handleRetryGPS }
                : undefined
            }
          />

          <StatusItem
            icon={Smartphone}
            label="Device Trust"
            status={verificationStatus.deviceTrusted ? 'verified' : 'verified'}
            description="This device is registered and trusted"
          />
        </div>

        {/* Fake Call Prevention Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Fake Call Prevention
          </h3>

          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-medical-light flex items-center justify-center">
                <Shield className="w-5 h-5 text-medical" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Protection Active</h4>
                <p className="text-xs text-muted-foreground">No suspicious activity detected</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'GPS Location Match', status: 'pass' },
                { label: 'Device ID Verified', status: 'pass' },
                { label: 'Phone Verified', status: 'pass' },
                { label: 'Behavioral Analysis', status: 'pass' },
              ].map((check) => (
                <div key={check.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{check.label}</span>
                  <div className="flex items-center gap-1 text-medical">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Pass</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-safe-light border border-safe/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-safe shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Why verification matters</h4>
              <p className="text-xs text-muted-foreground">
                Verified users get priority emergency response. Your identity verification helps prevent fake emergency calls and ensures ambulances reach real emergencies faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default VerificationScreen;
