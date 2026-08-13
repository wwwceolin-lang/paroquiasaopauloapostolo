import { useState, useEffect, useCallback } from 'react';
import { CampaignConfig, Donation, NewDonationEvent } from './types';
import {
  fetchCampaignConfig,
  fetchDonations,
  insertDonation,
  updateDonation,
  deleteDonation,
  saveCampaignConfig,
  subscribeToRealtimeChanges,
  signOutSupabase,
} from './lib/supabase';
import { calculateCampaignStats } from './lib/calcStats';
import { Navbar } from './components/Navbar';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { TelaoView } from './views/TelaoView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminDonationsView } from './views/AdminDonationsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { DEFAULT_CAMPAIGN_CONFIG } from './data/defaultData';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('admin_authed') === 'true' || localStorage.getItem('admin_authed') === 'true';
  });

  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [lastEvent, setLastEvent] = useState<NewDonationEvent | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Client-side router navigation
  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  }, []);

  // Sync back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial Load & Data Hydration
  const loadInitialData = useCallback(async () => {
    try {
      const [fetchedConfig, fetchedDonations] = await Promise.all([
        fetchCampaignConfig(),
        fetchDonations(),
      ]);
      setConfig(fetchedConfig);
      setDonations(fetchedDonations);
    } catch (err) {
      console.error('Error loading initial campaign data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Realtime updates subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges(
      async () => {
        // Donation changed or added in Realtime
        const updatedDonations = await fetchDonations();
        setDonations((prevDonations) => {
          // Calculate previous vs new panels gained if a new donation arrived
          if (updatedDonations.length > prevDonations.length) {
            const newDonation = updatedDonations[0];
            const oldStats = calculateCampaignStats(config, prevDonations);
            const newStats = calculateCampaignStats(config, updatedDonations);
            const gained = newStats.paineis_conquistados - oldStats.paineis_conquistados;

            setLastEvent({
              donation: newDonation,
              previousPaineis: oldStats.paineis_conquistados,
              newPaineis: newStats.paineis_conquistados,
              paineisGained: Math.max(0, gained),
              timestamp: Date.now(),
            });
          }
          return updatedDonations;
        });
      },
      async () => {
        // Config changed in Realtime
        const updatedConfig = await fetchCampaignConfig();
        setConfig(updatedConfig);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Admin Login & Logout
  const handleLoginSuccess = (emailLoggedIn: string) => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('admin_authed', 'true');
    sessionStorage.setItem('admin_email', emailLoggedIn);
    localStorage.setItem('admin_authed', 'true');
    localStorage.setItem('admin_email', emailLoggedIn);
    navigate('/admin');
  };

  const handleLogout = async () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authed');
    sessionStorage.removeItem('admin_email');
    localStorage.removeItem('admin_authed');
    localStorage.removeItem('admin_email');
    await signOutSupabase();
    navigate('/admin');
  };

  // CRUD Actions
  const handleAddDonation = async (newDonationData: Omit<Donation, 'id' | 'created_at'>) => {
    const prevStats = calculateCampaignStats(config, donations);
    const created = await insertDonation(newDonationData);
    const updatedDonations = await fetchDonations();
    setDonations(updatedDonations);

    const newStats = calculateCampaignStats(config, updatedDonations);
    const gained = newStats.paineis_conquistados - prevStats.paineis_conquistados;

    setLastEvent({
      donation: created,
      previousPaineis: prevStats.paineis_conquistados,
      newPaineis: newStats.paineis_conquistados,
      paineisGained: Math.max(0, gained),
      timestamp: Date.now(),
    });
  };

  const handleUpdateDonation = async (id: string, updates: Partial<Omit<Donation, 'id'>>) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    await updateDonation(id, updates);
    const updated = await fetchDonations();
    setDonations(updated);
  };

  const handleDeleteDonation = async (id: string) => {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    await deleteDonation(id);
    const updated = await fetchDonations();
    setDonations(updated);
  };

  const handleSaveConfig = async (updatedConfigPartial: Partial<CampaignConfig>) => {
    const updated = await saveCampaignConfig(updatedConfigPartial);
    setConfig(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-amber-400 font-bold text-sm tracking-widest uppercase animate-pulse">
          Carregando Campanha Solar...
        </p>
      </div>
    );
  }

  // Determine current active view based on path
  const renderView = () => {
    if (currentPath.startsWith('/admin')) {
      if (!isAdminAuthenticated) {
        return (
          <AdminLoginView
            onLoginSuccess={handleLoginSuccess}
            allowedEmails={config.admin_emails}
          />
        );
      }
      if (currentPath === '/admin/doacoes') {
        return (
          <AdminDonationsView
            donations={donations}
            onAddDonation={handleAddDonation}
            onUpdateDonation={handleUpdateDonation}
            onDeleteDonation={handleDeleteDonation}
          />
        );
      }
      if (currentPath === '/admin/configuracoes') {
        return <AdminSettingsView config={config} onSaveConfig={handleSaveConfig} />;
      }
      // Default admin path (/admin)
      return (
        <AdminDashboardView
          config={config}
          donations={donations}
          onAddDonation={handleAddDonation}
          onUpdateDonation={handleUpdateDonation}
          onDeleteDonation={handleDeleteDonation}
          onNavigate={navigate}
        />
      );
    }

    // Default Public Telão View (`/` or `/telao`)
    return (
      <TelaoView
        config={config}
        donations={donations}
        lastEvent={lastEvent}
        onClearEvent={() => setLastEvent(null)}
        onNavigate={navigate}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />
    );
  };

  const isTelao = !currentPath.startsWith('/admin');

  return (
    <div className={`min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col ${isTelao ? 'lg:h-screen lg:max-h-screen lg:overflow-hidden' : ''}`}>
      <PwaInstallPrompt />

      {!isTelao && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className={`flex-1 ${isTelao ? 'lg:h-full lg:min-h-0 lg:overflow-hidden overflow-y-auto' : ''}`}>{renderView()}</main>
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
