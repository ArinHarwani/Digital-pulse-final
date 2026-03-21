import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface LoginFormProps {
  onLogin: (hospital: any, password: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(true);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const { data, error } = await supabase
          .from('hospitals' as any)
          .select('*');
        if (error) throw error;
        setHospitals(data || []);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
      } finally {
        setIsFetchingHospitals(false);
      }
    }
    fetchHospitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedHospital || !password) {
      setError('Please select a Hospital and enter Password');
      return;
    }

    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onLogin(selectedHospital, password);
    setIsLoading(false);
  };

  // Filter hospitals by selected city
  const filteredHospitals = hospitals.filter(h => {
    if (!selectedCity) return false;
    let hLng = 75.8;
    if (typeof h.location === 'object' && h.location?.coordinates) {
      hLng = h.location.coordinates[0];
    } else if (typeof h.location === 'string') {
      const match = h.location.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
      if (match) hLng = parseFloat(match[1]);
    }
    return selectedCity === 'Jaipur' ? hLng > 74.0 : hLng < 74.0;
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Hospital Portal</CardTitle>
          <CardDescription>
            Emergency Response Management System
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Select City</Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="pl-10 w-full h-11">
                      <SelectValue placeholder="Choose a City" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="Jaipur">Jaipur</SelectItem>
                      <SelectItem value="Jodhpur">Jodhpur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCity && (
                <div>
                  <Label htmlFor="hospitalId" className="text-sm font-medium">Select Hospital</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      disabled={isLoading || isFetchingHospitals}
                      onValueChange={(val) => {
                        const h = filteredHospitals.find(hosp => hosp.id === val);
                        setSelectedHospital(h);
                      }}
                    >
                      <SelectTrigger className="pl-10 w-full h-11">
                        <SelectValue placeholder={isFetchingHospitals ? "Loading..." : "Choose Hospital"} />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {filteredHospitals.map(hosp => (
                          <SelectItem key={hosp.id} value={hosp.id}>{hosp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              For demo: Enter any Hospital ID and Password
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
