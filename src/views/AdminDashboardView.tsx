import React, { useState } from 'react';
import { CampaignConfig, Donation } from '../types';
import { calculateCampaignStats } from '../lib/calcStats';
import { formatCurrency, formatDateBR } from '../lib/formatters';
import { exportDonationsToCSV } from '../lib/exportCsv';

interface AdminDashboardViewProps {
  config: CampaignConfig;
  donations: Donation[];
  onAddDonation: (donation: Omit<Donation, 'id' | 'created_at'>) => Promise<void>;
  onUpdateDonation?: (id: string, updates: Partial<Omit<Donation, 'id'>>) => Promise<void>;
  onDeleteDonation: (id: string) => Promise<void>;
  onNavigate: (path: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  config,
  donations,
  onAddDonation,
  onUpdateDonation,
  onDeleteDonation,
  onNavigate,
}) => {
  const [valor, setValor] = useState('');
  const [doador, setDoador] = useState('');
  const [nomeReal, setNomeReal] = useState('');
  const [telefone, setTelefone] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<'pago' | 'aberto'>('aberto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingDonation, setDeletingDonation] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = calculateCampaignStats(config, donations);

  const handleQuickAdd = (amount: number) => {
    const current = Number(valor) || 0;
    setValor(String(current + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numericValue = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (!numericValue || numericValue <= 0) {
      setErrorMessage('Por favor, informe um valor de doação válido.');
      return;
    }
    if (!doador.trim()) {
      setErrorMessage('Por favor, informe o nome de exibição no telão.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDonation({
        valor: numericValue,
        doador: doador.trim(),
        nome_real: nomeReal.trim(),
        telefone: telefone.trim(),
        descricao: descricao.trim(),
        status: status,
      });

      const statusText = status === 'pago' ? 'Pago' : 'Em Aberto';
      setSuccessMessage(`✅ Doação de ${formatCurrency(numericValue)} (${statusText}) enviada ao Telão com sucesso!`);
      setValor('');
      setDoador('');
      setNomeReal('');
      setTelefone('');
      setDescricao('');
      setStatus('aberto');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setErrorMessage('Erro ao registrar doação. Verifique a conexão.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (donation: Donation) => {
    if (!onUpdateDonation) return;
    const newStatus = donation.status === 'aberto' ? 'pago' : 'aberto';
    await onUpdateDonation(donation.id, { status: newStatus });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-8">
      
      {/* Top Banner Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="text-xs font-bold uppercase text-amber-400 tracking-wider">Painel Principal de Leilão</div>
          <h1 className="text-2xl md:text-3xl font-black text-white">{config.nome_campanha}</h1>
          <p className="text-xs text-slate-400">{config.nome_igreja}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportDonationsToCSV(donations)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Exportar CSV / Excel</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/doacoes')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            📋 Ver Histórico Completo
          </button>
          <button
            onClick={() => onNavigate('/admin/configuracoes')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            ⚙️ Configurações
          </button>
        </div>
      </div>

      {/* Quick KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Investimento Total</div>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(stats.investimento_total)}</div>
          <div className="text-[10px] text-slate-500 mt-1">Meta da Campanha</div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-amber-500/30">
          <div className="text-xs text-amber-400 uppercase font-semibold">Já Arrecadado</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{formatCurrency(stats.ja_arrecadado)}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">{stats.progresso_percentual.toFixed(1)}% Alcançado</div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Falta Arrecadar</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{formatCurrency(stats.falta_arrecadar)}</div>
          <div className="text-[10px] text-slate-500 mt-1">Para concluir o projeto</div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Painéis Conquistados</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ☀️ {stats.paineis_conquistados} <span className="text-xs text-slate-400 font-normal">/ {stats.paineis_totais}</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">
            ~{formatCurrency(stats.valor_por_painel)} cada painel
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left (7 cols), Recent Donations on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: DONATION REGISTRATION FORM */}
        <div className="lg:col-span-7 bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl text-xl font-bold">
              ✍️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Cadastrar Nova Doação / Arrematação</h2>
              <p className="text-xs text-slate-400">
                Os dados digitados aqui aparecem instantaneamente na Tela do Telão ao vivo.
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-sm font-bold animate-pulse">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-sm font-bold">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                Valor da Doação (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-lg">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 3500.00"
                  required
                  className="w-full bg-slate-950 border-2 border-amber-500/40 text-amber-300 text-2xl font-black rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Quick Value Addition Shortcuts */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[11px] text-slate-400 font-medium self-center mr-1">Atalhos:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  + R$ 500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(1000)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  + R$ 1.000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(2500)}
                  className="bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  + R$ 2.500 (1 Painel)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(5000)}
                  className="bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  + R$ 5.000 (2 Painéis)
                </button>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                Status do Pagamento *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    status === 'pago'
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟢</span>
                  <span>Pago (Confirmado)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('aberto')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    status === 'aberto'
                      ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🟠</span>
                  <span>Em Aberto (Pendente)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome para Exibição no Telão (Público) *
              </label>
              <input
                type="text"
                value={doador}
                onChange={(e) => setDoador(e.target.value)}
                placeholder="Ex: Anônimo, Família Silva, Mercado São José..."
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-medium rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                📢 Nome que aparecerá publicamente no Telão e nas transmissões.
              </p>
            </div>

            {/* Private donor fields */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  🔒 Cadastro Interno de Identificação (Não aparece no Telão)
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  Apenas Administração
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Nome Real do Doador (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nomeReal}
                    onChange={(e) => setNomeReal(e.target.value)}
                    placeholder="Ex: João da Silva Sauro"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Telefone de Contato (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                Descrição ou Motivo da Contribuição (Opcional)
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Arrematação do lote 12 / Doação da comunidade"
                className="w-full bg-slate-950 border border-slate-800 text-white font-medium rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-base transition-all transform hover:scale-[1.01] shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'REGISTRANDO...' : '🚀 REGISTRAR DOAÇÃO NO TELÃO'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: RECENT DONATIONS ACTIVITY */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-base">Últimas Doações Registradas</h3>
            <span className="text-xs text-amber-400 font-bold">{donations.length} total</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {donations.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhuma doação cadastrada ainda.
              </div>
            ) : (
              donations.slice(0, 8).map((d) => {
                const isPaid = d.status !== 'aberto';
                return (
                  <div
                    key={d.id}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{d.doador}</span>
                        {/* Status Badge Toggle */}
                        {onUpdateDonation ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(d)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                              isPaid
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                            }`}
                            title="Clique para alternar o status entre Pago e Aberto"
                          >
                            {isPaid ? '🟢 Pago' : '🟠 Aberto'}
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isPaid ? '🟢 Pago' : '🟠 Aberto'}
                          </span>
                        )}
                      </div>
                      {(d.nome_real || d.telefone) && (
                        <div className="text-[11px] font-medium text-amber-300/90 flex items-center gap-1.5 flex-wrap">
                          <span>🔒</span>
                          {d.nome_real && <span>Real: <strong>{d.nome_real}</strong></span>}
                          {d.telefone && <span>• 📱 {d.telefone}</span>}
                        </div>
                      )}
                      {d.descricao && <div className="text-xs text-slate-400 truncate">{d.descricao}</div>}
                      <div className="text-[10px] text-slate-500">{formatDateBR(d.created_at)}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-amber-300 text-base">{formatCurrency(d.valor)}</div>
                      <button
                        type="button"
                        onClick={() => setDeletingDonation(d)}
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 px-2.5 py-1 rounded text-xs font-bold border border-rose-500/40 transition-colors mt-1"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deletingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-lg text-white">Confirmar Exclusão</h3>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Doador:</span>
                <strong className="text-white">{deletingDonation.doador}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Valor:</span>
                <strong className="text-amber-300 font-mono">{formatCurrency(deletingDonation.valor)}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Esta ação removerá a doação permanentemente e os valores do Telão serão recalculados.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingDonation(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await onDeleteDonation(deletingDonation.id);
                  } catch (err) {
                    console.error('Delete error:', err);
                  } finally {
                    setIsDeleting(false);
                    setDeletingDonation(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg flex items-center gap-2"
              >
                {isDeleting ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
