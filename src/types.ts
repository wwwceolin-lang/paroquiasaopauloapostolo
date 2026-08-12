export interface Donation {
  id: string;
  valor: number;
  doador: string;
  nome_real?: string;
  telefone?: string;
  descricao?: string;
  status?: 'pago' | 'aberto';
  created_at: string;
  updated_at?: string;
}

export interface CampaignConfig {
  id: string;
  nome_campanha: string;
  nome_igreja: string;
  meta_total: number;
  quantidade_paineis: number;
  potencia_painel: number; // Watts peak per panel
  economia_mensal_total: number; // Estimated monthly savings for full system in R$
  valor_kwh: number; // R$ / kWh
  imagem_igreja: string; // URL or preset identifier
  admin_emails?: string[]; // List of authorized admin emails
  // Visual roof overlay positioning settings
  painel_grid_cols?: number;
  painel_grid_rows?: number;
  painel_roof_top_percent?: number;
  painel_roof_left_percent?: number;
  painel_roof_width_percent?: number;
  painel_roof_height_percent?: number;
  painel_roof_perspective_tilt?: number;
  updated_at?: string;
}

export interface CampaignStats {
  investimento_total: number;
  ja_arrecadado: number;
  falta_arrecadar: number;
  progresso_percentual: number;
  paineis_conquistados: number;
  paineis_totais: number;
  porcentagem_capacidade: number;
  economia_mensal_conquistada: number;
  economia_anual_conquistada: number;
  valor_por_painel: number;
}

export interface NewDonationEvent {
  donation: Donation;
  previousPaineis: number;
  newPaineis: number;
  paineisGained: number;
  timestamp: number;
}
