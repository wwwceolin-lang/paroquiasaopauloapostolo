import { CampaignConfig, Donation } from '../types';

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  id: 'default',
  nome_campanha: 'Campanha Luz e Esperança',
  nome_igreja: 'Igreja Matriz de São José',
  meta_total: 100000,
  quantidade_paineis: 40,
  potencia_painel: 550, // 550 Wp
  economia_mensal_total: 2500, // R$ 2.500/mês
  valor_kwh: 0.95, // R$ 0.95/kWh
  imagem_igreja: 'default-vector',
  admin_emails: ['www.ceolin@gmail.com'],
  painel_grid_cols: 10,
  painel_grid_rows: 4,
  painel_roof_top_percent: 28,
  painel_roof_left_percent: 23,
  painel_roof_width_percent: 54,
  painel_roof_height_percent: 22,
  painel_roof_perspective_tilt: 8,
};

export const INITIAL_DEMO_DONATIONS: Donation[] = [];
