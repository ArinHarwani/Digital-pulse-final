import { EmergencyAlert } from '@/types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge, EmergencyTypeBadge } from '@/components/EmergencyBadge';
import { AmbulanceStatusIndicator } from '@/components/StatusIndicator';
import {
  User, Phone, Droplet, AlertTriangle, Pill, Heart,
  FileText, Ambulance, Clock, MapPin, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientAIChat } from './PatientAIChat';

interface PatientProfileProps {
  emergency: EmergencyAlert;
}

export function PatientProfile({ emergency }: PatientProfileProps) {
  const { patient, ambulance } = emergency;

  const infoSections = [
    {
      title: 'Patient Information',
      icon: User,
      items: [
        { label: 'Name', value: patient.name },
        { label: 'Age', value: `${patient.age} years` },
        { label: 'Gender', value: patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) },
        { label: 'Blood Group', value: patient.bloodGroup || 'Unknown', highlight: true },
      ],
    },
    {
      title: 'ABHA Emergency Data',
      icon: FileText,
      items: [
        {
          label: 'Allergies',
          value: patient.allergies?.length ? patient.allergies.join(', ') : 'None reported',
          warning: patient.allergies && patient.allergies.length > 0,
        },
        {
          label: 'Chronic Conditions',
          value: patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'None reported',
        },
        {
          label: 'Current Medications',
          value: patient.medications?.length ? patient.medications.join(', ') : 'None reported',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Emergency Header */}
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <EmergencyTypeBadge type={emergency.emergencyType} />
            {/* Critical Notes Alert */}
            {patient.importantInfo && (
              <div className="w-full mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive text-sm uppercase">Critical Medical Alert</h4>
                  <p className="text-sm font-medium text-destructive-foreground">
                    {patient.importantInfo}
                  </p>
                </div>
              </div>
            )}

            <SeverityBadge severity={emergency.severity} />
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">ETA</span>
              <span className={cn(
                'text-2xl font-bold font-mono',
                emergency.eta <= 5 ? 'text-destructive' : 'text-foreground'
              )}>
                {emergency.eta} min
              </span>
            </div>
          </div>

          <p className="text-muted-foreground">{emergency.description}</p>
        </CardContent>
      </Card>

      {/* Info Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {infoSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={cn(
                      'text-sm font-medium text-right',
                      item.highlight && 'font-mono bg-primary/10 px-2 py-0.5 rounded text-primary',
                      item.warning && 'text-destructive'
                    )}>
                      {item.warning && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                      {item.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ambulance Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ambulance className="h-4 w-4 text-primary" />
            Ambulance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vehicle</span>
                <span className="text-sm font-mono">{ambulance.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Driver</span>
                <span className="text-sm">{ambulance.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Paramedic</span>
                <span className="text-sm">{ambulance.paramedicName}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <AmbulanceStatusIndicator status={ambulance.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contact</span>
                <span className="text-sm font-mono">{ambulance.contactNumber}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Clinical Assistant Integration */}
      {emergency.patient.medassistKey && (
        <div className="mt-8 animate-in slide-in-from-bottom duration-700">
           <div className="flex items-center gap-2 mb-4 px-1">
             <Bot className="w-5 h-5 text-primary animate-pulse" />
             <h3 className="text-lg font-bold text-foreground">Digital Pulse AI Clinical Insights</h3>
           </div>
           <PatientAIChat 
             patient={emergency.patient}
             profile={emergency.patient}
             records={emergency.patient.records || []}
             medicines={emergency.patient.medicines || []}
           />
        </div>
      )}
    </div>
  );
}
