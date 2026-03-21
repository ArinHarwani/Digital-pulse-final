'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface UploaderProps {
    uniqueKey: string;
    onUploadComplete?: () => void;
}

export default function Uploader({ uniqueKey, onUploadComplete }: UploaderProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size and type for MVP
        if (file.size > 5 * 1024 * 1024) {
            setStatusMsg("File is too large. Max 5MB.");
            return;
        }

        try {
            setIsUploading(true);
            setStatusMsg("Uploading to secure storage...");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${uniqueKey}/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('record_uploads')
                .upload(filePath, file);

            if (uploadError) throw new Error("Upload failed: " + uploadError.message);

            // 2. Get the public/signed URL to send to Gemini Server Route
            const { data } = supabase.storage
                .from('record_uploads')
                .getPublicUrl(filePath);

            const documentUrl = data.publicUrl;

            // 3. Call our internal API Route to initiate Gemini Extraction
            setStatusMsg("Gemini AI is extracting medical data...");

            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentUrl, uniqueKey })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "AI Extraction Failed");
            }

            setStatusMsg("Successfully extracted and saved! Refreshing...");

            // Clear the input component and trigger refresh
            e.target.value = '';
            if (onUploadComplete) onUploadComplete();

            // Delay before clearing message to allow user to read success
            setTimeout(() => {
                setIsUploading(false);
                setStatusMsg("");
                router.refresh(); // Trigger Next.js App Router hard refresh
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setStatusMsg(err.message || "An unexpected error occurred.");
            setIsUploading(false);
        }
    };

    return (
        <div style={{ background: 'var(--color-primary-light)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary)', marginTop: '8px', marginBottom: '16px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: '15px' }}>Upload New Record</p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>Supports PDF, JPG, PNG (Max 5MB)</p>
                </div>
                <div>
                    <input
                        type="file"
                        id="file-upload"
                        style={{ display: 'none' }}
                        accept=".pdf, .jpg, .jpeg, .png"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className="btn-primary"
                        style={{
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            opacity: isUploading ? 0.7 : 1,
                            padding: '8px 16px',
                            fontSize: '13px',
                            width: 'auto'
                        }}
                    >
                        {isUploading ? 'Processing...' : 'Select File'}
                    </label>
                </div>
            </div>

            {statusMsg && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: isUploading ? 'var(--color-primary)' : 'var(--color-error)', fontWeight: '500' }}>
                    {statusMsg}
                </div>
            )}

        </div>
    );
}
