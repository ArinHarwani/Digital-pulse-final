'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { ShieldAlert, Phone, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RelativeAuthorizationScreen() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('request_id');

  const [request, setRequest] = useState<any>(null);
  const [patientName, setPatientName] = useState('your relative');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [status, setStatus] = useState<'LOADING' | 'PENDING' | 'DENIED' | 'APPROVED' | 'EXPIRED' | 'ERROR'>('LOADING');

  useEffect(() => {
    if (!requestId) {
      setStatus('ERROR');
      return;
    }

    const fetchRequest = async () => {
      try {
        const { data: reqData, error: reqError } = await supabase
          .from('data_access_requests')
          .select('*, hospitals(name)')
          .eq('id', requestId)
          .single();

        if (reqError || !reqData) {
          setStatus('ERROR');
          return;
        }

        setRequest(reqData);
        setStatus(reqData.status as any);

        // Fetch patient name
        const { data: patientData } = await supabase
          .from('patients')
          .select('name')
          .eq('unique_key', reqData.medassist_key)
          .single();
        
        if (patientData) setPatientName(patientData.name);

        // Calculate time remaining if pending
        if (reqData.status === 'PENDING') {
          const reqTime = new Date(reqData.requested_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - reqTime) / 1000);
          const remaining = 60 - elapsed;
          
          if (remaining <= 0) {
            setStatus('APPROVED'); // It expired locally
          } else {
            setTimeLeft(remaining);
          }
        }
      } catch (e) {
        setStatus('ERROR');
      }
    };

    fetchRequest();
  }, [requestId]);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'PENDING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setStatus('APPROVED'); // Auto-approve locally when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Realtime listener for status changes (e.g., if hospital cancels or backend auto-approves)
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel('request-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'data_access_requests', filter: `id=eq.${requestId}` },
        (payload: any) => {
          if (payload.new?.status) {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleDeny = async () => {
    if (status !== 'PENDING') return;

    try {
      const { error } = await supabase
        .from('data_access_requests')
        .update({ status: 'DENIED' })
        .eq('id', requestId);

      if (!error) {
        setStatus('DENIED');
      }
    } catch (err) {
      console.error('Failed to deny request', err);
    }
  };

  if (status === 'LOADING') {
    return (
      <MobileLayout className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </MobileLayout>
    );
  }

  if (status === 'ERROR' || !request) {
    return (
      <MobileLayout className="flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Invalid Request</h2>
        <p className="text-white/60 mt-2">This authorization link is invalid or has expired.</p>
      </MobileLayout>
    );
  }

  const hospitalName = request.hospitals?.name || 'A Hospital';

  return (
    <MobileLayout className="flex flex-col h-full bg-black">
      <div className="flex-1 flex flex-col items-center py-12 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Icon based on Status */}
        <div className="relative">
          {status === 'PENDING' && (
            <>
              <div className="absolute inset-0 bg-yellow-500 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
              <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500 relative z-10">
                <ShieldAlert className="w-12 h-12 text-yellow-500" />
              </div>
            </>
          )}
          {status === 'DENIED' && (
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}
          {status === 'APPROVED' && (
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          )}
        </div>

        {/* Dynamic Content */}
        {status === 'PENDING' && (
          <div className="text-center space-y-4 w-full">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              URGENT AUTHORIZATION
            </h1>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left shadow-2xl backdrop-blur-md">
              <p className="text-lg text-white/90 leading-snug">
                <strong className="text-white">{hospitalName}</strong> is requesting immediate emergency access to{' '}
                <strong className="text-yellow-400">{patientName}'s</strong> secure medical records.
              </p>
              
              <div className="mt-6 flex flex-col items-center space-y-2">
                <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Auto-Approving in</span>
                <span className="text-6xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-lg">
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <p className="text-sm text-white/60 px-4">
              If you do nothing, access will be granted automatically. Tap DENY to immediately block access.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-6 w-full">
              <button 
                onClick={handleDeny}
                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl tracking-wider uppercase transition-colors shadow-lg shadow-red-900/50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-6 h-6" />
                DENY ACCESS
              </button>
              
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 border border-white/10">
                <Phone className="w-5 h-5" />
                Call {hospitalName} ER
              </button>
            </div>
          </div>
        )}

        {status === 'DENIED' && (
          <div className="text-center space-y-4 animate-in zoom-in duration-300">
            <h1 className="text-3xl font-black text-red-500 uppercase">Access Denied</h1>
            <p className="text-lg text-white/80">
              You have successfully blocked {hospitalName} from viewing the records.
            </p>
            <p className="text-sm text-white/50 bg-white/5 p-4 rounded-xl border border-white/10">
              The hospital has been notified of your denial. We recommend contacting them immediately to discuss patient care.
            </p>
            <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call Hospital Now
            </button>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className="text-center space-y-4 animate-in zoom-in duration-300">
            <h1 className="text-3xl font-black text-green-500 uppercase">Access Granted</h1>
            <p className="text-lg text-white/80">
              {hospitalName} now has read-only access to the medical records to treat the emergency.
            </p>
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
