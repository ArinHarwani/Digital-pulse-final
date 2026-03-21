import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/contexts/DriverContext';
import DriverLogin from './DriverLogin';

const Index = () => {
  const { isLoggedIn } = useDriver();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  return <DriverLogin />;
};

export default Index;
