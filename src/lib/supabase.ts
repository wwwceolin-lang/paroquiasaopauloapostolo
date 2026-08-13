import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CAMPAIGN_CONFIG, INITIAL_DEMO_DONATIONS } from '../data/defaultData';
import { CampaignConfig, Donation, NewDonationEvent } from '../types';

function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip subpaths if user appended /auth/v1, /rest/v1, etc.
  cleaned = cleaned.replace(/\/(auth|rest)\/v\d+.*$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = rawSupabaseAnonKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local BroadcastChannel & EventTarget for local Realtime fallback
const BROADCAST_CHANNEL_NAME = 'paineis_luz_realtime';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
  : null;

const localEventEmitter = new EventTarget();

export const DEFAULT_ADMIN_EMAIL = 'www.ceolin@gmail.com';

// LocalStorage Keys
const STORAGE_DONATIONS_KEY = 'paineis_luz_doacoes_v2';
const STORAGE_CONFIG_KEY = 'paineis_luz_config_v2';

// Helper to clear local test/demo donations
export async function clearLocalDemoDonations(): Promise<void> {
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify([]));
  try {
    await fetch('/api/donations/clear', { method: 'POST' });
  } catch (e) {
    console.warn('API clear error:', e);
  }
  notifyLocalUpdate('donation', { cleared: true });
}

// Helper to notify local listeners
function notifyLocalUpdate(eventType: 'donation' | 'config', data?: unknown) {
  const detail = { type: eventType, data, timestamp: Date.now() };
  localEventEmitter.dispatchEvent(new CustomEvent('update', { detail }));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(detail);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
}

// Listen to broadcast messages from other tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      localEventEmitter.dispatchEvent(new CustomEvent('update', { detail: event.data }));
    }
  };
}

// ================= DONATIONS API =================

export function normalizeSupabaseDonation(item: any): Donation {
  return {
    id: item.id,
    valor: Number(item.valor) || 0,
    doador: item.doador || '',
    nome_real: item['Nome Real (Privado)'] || item.nome_real || item.nomeReal || '',
    telefone: item['Telefone (Privado)'] || item.telefone || '',
    descricao: item.descricao || '',
    status: item.status || 'aberto',
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
  };
}

export async function fetchDonations(): Promise<Donation[]> {
  try {
    const res = await fetch(`/api/donations?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(data));
        return data as Donation[];
      }
    }
  } catch (err) {
    console.warn('API fetch donations fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('doacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const normalized = data.map(normalizeSupabaseDonation);
        localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Supabase fetch exception:', err);
    }
  }

  // Fallback to LocalStorage
  const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored donations', e);
    }
  }
  return INITIAL_DEMO_DONATIONS;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function insertDonation(donation: Omit<Donation, 'id' | 'created_at'>): Promise<Donation> {
  const payload = {
    valor: Number(donation.valor),
    doador: donation.doador.trim(),
    nome_real: donation.nome_real?.trim() || '',
    telefone: donation.telefone?.trim() || '',
    descricao: donation.descricao?.trim() || '',
    status: donation.status || 'aberto',
  };

  try {
    const res = await fetch(`/api/donations?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (res.ok) {
      const created: Donation = await res.json();
      const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
      const items: Donation[] = stored ? JSON.parse(stored) : [];
      const updated = [created, ...items.filter((d) => d.id !== created.id)];
      localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(updated));
      notifyLocalUpdate('donation', created);
      return created;
    }
  } catch (err) {
    console.warn('API insert donation exception:', err);
  }

  const generatedId = generateUUID();
  const fullPayload = {
    id: generatedId,
    ...payload,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      let { data, error } = await supabase
        .from('doacoes')
        .insert([{
          id: fullPayload.id,
          valor: fullPayload.valor,
          doador: fullPayload.doador,
          'Nome Real (Privado)': fullPayload.nome_real,
          'Telefone (Privado)': fullPayload.telefone,
          descricao: fullPayload.descricao,
          status: fullPayload.status,
          created_at: fullPayload.created_at,
        }])
        .select()
        .maybeSingle();

      if (error) {
        let fallbackRes = await supabase
          .from('doacoes')
          .insert([fullPayload])
          .select()
          .maybeSingle();
        if (fallbackRes.error) {
          const { nome_real, telefone, ...corePayload } = fullPayload;
          fallbackRes = await supabase
            .from('doacoes')
            .insert([corePayload])
            .select()
            .maybeSingle();
        }
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        const created = { ...fullPayload, ...normalizeSupabaseDonation(data) };
        const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
        const items: Donation[] = stored ? JSON.parse(stored) : [];
        const updated = [created, ...items.filter((d) => d.id !== created.id)];
        localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(updated));
        notifyLocalUpdate('donation', created);
        return created;
      }
    } catch (err) {
      console.error('Supabase insert exception:', err);
    }
  }

  const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
  const items: Donation[] = stored ? JSON.parse(stored) : [];
  const updated = [fullPayload, ...items.filter((d) => d.id !== fullPayload.id)];
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(updated));
  notifyLocalUpdate('donation', fullPayload);
  return fullPayload;
}

export async function updateDonation(id: string, updates: Partial<Omit<Donation, 'id'>>): Promise<Donation | null> {
  try {
    const res = await fetch(`/api/donations/${id}?_t=${Date.now()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      cache: 'no-store',
    });
    if (res.ok) {
      const updated: Donation = await res.json();
      const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
      if (stored) {
        const items: Donation[] = JSON.parse(stored);
        const newItems = items.map((d) => (d.id === id ? updated : d));
        localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(newItems));
      }
      notifyLocalUpdate('donation', updated);
      return updated;
    }
  } catch (err) {
    console.warn('API update donation exception:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { nome_real, telefone, ...restUpdates } = updates;
      const payload: any = {
        ...restUpdates,
        updated_at: new Date().toISOString(),
      };
      if (nome_real !== undefined) payload['Nome Real (Privado)'] = nome_real;
      if (telefone !== undefined) payload['Telefone (Privado)'] = telefone;

      let { data, error } = await supabase
        .from('doacoes')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        let fallbackRes = await supabase
          .from('doacoes')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (fallbackRes.error) {
          const { nome_real: _nr, telefone: _tf, ...coreUpdates } = updates;
          fallbackRes = await supabase
            .from('doacoes')
            .update({ ...coreUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle();
        }
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        const updated = normalizeSupabaseDonation(data);
        const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
        if (stored) {
          const items: Donation[] = JSON.parse(stored);
          const newItems = items.map((d) => (d.id === id ? { ...d, ...updated } : d));
          localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(newItems));
        }
        notifyLocalUpdate('donation', updated);
        return updated;
      }
    } catch (err) {
      console.error('Supabase update exception:', err);
    }
  }

  const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
  if (!stored) return null;
  const items: Donation[] = JSON.parse(stored);
  const index = items.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const updatedItem: Donation = {
    ...items[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  items[index] = updatedItem;
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(items));
  notifyLocalUpdate('donation', updatedItem);
  return updatedItem;
}

export async function deleteDonation(id: string): Promise<boolean> {
  // Always update local cache immediately so UI doesn't revive item from cache
  const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
  if (stored) {
    try {
      const items: Donation[] = JSON.parse(stored);
      const filtered = items.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error clearing item from localStorage:', e);
    }
  }

  try {
    const res = await fetch(`/api/donations/${id}?_t=${Date.now()}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (res.ok) {
      notifyLocalUpdate('donation', { id, deleted: true });
      return true;
    }
  } catch (err) {
    console.warn('API delete donation exception:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('doacoes')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
  }

  notifyLocalUpdate('donation', { id, deleted: true });
  return true;
}

// ================= CAMPAIGN CONFIG API =================

export async function fetchCampaignConfig(): Promise<CampaignConfig> {
  try {
    const res = await fetch(`/api/config?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const fullConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...data };
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(fullConfig));
        return fullConfig as CampaignConfig;
      }
    }
  } catch (err) {
    console.warn('API fetch config fallback:', err);
  }

  let localConfig: CampaignConfig = DEFAULT_CAMPAIGN_CONFIG;
  const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (stored) {
    try {
      localConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...JSON.parse(stored) };
    } catch (e) {}
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const sbConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...data } as CampaignConfig;
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(sbConfig));
        return sbConfig;
      }
    } catch (err) {
      console.warn('Supabase config exception:', err);
    }
  }

  return localConfig;
}

export async function saveCampaignConfig(config: Partial<CampaignConfig>): Promise<CampaignConfig> {
  let currentConfig: CampaignConfig = DEFAULT_CAMPAIGN_CONFIG;
  const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (stored) {
    try {
      currentConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...JSON.parse(stored) };
    } catch (e) {}
  }

  const updatedConfig: CampaignConfig = {
    ...currentConfig,
    ...config,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updatedConfig));

  try {
    const res = await fetch(`/api/config?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedConfig),
      cache: 'no-store',
    });
    if (res.ok) {
      const saved = await res.json();
      const finalConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...saved } as CampaignConfig;
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(finalConfig));
      notifyLocalUpdate('config', finalConfig);
      return finalConfig;
    }
  } catch (err) {
    console.warn('API save config exception:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existingRow } = await supabase
        .from('configuracoes')
        .select('id')
        .limit(1)
        .maybeSingle();

      const targetId = existingRow?.id || 'default';

      const { data, error } = await supabase
        .from('configuracoes')
        .upsert([{ id: targetId, ...updatedConfig }], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        const finalConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...updatedConfig, ...data } as CampaignConfig;
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(finalConfig));
        notifyLocalUpdate('config', finalConfig);
        return finalConfig;
      }
    } catch (err) {
      console.warn('Supabase config update exception:', err);
    }
  }

  notifyLocalUpdate('config', updatedConfig);
  return updatedConfig;
}

// ================= REALTIME SUBSCRIPTION =================

export function subscribeToRealtimeChanges(
  onDonationChange: () => void,
  onConfigChange: () => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Server Polling for Cross-Device / Cross-Browser Sync
  let lastServerConfigTime = '';
  let lastServerDonationsHash = '';

  const checkServerUpdates = async () => {
    try {
      const res = await fetch(`/api/status?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const statusData = await res.json();
        const currentConfigTime = statusData.updated_at || '';
        const currentDonationsCount = statusData.donationsCount;
        const currentDonationsUpdatedAt = statusData.donationsUpdatedAt || '';

        if (lastServerConfigTime && currentConfigTime !== lastServerConfigTime) {
          onConfigChange();
        }
        lastServerConfigTime = currentConfigTime;

        const donationsHash = `${currentDonationsCount}-${currentDonationsUpdatedAt}`;
        if (lastServerDonationsHash && donationsHash !== lastServerDonationsHash) {
          onDonationChange();
        }
        lastServerDonationsHash = donationsHash;
      }
    } catch (e) {
      // ignore network errors
    }
  };

  checkServerUpdates();
  const pollingInterval = setInterval(checkServerUpdates, 1200);
  unsubscribers.push(() => clearInterval(pollingInterval));

  // 2. Supabase Realtime Channel if configured
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('public_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doacoes' }, () => {
        onDonationChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, () => {
        onConfigChange();
      })
      .subscribe();

    unsubscribers.push(() => {
      supabase.removeChannel(channel);
    });
  }

  // 3. Local fallback listener (BroadcastChannel / Local Events)
  const handleLocalEvent = (e: Event) => {
    const customEv = e as CustomEvent<{ type: string }>;
    if (customEv.detail?.type === 'donation') {
      onDonationChange();
    } else if (customEv.detail?.type === 'config') {
      onConfigChange();
    }
  };

  localEventEmitter.addEventListener('update', handleLocalEvent);
  unsubscribers.push(() => {
    localEventEmitter.removeEventListener('update', handleLocalEvent);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ================= SUPABASE AUTHENTICATION =================

export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase não configurado') };
  }
  try {
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(`Erro no Supabase Auth: ${message}`) };
  }
}

export async function signUpWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase não configurado') };
  }
  try {
    return await supabase.auth.signUp({ email, password });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(`Erro no Supabase Auth: ${message}`) };
  }
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  return await supabase.auth.signOut();
}

export async function getSupabaseUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// Helper SQL Schema Generator string for Admin Modal & SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SCRIPT SQL PARA O SUPABASE (COPIAR E COLAR NO SQL EDITOR DO SUPABASE)
-- Campanha Solar Leilão Beneficente
-- Administrador Oficial: www.ceolin@gmail.com
-- ============================================================

-- 1. Limpa doações de teste/fictícias caso existam
DROP TABLE IF EXISTS public.doacoes CASCADE;

-- 2. Cria a tabela oficial de doações reais do leilão
CREATE TABLE public.doacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  doador TEXT NOT NULL,
  nome_real TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  status TEXT DEFAULT 'pago',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doacoes ADD COLUMN IF NOT EXISTS nome_real TEXT DEFAULT '';
ALTER TABLE public.doacoes ADD COLUMN IF NOT EXISTS telefone TEXT DEFAULT '';

-- 3. Cria a tabela de configurações da campanha solar
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nome_campanha TEXT NOT NULL DEFAULT 'Campanha Luz e Esperança',
  nome_igreja TEXT NOT NULL DEFAULT 'Igreja Matriz de São José',
  meta_total NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
  quantidade_paineis INT NOT NULL DEFAULT 40,
  potencia_painel NUMERIC(8, 2) NOT NULL DEFAULT 550.00,
  economia_mensal_total NUMERIC(12, 2) NOT NULL DEFAULT 2500.00,
  valor_kwh NUMERIC(8, 2) NOT NULL DEFAULT 0.95,
  imagem_igreja TEXT DEFAULT 'default-vector',
  admin_emails TEXT[] DEFAULT ARRAY['www.ceolin@gmail.com'],
  painel_grid_cols INT DEFAULT 10,
  painel_grid_rows INT DEFAULT 4,
  painel_roof_top_percent NUMERIC(5, 2) DEFAULT 28.00,
  painel_roof_left_percent NUMERIC(5, 2) DEFAULT 23.00,
  painel_roof_width_percent NUMERIC(5, 2) DEFAULT 54.00,
  painel_roof_height_percent NUMERIC(5, 2) DEFAULT 22.00,
  painel_roof_perspective_tilt NUMERIC(5, 2) DEFAULT 8.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS admin_emails TEXT[] DEFAULT ARRAY['www.ceolin@gmail.com'];

-- 4. Inserir configuração padrão inicial (caso não exista)
INSERT INTO public.configuracoes (id, nome_campanha, nome_igreja, meta_total, quantidade_paineis)
VALUES ('default', 'Campanha Luz e Esperança', 'Igreja Matriz de São José', 100000.00, 40)
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura publica de doacoes" ON public.doacoes;
DROP POLICY IF EXISTS "Permitir escrita de doacoes" ON public.doacoes;
DROP POLICY IF EXISTS "Permitir leitura publica de configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Permitir escrita de configuracoes" ON public.configuracoes;

-- 7. Criar Políticas de Acesso Público e Transmissão do Leilão
CREATE POLICY "Permitir leitura publica de doacoes" ON public.doacoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de doacoes" ON public.doacoes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura publica de configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);

-- 8. Habilitar Supabase Realtime para sincronização instantânea no Telão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'doacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doacoes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'configuracoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes;
  END IF;
END $$;

-- ============================================================
-- SCRIPT CONCLUÍDO! O banco está pronto para receber doações reais do leilão.
-- Administrador: www.ceolin@gmail.com
-- ============================================================
`;
