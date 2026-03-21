import { Card, CardContent } from '@/components/ui/card';
import { AbhaPatientRecord } from '@/types/hospital';
import { Activity, AlertCircle, Apple, Zap, FileText, Stethoscope } from 'lucide-react';

interface AbhaCardProps {
    patient: AbhaPatientRecord;
}

export function AbhaCard({ patient }: AbhaCardProps) {
    return (
        <div className="space-y-6">
            {/* Official ABHA Card Image */}
            {patient.cardImage && (
                <Card className="overflow-hidden border-2 border-primary/20">
                    <div className="bg-gradient-to-r from-[#2C4A8C] to-[#3B5998] p-3 text-white">
                        <h3 className="text-center font-bold">Official ABHA Card</h3>
                    </div>
                    <CardContent className="p-0">
                        <img
                            src={patient.cardImage}
                            alt={`ABHA Card for ${patient.name}`}
                            className="w-full h-auto"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Health Metrics Section */}
            {(patient.height || patient.weight || patient.bloodPressure || patient.sugarLevel) && (
                <Card className="overflow-hidden border-2 border-primary/20">
                    <div className="bg-gradient-to-r from-[#2C4A8C] to-[#3B5998] p-4 text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Health Metrics
                        </h3>
                    </div>

                    <CardContent className="p-6 bg-gradient-to-br from-background to-secondary/10">
                        <div className="grid grid-cols-2 gap-4">
                            {patient.height && (
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-xs text-muted-foreground mb-1">Height</p>
                                    <p className="text-lg font-semibold">{patient.height}</p>
                                </div>
                            )}
                            {patient.weight && (
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-xs text-muted-foreground mb-1">Weight</p>
                                    <p className="text-lg font-semibold">{patient.weight}</p>
                                </div>
                            )}
                            {patient.bloodPressure && (
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-xs text-muted-foreground mb-1">Blood Pressure</p>
                                    <p className="text-lg font-semibold">{patient.bloodPressure}</p>
                                </div>
                            )}
                            {patient.sugarLevel && (
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-xs text-muted-foreground mb-1">Sugar Level</p>
                                    <p className="text-lg font-semibold">{patient.sugarLevel}</p>
                                </div>
                            )}
                            {patient.energyLevel && (
                                <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        Energy Level
                                    </p>
                                    <p className="text-lg font-semibold">{patient.energyLevel}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Medical Information */}
            {(patient.allergies || patient.foodIntolerance || patient.lastTest || patient.recentIssue) && (
                <Card className="overflow-hidden border-2 border-primary/20">
                    <div className="bg-gradient-to-r from-[#2C4A8C] to-[#3B5998] p-4 text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Medical Information
                        </h3>
                    </div>

                    <CardContent className="p-6 bg-gradient-to-br from-background to-secondary/10 space-y-3">
                        {patient.allergies && patient.allergies.length > 0 && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                    Allergies
                                </p>
                                <p className="text-sm font-semibold text-destructive">
                                    {patient.allergies.join(', ')}
                                </p>
                            </div>
                        )}

                        {patient.foodIntolerance && (
                            <div className="p-3 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Apple className="h-3 w-3" />
                                    Food Intolerance
                                </p>
                                <p className="text-sm font-semibold">{patient.foodIntolerance}</p>
                            </div>
                        )}

                        {patient.lastTest && (
                            <div className="p-3 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Last Test
                                </p>
                                <p className="text-sm font-semibold">{patient.lastTest}</p>
                            </div>
                        )}

                        {patient.recentIssue && (
                            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <p className="text-xs text-muted-foreground mb-1">Recent Issue</p>
                                <p className="text-sm font-semibold text-warning-foreground">{patient.recentIssue}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

