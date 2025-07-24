import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth(); 
 
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] text-white text-xl">
        Loading user session...
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;