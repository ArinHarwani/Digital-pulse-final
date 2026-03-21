import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfguibmnrsummyxsbxre.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZ3VpYm1ucnN1bW15eHNieHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODE1NTUsImV4cCI6MjA1MTA1NzU1NX0.6cKzH2G0xI_9sT08O8T8K7fWJ4uq6rQ7g8x-5z9t6w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log("Cleaning up active emergencies for MGH...");
    const { error } = await supabase
        .from('emergency_requests')
        .update({ status: 'admitted' })
        .eq('assigned_hospital_id', 'hosp-001')
        .eq('status', 'hospital_assigned');

    if (error) console.error("Error:", error);
    else console.log("Success! Dashboard cleaned.");
}

cleanup();
