import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../AuthContext';
import Maintenance from '../pages/Maintenance';

export default function SiteGuard({ children }) {
  const { settings } = useSettings();
  const { profile, loading } = useAuth();

  if (loading) return null;

  const siteOff = String(settings.site_enabled).toUpperCase() === 'FALSE';
  const maintenance = String(settings.maintenance_mode).toUpperCase() === 'TRUE';

  if ((siteOff || maintenance) && !profile?.is_admin) {
    return <Maintenance />;
  }

  return children;
}
