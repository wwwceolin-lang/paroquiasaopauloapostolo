import { CampaignConfig, CampaignStats, Donation } from '../types';

export function calculateCampaignStats(
  config: CampaignConfig,
  donations: Donation[]
): CampaignStats {
  const metaTotal = Math.max(1, Number(config.meta_total) || 100000);
  const totalPaineis = Math.max(1, Number(config.quantidade_paineis) || 40);
  
  // Sum of all donations (both pago and aberto)
  const jaArrecadado = donations.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
  
  const faltaArrecadar = Math.max(0, metaTotal - jaArrecadado);
  const progressoPercentual = Math.min(100, (jaArrecadado / metaTotal) * 100);
  
  const valorPorPainel = metaTotal / totalPaineis;
  
  // Panels acquired = floor of (jaArrecadado / valorPorPainel), capped at totalPaineis
  const paineisConquistadosCalculated = Math.floor(jaArrecadado / valorPorPainel);
  const paineisConquistados = Math.min(totalPaineis, Math.max(0, paineisConquistadosCalculated));
  
  const porcentagemCapacidade = (paineisConquistados / totalPaineis) * 100;
  
  const economiaMensalTotal = Number(config.economia_mensal_total) || 2500;
  const economiaMensalConquistada = (paineisConquistados / totalPaineis) * economiaMensalTotal;
  const economiaAnualConquistada = economiaMensalConquistada * 12;

  return {
    investimento_total: metaTotal,
    ja_arrecadado: jaArrecadado,
    falta_arrecadar: faltaArrecadar,
    progresso_percentual: progressoPercentual,
    paineis_conquistados: paineisConquistados,
    paineis_totais: totalPaineis,
    porcentagem_capacidade: porcentagemCapacidade,
    economia_mensal_conquistada: economiaMensalConquistada,
    economia_anual_conquistada: economiaAnualConquistada,
    valor_por_painel: valorPorPainel,
  };
}
