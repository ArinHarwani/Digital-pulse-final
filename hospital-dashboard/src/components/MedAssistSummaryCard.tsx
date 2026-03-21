import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, AlertTriangle, FileText, Activity, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PatientAIChat } from './PatientAIChat';

interface MedAssistSummaryCardProps {
  patient: any;
  medassistKey: string;
}

const PRIMARY_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SECONDARY_KEY = import.meta.env.VITE_GEMINI_API_KEY_SECONDARY || "";

export function MedAssistSummaryCard({ patient, medassistKey }: MedAssistSummaryCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [rawRecordsCount, setRawRecordsCount] = useState(0);
  const [rawMedicinesCount, setRawMedicinesCount] = useState(0);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [patientMedicines, setPatientMedicines] = useState<any[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    const generateSummary = async () => {
      setLoading(true);
      try {
        // 1. Fetch auxiliary data from MedAssist Supreme Database
        const [recordsRes, medsRes] = await Promise.all([
          supabase.from('medical_records' as any).select('*').eq('patient_key', patient.unique_key || medassistKey),
          supabase.from('medicines' as any).select('*').eq('patient_key', patient.unique_key || medassistKey)
        ]);

        const profile: any = patient; // Data is already in the patient object
        const records = recordsRes.data || [];
        const meds = medsRes.data || [];

        setPatientProfile(profile);
        setPatientRecords(records);
        setPatientMedicines(meds);
        setRawRecordsCount(records.length);
        setRawMedicinesCount(meds.length);

        // 2. Build the LLM Context
        const promptContext = `
          You are an ER critical care AI assistant evaluating a patient in an emergency.
          Read the following MedAssist health data and generate a CRITICAL PRIORITY SYNTHESIS (max 4 bullet points, highly concise, emphasizing life-threatening issues, allergies, or chronic conditions).
          Do not include warnings about your own limitations. Just output the medical facts.

          PATIENT INFO:
          Name: ${patient.name}
          Blood Group: ${patient.blood_type || profile.blood_group || 'Unknown'}
          Age/Height/Weight: ${patient.age || profile.age || 'Unknown'}, ${profile.height || 'Unknown'}, ${profile.weight || 'Unknown'}
          Allergies: ${profile.allergies || (patient.medical_conditions && Array.isArray(patient.medical_conditions) ? patient.medical_conditions.join(', ') : 'None recorded')}
          Important Info: ${profile.important_medical_info || (patient.medical_conditions && Array.isArray(patient.medical_conditions) ? 'Patient has known medical conditions' : 'None')}

          MEDICINES ACTIVELY TAKEN:
          ${meds.length > 0 ? meds.map((m: any) => `- ${m.name} (${m.dosage})`).join('\n') : 'None recorded'}

          LAB/MEDICAL REPORTS AVAILABLE:
          ${records.length > 0 ? records.map((r: any) => `- [${r.type}] ${r.title}: ${r.summary}`).join('\n') : 'No records uploaded'}
        `;

        // 3. Call Gemini API with Fallback
        const callGemini = async (key: string) => {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptContext }] }]
            })
          });
          if (!res.ok) throw new Error("Gemini API Error");
          return await res.json();
        };

        try {
           const result = await callGemini(PRIMARY_KEY);
           setSummary(result.candidates[0].content.parts[0].text);
        } catch (primaryErr) {
           console.warn("Primary API Key Failed. Faiing over to Secondary.", primaryErr);
           toast({ title: "API Failover", description: "Primary Key 1 failed. Switching to Secondary Key 2.", variant: "warning" as any });
           
           try {
             const result = await callGemini(SECONDARY_KEY);
             setSummary(result.candidates[0].content.parts[0].text);
           } catch (secErr) {
             setSummary("⚠️ AI Summarization Failed completely. Please read records manually below.");
           }
        }
      } catch (e) {
        console.error("Failed to generate summary", e);
        setSummary("⚠️ Critical Error fetching patient resources from MedAssist servers.");
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [patient]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <Card className="border-emerald-500/30 shadow-lg shadow-emerald-500/10 overflow-hidden">
         <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 flex items-start justify-between">
           <div>
             <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
               <Bot className="w-6 h-6" /> Patient Overview Generated
             </h3>
             <p className="text-sm text-muted-foreground mt-1">Authorized access via MedAssist Unique Key: {medassistKey}</p>
           </div>
           
           <div className="flex gap-2">
              <Badge variant="outline" className="bg-card">
                 <FileText className="w-3 h-3 mr-1" /> {rawRecordsCount} Reports
              </Badge>
              <Badge variant="outline" className="bg-card">
                 <Activity className="w-3 h-3 mr-1" /> {rawMedicinesCount} Meds
              </Badge>
           </div>
         </div>
         
         <CardContent className="p-6">
           <div className="bg-card rounded-xl p-6 border border-border">
             <h4 className="flex items-center gap-2 font-bold mb-4 text-warning">
               <AlertTriangle className="w-5 h-5" /> CRITICAL PRIORITY SYNTHESIS
             </h4>
             
             {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
             ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1 text-foreground">
                  <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
             )}
           </div>
           
           {!loading && patient && (
             <>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Blood Group</p>
                    <p className="font-bold text-lg text-destructive">{patient.blood_type || 'Unknown'}</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Age</p>
                    <p className="font-bold text-lg">{patient.age || 'Unknown'} yrs</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Emergency Contact/Patient Phone</p>
                    <p className="font-bold text-lg flex items-center gap-2">
                      {patient.relative_phone || patient.phone_number || 'None'}
                    </p>
                  </div>
               </div>

               <PatientAIChat 
                 patient={patient}
                 profile={patientProfile}
                 records={patientRecords}
                 medicines={patientMedicines}
               />
             </>
           )}
         </CardContent>
      </Card>
    </div>
  );
}
