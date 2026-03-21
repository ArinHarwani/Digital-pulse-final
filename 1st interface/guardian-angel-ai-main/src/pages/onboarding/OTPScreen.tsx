import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OTPScreen = () => {
  const navigate = useNavigate();
  const { setOnboardingStep, setVerificationStatus, verificationStatus } = useApp();
  const { toast } = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the stored OTP hash for verification
      const storedOtpHash = sessionStorage.getItem('otpHash');
      
      if (storedOtpHash && otpValue === storedOtpHash) {
        setIsVerified(true);
        
        toast({
          title: "Phone Verified! ✓",
          description: "Your phone number has been successfully verified",
        });

        // Clear stored OTP
        sessionStorage.removeItem('otpHash');

        await new Promise(resolve => setTimeout(resolve, 1000));
        setOnboardingStep(2);
        navigate('/onboarding/abha');
      } else {
        toast({
          title: "Invalid OTP",
          description: "The code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const phone = sessionStorage.getItem('pendingPhone');
    if (!phone) {
      toast({
        title: "Error",
        description: "Phone number not found. Please go back and try again.",
        variant: "destructive",
      });
      return;
    }

    setResendTimer(30);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data.error || 'Failed to resend OTP');
      }

      if (data.otp_hash) {
        sessionStorage.setItem('otpHash', data.otp_hash);
      }

      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your phone",
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to resend OTP',
        variant: "destructive",
      });
    }
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
            <h1 className="text-lg font-semibold text-foreground">Verify OTP</h1>
            <p className="text-sm text-muted-foreground">Step 2 of 4</p>
          </div>
        </div>
      }
    >
      <div className="px-6 py-8 space-y-8">
        {/* Progress Indicator */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step <= 2 ? 'bg-emergency' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <div className="w-16 h-16 bg-safe-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Enter Verification Code</h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to your mobile number
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerified}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
                isVerified
                  ? 'bg-medical-light border-medical text-medical'
                  : digit
                  ? 'bg-card border-emergency text-foreground'
                  : 'bg-muted border-transparent text-foreground focus:border-emergency focus:bg-card'
              }`}
            />
          ))}
        </div>

        {/* Verified State */}
        {isVerified && (
          <div className="flex items-center justify-center gap-2 text-medical animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Verified Successfully</span>
          </div>
        )}

        {/* Resend */}
        {!isVerified && (
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-muted-foreground">
                Resend code in <span className="font-semibold text-foreground">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-emergency font-semibold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Verify Button */}
      <div className="px-6 pb-8 mt-auto">
        <Button
          variant={isVerified ? "medical" : "emergency"}
          size="xl"
          className="w-full"
          onClick={handleVerify}
          disabled={isLoading || isVerified}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Verified
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default OTPScreen;
