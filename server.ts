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
        config: parsed.config ? { ...DEFAULT_CONFIG, ...parsed.config } : DEFAULT_CONFIG,
        donations: Array.isArray(parsed.donations) ? parsed.donations : [],
      };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  const initial = { config: DEFAULT_CONFIG, donations: [] };
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

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    isSupabaseConfigured,
    donationsCount: db.donations.length,
    updated_at: db.config.updated_at,
  });
});

app.get('/api/config', (req, res) => {
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

app.get('/api/donations', async (req, res) => {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('doacoes').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          db.donations = data;
          saveServerDB(db);
        } else if (db.donations.length > 0) {
          // Local DB has donations but Supabase returned empty array.
          // Sync local items to Supabase in background without wiping local DB.
          for (const d of db.donations) {
            try {
              let syncRes = await supabase.from('doacoes').insert([{
                valor: d.valor,
                doador: d.doador,
                nome_real: d.nome_real || '',
                telefone: d.telefone || '',
                descricao: d.descricao || '',
                status: d.status || 'pago',
                created_at: d.created_at,
              }]);
              if (syncRes.error && syncRes.error.code === 'PGRST204') {
                await supabase.from('doacoes').insert([{
                  valor: d.valor,
                  doador: d.doador,
                  descricao: d.descricao || '',
                  status: d.status || 'pago',
                  created_at: d.created_at,
                }]);
              }
            } catch (syncErr) {
              // ignore background sync errors
            }
          }
        }
      }
    } catch (e) {
      console.warn('Supabase donations fetch error, using local file DB:', e);
    }
  }
  res.json(db.donations);
});

app.post('/api/donations', async (req, res) => {
  const donationPayload = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `don-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    valor: Number(req.body.valor) || 0,
    doador: (req.body.doador || 'Doador Anônimo').trim(),
    nome_real: (req.body.nome_real || '').trim(),
    telefone: (req.body.telefone || '').trim(),
    descricao: (req.body.descricao || '').trim(),
    status: req.body.status || 'pago',
    created_at: req.body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.donations.unshift(donationPayload);
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      let insertRes = await supabase
        .from('doacoes')
        .insert([{
          valor: donationPayload.valor,
          doador: donationPayload.doador,
          nome_real: donationPayload.nome_real,
          telefone: donationPayload.telefone,
          descricao: donationPayload.descricao,
          status: donationPayload.status,
          created_at: donationPayload.created_at,
        }])
        .select()
        .single();

      // Fallback if optional columns nome_real or telefone don't exist in Supabase schema
      if (insertRes.error && insertRes.error.code === 'PGRST204') {
        insertRes = await supabase
          .from('doacoes')
          .insert([{
            valor: donationPayload.valor,
            doador: donationPayload.doador,
            descricao: donationPayload.descricao,
            status: donationPayload.status,
            created_at: donationPayload.created_at,
          }])
          .select()
          .single();
      }

      if (!insertRes.error && insertRes.data) {
        db.donations = db.donations.map((d) => (d.id === donationPayload.id ? { ...donationPayload, ...insertRes.data } : d));
        saveServerDB(db);
        return res.json({ ...donationPayload, ...insertRes.data });
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
  const index = db.donations.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Doação não encontrada' });
  }

  const updatedDonation = {
    ...db.donations[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  db.donations[index] = updatedDonation;
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      let updateRes = await supabase.from('doacoes').update({ ...req.body, updated_at: updatedDonation.updated_at }).eq('id', id);
      if (updateRes.error && updateRes.error.code === 'PGRST204') {
        const { nome_real, telefone, ...coreBody } = req.body;
        await supabase.from('doacoes').update({ ...coreBody, updated_at: updatedDonation.updated_at }).eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase donation update error:', e);
    }
  }

  res.json(updatedDonation);
});

app.delete('/api/donations/:id', async (req, res) => {
  const { id } = req.params;
  db.donations = db.donations.filter((d) => d.id !== id);
  saveServerDB(db);

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('doacoes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase donation delete error:', e);
    }
  }

  res.json({ success: true, id });
});

app.post('/api/donations/clear', async (req, res) => {
  db.donations = [];
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando e sincronizando dados na porta ${PORT}`);
  });
}

startServer();
