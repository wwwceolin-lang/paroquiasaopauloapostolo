import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Supabase client initialization on server side
const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const rawSupabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function cleanUrl(url: string) {
  if (!url) return '';
  let c = url.trim().replace(/\/+$/, '');
  c = c.replace(/\/(auth|rest)\/v\d+.*$/i, '').replace(/\/+$/, '');
  return c;
}

const supabaseUrl = cleanUrl(rawSupabaseUrl);
const supabaseKey = rawSupabaseKey;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Database File Persistence Path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Default initial data
const DEFAULT_CONFIG = {
  id: 'default',
  nome_campanha: 'Campanha Luz e Esperança',
  nome_igreja: 'Igreja Matriz de São José',
  meta_total: 100000,
  quantidade_paineis: 40,
  potencia_painel: 550,
  economia_mensal_total: 2500,
  valor_kwh: 0.95,
  imagem_igreja: 'default-vector',
  admin_emails: ['www.ceolin@gmail.com'],
  painel_grid_cols: 10,
  painel_grid_rows: 4,
  painel_roof_top_percent: 28,
  painel_roof_left_percent: 23,
  painel_roof_width_percent: 54,
  painel_roof_height_percent: 22,
  painel_roof_perspective_tilt: 8,
  updated_at: new Date().toISOString(),
};

interface ServerDB {
  lastDonationsUpdate?: string;
  deletedIds?: string[];
  config: typeof DEFAULT_CONFIG;
  donations: Array<{
    id: string;
    valor: number;
    doador: string;
    nome_real?: string;
    telefone?: string;
    descricao?: string;
    status: string;
    created_at: string;
    updated_at?: string;
  }>;
}

function loadServerDB(): ServerDB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        lastDonationsUpdate: parsed.lastDonationsUpdate || new Date().toISOString(),
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        config: parsed.config ? { ...DEFAULT_CONFIG, ...parsed.config } : DEFAULT_CONFIG,
        donations: Array.isArray(parsed.donations) ? parsed.donations : [],
      };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  const initial = { lastDonationsUpdate: new Date().toISOString(), deletedIds: [], config: DEFAULT_CONFIG, donations: [] };
  saveServerDB(initial);
  return initial;
}

function saveServerDB(db: ServerDB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

let db = loadServerDB();

// Sync initial data from Supabase if configured
async function syncFromSupabase() {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).maybeSingle();
    if (configData) {
      const sbTime = configData.updated_at ? new Date(configData.updated_at).getTime() : 0;
      const localTime = db.config?.updated_at ? new Date(db.config.updated_at).getTime() : 0;
      if (sbTime > localTime) {
        db.config = { ...DEFAULT_CONFIG, ...configData };
      }
    }
    const { data: donationsData } = await supabase.from('doacoes').select('*').order('created_at', { ascending: false });
    if (donationsData && donationsData.length > 0) {
      db.donations = donationsData;
    }
    saveServerDB(db);
  } catch (e) {
    console.warn('Initial Supabase fetch warning:', e);
  }
}

syncFromSupabase();

// ================= API ROUTES =================

// Anti-cache header middleware for all API routes to ensure real-time cross-device updates
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    isSupabaseConfigured: Boolean(supabase && isSupabaseConfigured),
    donationsCount: db.donations.length,
    donationsUpdatedAt: db.lastDonationsUpdate || db.config.updated_at || new Date().toISOString(),
    updated_at: db.config.updated_at || new Date().toISOString(),
  });
});

app.get('/api/config', async (req, res) => {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).maybeSingle();
      if (configData) {
        db.config = { ...DEFAULT_CONFIG, ...configData };
        saveServerDB(db);
      }
    } catch (e) {
      console.warn('Supabase config fetch warning:', e);
    }
  }
  res.json(db.config);
});

app.post('/api/config', async (req, res) => {
  const updatedTime = new Date().toISOString();
  const newConfig = {
    ...db.config,
    ...req.body,
    updated_at: updatedTime,
  };
  db.config = newConfig;
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      const { data: existingRow } = await supabase.from('configuracoes').select('id').limit(1).maybeSingle();
      const targetId = existingRow?.id || 'default';

      // Clean payload for Supabase configuracoes table
      const supabasePayload = {
        id: targetId,
        nome_campanha: newConfig.nome_campanha,
        nome_igreja: newConfig.nome_igreja,
        meta_total: newConfig.meta_total,
        quantidade_paineis: newConfig.quantidade_paineis,
        potencia_painel: newConfig.potencia_painel,
        economia_mensal_total: newConfig.economia_mensal_total,
        valor_kwh: newConfig.valor_kwh,
        imagem_igreja: newConfig.imagem_igreja,
        painel_grid_cols: newConfig.painel_grid_cols ?? 10,
        painel_grid_rows: newConfig.painel_grid_rows ?? 4,
        painel_roof_top_percent: newConfig.painel_roof_top_percent ?? 28,
        painel_roof_left_percent: newConfig.painel_roof_left_percent ?? 23,
        painel_roof_width_percent: newConfig.painel_roof_width_percent ?? 54,
        painel_roof_height_percent: newConfig.painel_roof_height_percent ?? 22,
        painel_roof_perspective_tilt: newConfig.painel_roof_perspective_tilt ?? 8,
        updated_at: updatedTime,
      };

      await supabase.from('configuracoes').upsert([supabasePayload], { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase config update warning:', e);
    }
  }

  res.json(db.config);
});

function normalizeSupabaseDonation(item: any) {
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

app.get('/api/donations', async (req, res) => {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('doacoes').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const normalizedList = data.map(normalizeSupabaseDonation);
        db.donations = normalizedList;
        saveServerDB(db);
        return res.json(normalizedList);
      }
    } catch (e) {
      console.warn('Supabase donations fetch error, using local file DB:', e);
    }
  }
  const deletedSet = new Set(db.deletedIds || []);
  const cleanDonations = db.donations.filter((d) => !deletedSet.has(d.id));
  res.json(cleanDonations);
});

function isUUID(str: string): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

app.post('/api/donations', async (req, res) => {
  const donationId = isUUID(req.body.id) ? req.body.id : generateUUID();
  const donationPayload = {
    id: donationId,
    valor: Number(req.body.valor) || 0,
    doador: (req.body.doador || 'Doador Anônimo').trim(),
    nome_real: (req.body.nome_real || '').trim(),
    telefone: (req.body.telefone || '').trim(),
    descricao: (req.body.descricao || '').trim(),
    status: req.body.status || 'aberto',
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Ensure ID is not in deletedIds if re-created
  if (db.deletedIds) {
    db.deletedIds = db.deletedIds.filter((id) => id !== donationPayload.id);
  }

  const existingIdx = db.donations.findIndex((d) => d.id === donationPayload.id);
  if (existingIdx >= 0) {
    db.donations[existingIdx] = donationPayload;
  } else {
    db.donations.unshift(donationPayload);
  }
  db.lastDonationsUpdate = new Date().toISOString();
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      // Primary attempt: with custom column names 'Nome Real (Privado)' and 'Telefone (Privado)'
      let insertRes = await supabase
        .from('doacoes')
        .insert([{
          id: donationPayload.id,
          valor: donationPayload.valor,
          doador: donationPayload.doador,
          'Nome Real (Privado)': donationPayload.nome_real,
          'Telefone (Privado)': donationPayload.telefone,
          descricao: donationPayload.descricao,
          status: donationPayload.status,
          created_at: donationPayload.created_at,
        }])
        .select()
        .maybeSingle();

      // Fallback 1: with standard column names nome_real and telefone
      if (insertRes.error) {
        insertRes = await supabase
          .from('doacoes')
          .insert([{
            id: donationPayload.id,
            valor: donationPayload.valor,
            doador: donationPayload.doador,
            nome_real: donationPayload.nome_real,
            telefone: donationPayload.telefone,
            descricao: donationPayload.descricao,
            status: donationPayload.status,
            created_at: donationPayload.created_at,
          }])
          .select()
          .maybeSingle();
      }

      // Fallback 2: core columns
      if (insertRes.error) {
        insertRes = await supabase
          .from('doacoes')
          .insert([{
            id: donationPayload.id,
            valor: donationPayload.valor,
            doador: donationPayload.doador,
            descricao: donationPayload.descricao,
            status: donationPayload.status,
            created_at: donationPayload.created_at,
          }])
          .select()
          .maybeSingle();
      }

      if (!insertRes.error && insertRes.data) {
        const rawData = insertRes.data;
        const synced = {
          ...donationPayload,
          ...normalizeSupabaseDonation(rawData),
          nome_real: donationPayload.nome_real || rawData['Nome Real (Privado)'] || rawData.nome_real || '',
          telefone: donationPayload.telefone || rawData['Telefone (Privado)'] || rawData.telefone || '',
        };
        db.donations = db.donations.map((d) => (d.id === donationPayload.id ? synced : d));
        saveServerDB(db);
        return res.json(synced);
      } else if (insertRes.error) {
        console.warn('Supabase donation insert warning:', insertRes.error);
      }
    } catch (e) {
      console.warn('Supabase donation insert exception:', e);
    }
  }

  res.json(donationPayload);
});

app.put('/api/donations/:id', async (req, res) => {
  const { id } = req.params;
  let index = db.donations.findIndex((d) => d.id === id);
  const existingItem = index >= 0 ? db.donations[index] : { id };

  const updatedDonation = {
    ...existingItem,
    id,
    valor: req.body.valor !== undefined ? Number(req.body.valor) : (existingItem as any).valor || 0,
    doador: req.body.doador !== undefined ? String(req.body.doador).trim() : (existingItem as any).doador || '',
    nome_real: req.body.nome_real !== undefined ? String(req.body.nome_real).trim() : (existingItem as any).nome_real || '',
    telefone: req.body.telefone !== undefined ? String(req.body.telefone).trim() : (existingItem as any).telefone || '',
    descricao: req.body.descricao !== undefined ? String(req.body.descricao).trim() : (existingItem as any).descricao || '',
    status: req.body.status || (existingItem as any).status || 'aberto',
    created_at: (existingItem as any).created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (index >= 0) {
    db.donations[index] = updatedDonation;
  } else {
    db.donations.unshift(updatedDonation);
  }
  db.lastDonationsUpdate = new Date().toISOString();
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      let updateRes = await supabase
        .from('doacoes')
        .update({
          valor: updatedDonation.valor,
          doador: updatedDonation.doador,
          'Nome Real (Privado)': updatedDonation.nome_real,
          'Telefone (Privado)': updatedDonation.telefone,
          descricao: updatedDonation.descricao,
          status: updatedDonation.status,
          updated_at: updatedDonation.updated_at,
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateRes.error) {
        updateRes = await supabase
          .from('doacoes')
          .update({
            valor: updatedDonation.valor,
            doador: updatedDonation.doador,
            nome_real: updatedDonation.nome_real,
            telefone: updatedDonation.telefone,
            descricao: updatedDonation.descricao,
            status: updatedDonation.status,
            updated_at: updatedDonation.updated_at,
          })
          .eq('id', id)
          .select()
          .maybeSingle();
      }

      if (updateRes.error) {
        updateRes = await supabase
          .from('doacoes')
          .update({
            valor: updatedDonation.valor,
            doador: updatedDonation.doador,
            descricao: updatedDonation.descricao,
            status: updatedDonation.status,
            updated_at: updatedDonation.updated_at,
          })
          .eq('id', id)
          .select()
          .maybeSingle();
      }

      if (!updateRes.error && updateRes.data) {
        const synced = {
          ...updatedDonation,
          ...normalizeSupabaseDonation(updateRes.data),
          nome_real: updatedDonation.nome_real || updateRes.data['Nome Real (Privado)'] || updateRes.data.nome_real || '',
          telefone: updatedDonation.telefone || updateRes.data['Telefone (Privado)'] || updateRes.data.telefone || '',
        };
        const idx = db.donations.findIndex((d) => d.id === id);
        if (idx >= 0) {
          db.donations[idx] = synced;
          saveServerDB(db);
        }
        return res.json(synced);
      }
    } catch (e) {
      console.warn('Supabase donation update error:', e);
    }
  }

  res.json(updatedDonation);
});

app.delete('/api/donations/:id', async (req, res) => {
  const { id } = req.params;
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }
  db.donations = db.donations.filter((d) => d.id !== id);
  db.lastDonationsUpdate = new Date().toISOString();
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('doacoes').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete warning:', error);
      }
    } catch (e) {
      console.warn('Supabase donation delete error:', e);
    }
  }

  res.json({ success: true, id });
});

app.post('/api/donations/clear', async (req, res) => {
  if (!db.deletedIds) db.deletedIds = [];
  db.donations.forEach((d) => {
    if (!db.deletedIds!.includes(d.id)) {
      db.deletedIds!.push(d.id);
    }
  });
  db.donations = [];
  db.lastDonationsUpdate = new Date().toISOString();
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('doacoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Supabase donations clear error:', e);
    }
  }

  res.json({ success: true, cleared: true });
});

// ================= VITE / STATIC MIDDLEWARE =================

async function startServer() {
  // Redirect non-GET/HEAD methods on frontend pages back to GET before static/Vite middleware
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.method !== 'GET' && req.method !== 'HEAD') {
      return res.redirect(303, req.originalUrl || req.path || '/');
    }
    next();
  });

  let viteServer: any = null;
  if (process.env.NODE_ENV !== 'production') {
    viteServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  // SPA Catch-All Fallback Handler for ALL non-API requests
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    if (process.env.NODE_ENV !== 'production' && viteServer) {
      try {
        const url = req.originalUrl || req.url || '/';
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await viteServer.transformIndexHtml(url, template);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        return next(e);
      }
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      return res.sendFile(path.join(distPath, 'index.html'));
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando e sincronizando dados na porta ${PORT}`);
  });
}

startServer();
