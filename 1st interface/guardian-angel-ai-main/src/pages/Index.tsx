import { Navigate } from 'react-router-dom';

// Redirect to Welcome Screen
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
