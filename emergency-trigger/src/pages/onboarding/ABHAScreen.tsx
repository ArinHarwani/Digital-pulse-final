import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Link2, SkipForward, CheckCircle2, Info } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const ABHAScreen = () => {
  const navigate = useNavigate();
  const { setOnboardingStep, setVerificationStatus, verificationStatus } = useApp();
  const { toast } = useToast();

  const [abhaId, setAbhaId] = useState('');
  const [aadhaarId, setAadhaarId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedType, setLinkedType] = useState<'abha' | 'aadhaar' | null>(null);

  const handleLink = async () => {
    if (!abhaId && !aadhaarId) {
      toast({
        title: "Missing Information",
        description: "Please enter either your ABHA ID or Aadhaar Number",
        variant: "destructive",
      });
      return;
    }

    // Simple validation
    if (aadhaarId && aadhaarId.length !== 12) {
      toast({
        title: "Invalid Aadhaar",
        description: "Aadhaar number must be 12 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLinked(true);
    setLinkedType(aadhaarId ? 'aadhaar' : 'abha');
    setVerificationStatus({ ...verificationStatus, abha: 'verified' });

    toast({
      title: `${aadhaarId ? 'Aadhaar' : 'ABHA'} Linked! ✓`,
      description: "Your health records are now verified and accessible",
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    // Pass aadhaarId if present so it can be saved in the next step
    navigate('/onboarding/medical-profile', { state: { aadhaarId } });
    setIsLoading(false);
  };

  const handleSkip = () => {
    setVerificationStatus({ ...verificationStatus, abha: 'skipped' });
    navigate('/onboarding/medical-profile');
  };

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
            <h1 className="text-lg font-semibold text-foreground">Link Identity</h1>
            <p className="text-sm text-muted-foreground">Step 3 of 4</p>
          </div>
        </div>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* Progress Indicator */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${step <= 3 ? 'bg-emergency' : 'bg-muted'
                }`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-safe-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-safe" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Link ABHA or Aadhaar</h2>
          <p className="text-muted-foreground">
            Connect your identity for seamless medical record access and faster verification
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-safe-light border border-safe/20 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-safe shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Why link Identity?</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Instant access to your medical history during emergencies</li>
              <li>• Verified identity for faster responder dispatch</li>
              <li>• Secure sharing of allergies & conditions</li>
            </ul>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* ABHA Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              ABHA ID / Health ID
            </label>
            <Input
              placeholder="e.g., yourname@abdm"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              disabled={isLinked || !!aadhaarId} // Disable if Aadhaar is filled to encourage one or other, or just leave open? Let's just disable if already linked.
              className={`h-12 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-safe ${linkedType === 'abha' ? 'bg-medical-light text-medical' : 'bg-muted'
                }`}
            />
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-border"></div>
            <span className="relative bg-background px-2 text-xs text-muted-foreground uppercase">Or</span>
          </div>

          {/* Aadhaar Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Aadhaar Card Number
            </label>
            <Input
              placeholder="e.g., 1234 5678 9012"
              value={aadhaarId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                setAadhaarId(val);
              }}
              disabled={isLinked || !!abhaId} // Mutual exclusion for simplicity?
              type="text"
              inputMode="numeric"
              className={`h-12 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-safe ${linkedType === 'aadhaar' ? 'bg-medical-light text-medical' : 'bg-muted'
                }`}
            />
          </div>
        </div>

        {/* Linked State */}
        {isLinked && (
          <div className="flex items-center justify-center gap-2 text-medical animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">
              {linkedType === 'aadhaar' ? 'Aadhaar Verified' : 'ABHA Linked Successfully'}
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="px-6 pb-8 mt-auto space-y-3">
        <Button
          variant={isLinked ? "medical" : "safe"}
          size="xl"
          className="w-full"
          onClick={handleLink}
          disabled={isLoading || isLinked}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Linking...
            </>
          ) : isLinked ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Linked
            </>
          ) : (
            <>
              <Link2 className="w-5 h-5" />
              Link ABHA
            </>
          )}
        </Button>

        {!isLinked && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground"
            onClick={handleSkip}
          >
            <SkipForward className="w-4 h-4" />
            Skip for now
          </Button>
        )}
      </div>
    </MobileLayout>
  );
};

export default ABHAScreen;
