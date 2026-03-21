import { useState, useEffect } from 'react';
import { Search, Loader2, ShieldAlert, XCircle, CheckCircle2, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedAssistSummaryCard } from './MedAssistSummaryCard'; // We'll create this next

interface MedAssistLookupProps {
    hospitalId?: string;
}

export function MedAssistLookup({ hospitalId }: MedAssistLookupProps) {
    const [medassistKey, setMedassistKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Status can be: 'IDLE', 'REQUESTING', 'COUNTDOWN', 'APPROVED', 'DENIED'
    const [status, setStatus] = useState<'IDLE' | 'REQUESTING' | 'COUNTDOWN' | 'APPROVED' | 'DENIED'>('IDLE');
    
    // Safety Protocol State
    const [requestId, setRequestId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [patientData, setPatientData] = useState<any>(null);

    const { toast } = useToast();
    const HOSPITAL_ID = hospitalId || 'd03270cc-acca-4634-bd61-22dbf116554c'; // Default to AIIMS Jodhpur UUID if missing

    const handleSearch = async () => {
        setError('');
        setStatus('REQUESTING');
        setPatientData(null);
        setRequestId(null);
        setTimeLeft(60);

        if (!medassistKey.trim()) {
            setError('Please enter a valid Digital Pulse Unique Key');
            setStatus('IDLE');
            return;
        }

        try {
            // 1. Verify if key exists in 'patients'
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('unique_key', medassistKey.trim())
                .maybeSingle();

            if (patientError || !patient) {
                setError('No patient found with this Unique Key.');
                setStatus('IDLE');
                return;
            }

            // 2. Initiate the Access Request
            const { data: request, error: requestError } = await supabase
                .from('data_access_requests')
                .insert({
                    medassist_key: patient.unique_key,
                    hospital_id: HOSPITAL_ID,
                    status: 'PENDING'
                } as any)
                .select()
                .single();

            if (requestError || !request) {
                throw requestError || new Error("Failed to create request");
            }

            setRequestId(request.id);
            setPatientData(patient);
            setStatus('APPROVED');
            
            toast({ title: "Access Granted", description: "Patient records unlocked." });

        } catch (err) {
            console.error("Lookup failed:", err);
            setError('System error initiating request. Try again.');
            setStatus('IDLE');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="space-y-6">
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Digital Pulse Key Lookup
                    </CardTitle>
                    <CardDescription>
                        Enter the Unique Key to pull patient's full medical history and lab reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="e.g. PAT-123456"
                            value={medassistKey}
                            onChange={(e) => setMedassistKey(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={status === 'COUNTDOWN' || status === 'REQUESTING'}
                            className="font-mono text-lg"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={status === 'COUNTDOWN' || status === 'REQUESTING' || !medassistKey.trim()}
                            className="min-w-[120px]"
                        >
                            {status === 'REQUESTING' ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching</>
                            ) : (
                                <><Search className="h-4 w-4 mr-2" /> Request Data</>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium slide-up">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* DENIED UI */}
            {status === 'DENIED' && (
                <Card className="border-destructive shadow-destructive/20 shadow-xl animate-in fade-in slide-in-from-bottom">
                    <div className="bg-destructive/10 p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <XCircle className="w-16 h-16 text-destructive" />
                        <h2 className="text-2xl font-bold text-destructive uppercase tracking-wide">Access Denied</h2>
                        <p className="text-muted-foreground max-w-md">
                            The patient's relative manually rejected this data request. MedAssist prevents us from disclosing any medical records.
                        </p>
                        <Button variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => setStatus('IDLE')}>
                            <Phone className="w-4 h-4 mr-2" /> Contact Relative Manually
                        </Button>
                    </div>
                </Card>
            )}

            {/* APPROVED UI (Shows Gemini Summary) */}
            {status === 'APPROVED' && patientData && (
                <MedAssistSummaryCard patient={patientData} medassistKey={patientData.unique_key} />
            )}
        </div>
    );
}
