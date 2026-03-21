import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // For MVP, using standard anon key
);

export async function extractMedicalData(documentUrl: string, uniqueKey: string) {
    if (!documentUrl || !uniqueKey) {
        throw new Error("Missing required fields");
    }

    // 1. Fetch file directly into memory from the signed URL
    const fileResponse = await fetch(documentUrl);
    if (!fileResponse.ok) throw new Error("Could not retrieve document from storage");

    const arrayBuffer = await fileResponse.arrayBuffer();
    const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

    // Note: Due to standard Node 18 fetch, converting buffer to base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // 2. Multimodal call to Gemini
    const systemPrompt = `Analyze the provided medical document (which may be a lab report, prescription, or clinical note).
    Extract the core medical data, test results (identifying any abnormals if obvious), diagnoses, and medicines.
    
    Format the output exactly in this JSON structure (Do not use markdown blocks, return ONLY raw JSON):
    {
      "type": "Lab Result | Prescription | Imaging | Consultation",
      "title": "A short 2-4 word title describing the document",
      "summary": "A clean, concise 2-3 sentence summary covering the exact extracted numeric results or findings."
    }`;

    // Gemini 1.5 Flash supports Multimodal image and document input directly via the contents array
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            systemPrompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ],
        config: {
            temperature: 0.1, // Highly deterministic output
        }
    });

    const outputText = (response as any).text?.replace(/```json|```/g, '').trim();
    if (!outputText) throw new Error("Gemini returned empty analysis.");

    const parsedData = JSON.parse(outputText);

    // 3. Ensure the patient row exists in Supabase before inserting the record 
    // (handles DEMO keys and new patients not yet in the DB)
    const { error: patientUpsertError } = await supabaseAdmin
        .from('patients')
        .upsert([{
            unique_key: uniqueKey,
            name: `Patient (${uniqueKey})`,
            email: `${uniqueKey.toLowerCase()}@medassist.demo`,
            age: 0,
            blood_type: 'Unknown'
        }], { onConflict: 'unique_key', ignoreDuplicates: true });

    if (patientUpsertError) {
        console.warn("Patient upsert warning:", patientUpsertError.message);
        // Non-fatal — patient may already exist, proceed
    }

    // 4. Insert the newly extracted structured data as a new medical record
    const { error: dbError } = await supabaseAdmin
        .from('medical_records')
        .insert([{
            patient_key: uniqueKey,
            type: parsedData.type,
            title: parsedData.title,
            summary: parsedData.summary,
            date: new Date().toISOString().split('T')[0]
        }]);

    if (dbError) throw new Error("Failed to insert extracted data to DB: " + dbError.message);

    return parsedData;
}
