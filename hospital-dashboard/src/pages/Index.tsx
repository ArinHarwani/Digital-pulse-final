import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/pages/Dashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Index = () => {
  const [hospital, setHospital] = useState<any>(null);

  const handleLogin = (selectedHospital: any, password: string) => {
    // In production, this would validate against a backend
    console.log('Login attempt:', { hospitalId: selectedHospital?.id });
    setHospital(selectedHospital);
  };

  const handleLogout = () => {
    setHospital(null);
  };

  if (!hospital) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <Dashboard onLogout={handleLogout} hospital={hospital} />
    </ErrorBoundary>
  );
};

export default Index;
