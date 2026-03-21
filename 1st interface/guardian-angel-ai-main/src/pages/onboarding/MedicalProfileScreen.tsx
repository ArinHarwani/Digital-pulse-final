import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    Loader2,
    Activity,
    HeartPulse,
    Stethoscope,
    AlertCircle,
    FileText
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MedicalProfileScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOnboardingStep } = useApp();
    const { toast } = useToast();

    // Get Aadhar from previous screen if available
    const aadhaarId = location.state?.aadhaarId || '';
    const userId = sessionStorage.getItem('userId');

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: '',
        bloodGroup: '',
        height: '',
        weight: '',
        allergies: '',
        pastOperations: '',
        medicalConditions: '',
        importantInfo: '' // Critical medical detail
    });

    const handleSubmit = async () => {
        if (!userId) {
            toast({
                title: "Session Error",
                description: "User ID missing. Please login again.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);

        try {
            // SAFE SAVE: Prepend Age to 'important_medical_info' to ensure it saves even if 'age' column is missing.
            const safeImportantInfo = `[Age: ${formData.age || '0'}] ${formData.importantInfo}`;

            // Upsert: Insert or Update if aadhaar_number exists
            const { error } = await supabase
                .from('medical_profiles' as any)
                .upsert({
                    user_id: userId,
                    aadhaar_number: aadhaarId || null,
                    age: parseInt(formData.age) || 0,
                    blood_group: formData.bloodGroup,
                    height: formData.height,
                    weight: formData.weight,
                    allergies: formData.allergies,
                    past_operations: formData.pastOperations,
                    medical_conditions: formData.medicalConditions,
                    important_medical_info: safeImportantInfo,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'aadhaar_number'
                });

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your medical information has been securely saved."
            });

            // Navigate to next step
            navigate('/onboarding/locations');

        } catch (error) {
            console.error('Error saving medical profile:', error);
            toast({
                title: "Save Failed",
                description: "Could not save medical details. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/onboarding/locations');
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
                        <h1 className="text-lg font-semibold text-foreground">Medical Profile</h1>
                        <p className="text-sm text-muted-foreground">Step 3.5 of 4</p>
                    </div>
                </div>
            }
        >
            <div className="px-6 py-8 space-y-6">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-medical-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-medical" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Build Your Medical ID</h2>
                    <p className="text-muted-foreground">
                        These details help responders provide the right care instantly.
                    </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 animate-fade-in">

                    {/* Age Field (New) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Age</label>
                        <Input
                            type="number"
                            placeholder="e.g. 25"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="bg-muted border-0 focus-visible:ring-medical"
                        />
                    </div>

                    {/* Blood Group & Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-medical" />
                                Blood Group
                            </label>
                            <Input
                                placeholder="e.g. O+"
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                className="bg-muted border-0 focus-visible:ring-medical"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Height / Weight</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cm"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="bg-muted border-0 focus-visible:ring-medical"
                                />
                                <Input
                                    placeholder="Kg"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="bg-muted border-0 focus-visible:ring-medical"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Allergies */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-warning" />
                            Allergies
                        </label>
                        <Input
                            placeholder="e.g. Peanuts, Penicillin, Latex"
                            value={formData.allergies}
                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                            className="bg-muted border-0 focus-visible:ring-medical"
                        />
                    </div>

                    {/* Past Operations */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-500" />
                            Past Operations
                        </label>
                        <Input
                            placeholder="e.g. Appendectomy (2018)"
                            value={formData.pastOperations}
                            onChange={(e) => setFormData({ ...formData, pastOperations: e.target.value })}
                            className="bg-muted border-0 focus-visible:ring-medical"
                        />
                    </div>

                    {/* Critical Info */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-destructive" />
                            Important Medical Details
                        </label>
                        <Textarea
                            placeholder="Any critical info for responders? (e.g. Diabetic, Pace Maker, Pregnant)"
                            value={formData.importantInfo}
                            onChange={(e) => setFormData({ ...formData, importantInfo: e.target.value })}
                            className="bg-muted border-0 min-h-[100px] focus-visible:ring-destructive"
                        />
                        <p className="text-xs text-muted-foreground">
                            * This will be highlighted to emergency responders.
                        </p>
                    </div>

                </div>

                {/* Buttons */}
                <div className="pt-4 space-y-3">
                    <Button
                        variant="medical"
                        size="xl"
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : "Save Medical Profile"}
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleSkip}
                    >
                        Skip for now
                    </Button>
                </div>

            </div>
        </MobileLayout>
    );
};

export default MedicalProfileScreen;
