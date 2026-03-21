import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AbhaPatientRecord } from '@/types/hospital';
import { AbhaCard } from './AbhaCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AbhaLookup() {
    const [abhaId, setAbhaId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [patientRecord, setPatientRecord] = useState<AbhaPatientRecord | null>(null);
    const { toast } = useToast();

    const validateAbhaId = (id: string): boolean => {
        // Just generic validation, length check
        const cleanId = id.replace(/\s/g, '');
        return cleanId.length === 12;
    };

    const handleSearch = async () => {
        setError('');
        setPatientRecord(null);

        const cleanAbhaId = abhaId.replace(/\s/g, '');

        if (!validateAbhaId(cleanAbhaId)) {
            setError('Please enter a valid 12-digit Aadhaar Number');
            return;
        }

        setLoading(true);

        try {
            // Fetch from medical_profiles using aadhaar_number
            const { data, error } = await supabase
                .from('medical_profiles' as any)
                .select('*')
                .eq('aadhaar_number', cleanAbhaId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Fetch User Name from public.users using user_id
                let patientName = 'Verified Patient';
                let dob = 'Unknown';
                let gender: 'male' | 'female' | 'other' = 'other';

                if (data.user_id) {
                    const { data: userData, error: userError } = await supabase
                        .from('users' as any)
                        .select('name, username') // Assuming name or username exists
                        .eq('id', data.user_id)
                        .maybeSingle();

                    if (!userError && userData) {
                        patientName = userData.name || userData.username || 'Verified Patient';
                    }
                }

                const record: AbhaPatientRecord = {
                    abhaId: cleanAbhaId,
                    name: patientName,
                    bloodGroup: data.blood_group || 'Unknown',
                    gender: gender,
                    dateOfBirth: dob,
                    mobileNumber: 'Linked',
                    height: data.height,
                    weight: data.weight,
                    allergies: data.allergies ? (data.allergies.includes(',') ? data.allergies.split(',').map((s: string) => s.trim()) : [data.allergies]) : [],
                    recentIssue: data.important_medical_info,
                    energyLevel: 'Stable'
                };
                setPatientRecord(record);
                toast({ title: "Record Found", description: `Details found for ${patientName}` });
            } else {
                setError('No medical record found for this Aadhaar Number.');
            }
        } catch (err) {
            console.error("Lookup failed:", err);
            setError('Failed to retrieve records. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 12) value = value.slice(0, 12);

        // Format
        if (value.length > 4 && value.length <= 8) {
            value = `${value.slice(0, 4)} ${value.slice(4)}`;
        } else if (value.length > 8) {
            value = `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8)}`;
        }
        setAbhaId(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Aadhaar Patient Lookup
                    </CardTitle>
                    <CardDescription>
                        Enter 12-digit Aadhaar Number to retrieve registered medical profile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="1234 5678 9000"
                            value={abhaId}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            className="font-mono text-lg"
                            maxLength={14}
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading || abhaId.replace(/\s/g, '').length !== 12}
                            className="min-w-[100px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {patientRecord && <AbhaCard patient={patientRecord} />}
        </div>
    );
}
