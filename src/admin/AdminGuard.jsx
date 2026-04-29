import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Hides admin routes from non-admin users entirely (silent redirect, no error UI)
export default function AdminGuard({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  // Not logged in → home (looks like 404 to user)
  if (!user) return <Navigate to="/" replace />;
  // Logged in but not admin → home (silent)
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return children;
}
