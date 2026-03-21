import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Heart, Clock, Phone } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';

const features = [
  {
    icon: Phone,
    title: 'One-Tap SOS',
    description: 'Instant emergency response with a single tap',
  },
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description: 'Track ambulance location and ETA live',
  },
  {
    icon: Heart,
    title: 'AI First-Aid',
    description: 'Voice-guided emergency assistance',
  },
  {
    icon: Shield,
    title: 'Verified & Secure',
    description: 'Aadhaar & ABHA linked for authenticity',
  },
];

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout className="flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo & Brand */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="w-24 h-24 bg-emergency rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-emergency">
            <span className="text-4xl font-bold text-primary-foreground">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">RoadResQ</h1>
          <p className="text-muted-foreground text-lg">Emergency Response, Reimagined</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-4 shadow-md border border-border animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-emergency-light flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-emergency" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-8 space-y-4">
        <Button
          variant="emergency"
          size="xl"
          className="w-full"
          onClick={() => navigate('/onboarding/register')}
        >
          Get Started
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </MobileLayout>
  );
};

export default WelcomeScreen;
