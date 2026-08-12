import { Donation } from '../types';
import { formatDateBR } from './formatters';

export function exportDonationsToCSV(donations: Donation[], filename = 'doacoes_campanha_solar'): void {
  if (!donations || donations.length === 0) {
    alert('Nenhuma doação disponível para exportação.');
    return;
  }

  // UTF-8 BOM for Excel to handle special characters properly
  const BOM = '\uFEFF';
  
  // Headers in Portuguese for Brazilian Excel (Semicolon separated)
  const headers = ['ID', 'Data e Hora', 'Doador (Telão)', 'Nome Real (Privado)', 'Telefone (Privado)', 'Valor (R$)', 'Status', 'Descrição / Lote'];

  const rows = donations.map((d) => {
    const statusLabel = d.status === 'aberto' ? 'Em Aberto' : 'Pago';
    const formattedValor = d.valor ? d.valor.toFixed(2).replace('.', ',') : '0,00';
    const formattedDate = formatDateBR(d.created_at);
    
    // Escape fields containing semicolons or line breaks
    const cleanDoador = `"${(d.doador || '').replace(/"/g, '""')}"`;
    const cleanNomeReal = `"${(d.nome_real || '').replace(/"/g, '""')}"`;
    const cleanTelefone = `"${(d.telefone || '').replace(/"/g, '""')}"`;
    const cleanDescricao = `"${(d.descricao || '').replace(/"/g, '""')}"`;

    return [
      d.id,
      `"${formattedDate}"`,
      cleanDoador,
      cleanNomeReal,
      cleanTelefone,
      `"${formattedValor}"`,
      statusLabel,
      cleanDescricao,
    ].join(';');
  });

  const csvContent = BOM + [headers.join(';'), ...rows].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
