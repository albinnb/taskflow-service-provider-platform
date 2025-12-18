import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-toastify';

/**
 * @desc Component for protecting routes based on authentication status and user role.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const requiredRoles = allowedRoles ? allowedRoles.split(',').map(r => r.trim()) : [];

  // Show toasts as side effects, not during render, to avoid React warnings
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.warn('You must be logged in to view this page.');
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (
      !loading &&
      isAuthenticated &&
      requiredRoles.length > 0 &&
      user &&
      !requiredRoles.includes(user.role)
    ) {
      toast.error('Access denied. You do not have the required permissions.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Authenticating...</div>;
  }

  // 1. Check Authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check Authorization (Role)
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    // Redirect unauthorized users to a safe place
    if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // If authenticated and authorized, render the child route
  return <Outlet />;
};

export default ProtectedRoute;