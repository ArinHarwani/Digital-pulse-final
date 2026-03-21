'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface EmergencyButtonProps {
  patientKey: string;
  patientName: string;
}

const MUJ_LAT = 26.8439;
const MUJ_LNG = 75.5652;
const MUJ_ADDRESS = 'Manipal University Jaipur (MUJ), Jaipur';

const TEXTBEE_API_KEY = 'dbf33a36-d2c6-4b36-a96b-6baacceec708';
const TEXTBEE_DEVICE_ID = '69bedace845187fc87c51203';

export default function EmergencyButton({ patientKey, patientName }: EmergencyButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string }>({
    lat: MUJ_LAT, lng: MUJ_LNG, address: MUJ_ADDRESS
  });

  // Try to get GPS on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          // Reverse geocode with Mapbox
          try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`);
            const data = await res.json();
            const addr = data.features?.[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocation({ lat, lng, address: addr });
          } catch {
            setLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
          }
        },
        () => {
          // GPS denied — keep MUJ default
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // When countdown reaches 0, fire the emergency
  useEffect(() => {
    if (countdown === 0) {
      fireEmergency();
    }
  }, [countdown]);

  const fireEmergency = useCallback(async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      // 1. Insert emergency into Supabase
      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          medassist_key: patientKey,
          patient_name: patientName,
          emergency_type: 'other',
          status: 'pending',
          patient_location: `POINT(${location.lng} ${location.lat})`,
          patient_address: location.address,
          patient_lat: location.lat,
          patient_lng: location.lng
        } as any)
        .select()
        .single();

      if (error) throw error;

      // 2. Try to send SMS notification to relative
      try {
        const { data: patientData } = await supabase
          .from('patients')
          .select('relative_phone, phone_number')
          .eq('unique_key', patientKey)
          .single();

        let phoneNumber = (patientData as any)?.relative_phone || (patientData as any)?.phone_number;
        if (phoneNumber) {
          // ensure +91 prefix for Indian numbers if not already present
          phoneNumber = phoneNumber.replace(/\D/g, ''); // remove non-digits
          if (phoneNumber.length === 10) {
            phoneNumber = '+91' + phoneNumber;
          } else if (phoneNumber.length > 10 && !phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }

          await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': TEXTBEE_API_KEY
            },
            body: JSON.stringify({
              recipients: [phoneNumber],
              message: `🚨 EMERGENCY ALERT: ${patientName} has triggered an SOS from Digital Pulse. Location: ${location.address}. Please check on them immediately.`
            })
          });
        }
      } catch (smsErr) {
        console.warn('SMS notification failed (non-critical):', smsErr);
      }

      setSent(true);
      setCountdown(null);
    } catch (err) {
      console.error('Emergency insert failed:', err);
      alert('Failed to send emergency. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [patientKey, patientName, location, isSending]);

  const handleClick = () => {
    if (sent || isSending) return;
    setCountdown(10);
  };

  const handleCancel = () => {
    setCountdown(null);
  };

  return (
    <>
      <div data-emergency-button style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}>
        {/* Countdown Overlay */}
        {countdown !== null && countdown > 0 && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '32px',
            animation: 'fade-in 0.3s ease-out'
          }}>
            <div style={{
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #991b1b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 80px rgba(239,68,68,0.5)',
              animation: 'pulse-ring 1s ease-in-out infinite',
              border: '4px solid rgba(255,255,255,0.2)'
            }}>
              <span style={{
                fontSize: '84px', fontWeight: 900, color: 'white',
                fontFamily: '"Outfit", sans-serif', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {countdown}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>🚨 TRIGGERING EMERGENCY</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>Dispatching ambulance to Manipal University Jaipur...</p>
            </div>
            <button
              onClick={handleCancel}
              style={{
                padding: '16px 54px', background: 'rgba(255,255,255,0.1)', color: 'white',
                borderRadius: 'var(--radius-lg)', fontSize: '16px', fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ✕ CANCEL EMERGENCY
            </button>
          </div>
        )}

        {/* Sent Confirmation */}
        {sent ? (
          <div className="clinical-card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            background: 'rgba(22, 163, 74, 0.1)', borderColor: '#16a34a', padding: '32px'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(22,163,74,0.4)'
            }}>
              <span style={{ fontSize: '32px', color: 'white' }}>✓</span>
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '20px', color: 'white', marginBottom: '4px' }}>
                  SOS SIGNAL BROADCASTED
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  Nearby ambulances have received your location.
                </p>
            </div>
            <button onClick={() => setSent(false)} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 'bold', opacity: 0.6 }}>Reset Status</button>
          </div>
        ) : (
          <>
            {/* The Big Red Button */}
            <button
              onClick={handleClick}
              disabled={isSending}
              style={{
                width: '220px', height: '220px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                border: '8px solid rgba(239,68,68,0.2)',
                boxShadow: '0 0 50px rgba(239,68,68,0.4)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '10px', cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative', overflow: 'hidden',
                animation: 'emergency-pulse 2s ease-in-out infinite'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 70px rgba(239,68,68,0.7)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 50px rgba(239,68,68,0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, rgba(0,0,0,0.3))' }}></div>
              <span style={{ fontSize: '48px', position: 'relative' }}>🆘</span>
              <span style={{
                fontSize: '20px', fontWeight: 900, color: 'white',
                textTransform: 'uppercase', letterSpacing: '2px', position: 'relative'
              }}>
                TAP TO HELP
              </span>
            </button>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   Instant SOS Response
                </p>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    MUJ Jaipur fallback enabled
                </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes emergency-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 50px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.2); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes fade-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
