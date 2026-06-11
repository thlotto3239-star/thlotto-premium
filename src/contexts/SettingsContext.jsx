import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper to adjust color brightness for primary-dark and primary-light
  const adjustBrightness = (hex, percent) => {
    let num = parseInt(hex.replace('#', ''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = ((num >> 8) & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;
    return "#" + (
      0x1000000 +
      (R<255?R<1?0:R:255)*0x10000 +
      (B<255?B<1?0:B:255)*0x100 +
      (G<255?G<1?0:G:255)
    ).toString(16).slice(1);
  };

  const applyTheme = (color) => {
    if (!color) return;
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-primary-dark', adjustBrightness(color, -20));
    document.documentElement.style.setProperty('--color-primary-light', adjustBrightness(color, 80));
  };

  useEffect(() => {
    // 1. Check URL parameters for Live Preview mode (used by Admin iframe)
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get('preview') === 'true';

    if (isPreview) {
      const previewSettings = {
        site_name: params.get('name') || 'TH LOTTO',
        site_logo_url: params.get('logo') || 'https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png',
        site_primary_color: params.get('primaryColor') || '#1a7e2a'
      };
      setSettings(previewSettings);
      applyTheme(previewSettings.site_primary_color);
      
      // Listen for postMessage from Admin App for real-time slider/picker updates
      const handleMessage = (e) => {
        if (e.data?.type === 'UPDATE_APPEARANCE') {
          const newSettings = e.data.payload;
          setSettings(prev => ({ ...prev, ...newSettings }));
          if (newSettings.site_primary_color) {
            applyTheme(newSettings.site_primary_color);
          }
        }
      };
      window.addEventListener('message', handleMessage);
      setLoading(false);
      return () => window.removeEventListener('message', handleMessage);
    } else {
      // 2. Fetch from database for normal users
      const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('key,value').in('key', [
          'site_name', 'site_logo_url', 'site_primary_color',
          'site_enabled', 'maintenance_mode'
        ]);
        const map = {};
        data?.forEach(s => { map[s.key] = s.value });
        setSettings(map);
        if (map.site_primary_color) {
          applyTheme(map.site_primary_color);
        }
        setLoading(false);
      };
      fetchSettings();
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
