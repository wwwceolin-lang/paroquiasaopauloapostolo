import React, { useState } from 'react';
import { Donation } from '../types';
import { formatCurrency, formatDateBR } from '../lib/formatters';
import { exportDonationsToCSV } from '../lib/exportCsv';

interface AdminDonationsViewProps {
  donations: Donation[];
  onAddDonation: (donation: Omit<Donation, 'id' | 'created_at'>) => Promise<void>;
  onUpdateDonation: (id: string, updates: Partial<Omit<Donation, 'id'>>) => Promise<void>;
  onDeleteDonation: (id: string) => Promise<void>;
}

export const AdminDonationsView: React.FC<AdminDonationsViewProps> = ({
  donations,
  onAddDonation,
  onUpdateDonation,
  onDeleteDonation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'aberto'>('todos');
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deletingDonation, setDeletingDonation] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [valor, setValor] = useState('');
  const [doador, setDoador] = useState('');
  const [nomeReal, setNomeReal] = useState('');
  const [telefone, setTelefone] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<'pago' | 'aberto'>('aberto');

  // Filtered donations
  const filteredDonations = donations.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.doador.toLowerCase().includes(term) ||
      (d.nome_real && d.nome_real.toLowerCase().includes(term)) ||
      (d.telefone && d.telefone.toLowerCase().includes(term)) ||
      (d.descricao && d.descricao.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (statusFilter === 'pago') return d.status !== 'aberto';
    if (statusFilter === 'aberto') return d.status === 'aberto';
    return true;
  });

  const totalSum = filteredDonations.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  const openEditModal = (donation: Donation) => {
    setEditingDonation(donation);
    setValor(String(donation.valor));
    setDoador(donation.doador);
    setNomeReal(donation.nome_real || '');
    setTelefone(donation.telefone || '');
    setDescricao(donation.descricao || '');
    setStatus(donation.status || 'aberto');
  };

  const openNewModal = () => {
    setIsAddingNew(true);
    setValor('');
    setDoador('');
    setNomeReal('');
    setTelefone('');
    setDescricao('');
    setStatus('aberto');
  };

  const closeModal = () => {
    setEditingDonation(null);
    setIsAddingNew(false);
    setValor('');
    setDoador('');
    setNomeReal('');
    setTelefone('');
    setDescricao('');
    setStatus('aberto');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = Number(valor);
    if (!numVal || numVal <= 0 || !doador.trim()) {
      alert('Por favor, preencha o valor e o nome de exibição do doador corretamente.');
      return;
    }

    if (editingDonation) {
      await onUpdateDonation(editingDonation.id, {
        valor: numVal,
        doador: doador.trim(),
        nome_real: nomeReal.trim(),
        telefone: telefone.trim(),
        descricao: descricao.trim(),
        status: status,
      });
    } else if (isAddingNew) {
      await onAddDonation({
        valor: numVal,
        doador: doador.trim(),
        nome_real: nomeReal.trim(),
        telefone: telefone.trim(),
        descricao: descricao.trim(),
        status: status,
      });
    }

    closeModal();
  };

  const handleToggleStatus = async (donation: Donation) => {
    const newStatus = donation.status === 'aberto' ? 'pago' : 'aberto';
    await onUpdateDonation(donation.id, { status: newStatus });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Histórico e Gerenciamento de Doações</h1>
          <p className="text-xs text-slate-400">
            Cadastre, edite, altere o status (Pago/Aberto) ou exporte os registros do leilão em CSV/Excel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportDonationsToCSV(filteredDonations)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-3 rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            onClick={openNewModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span>➕ Nova Doação</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por doador ou descrição..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          </div>

          {/* Status Filter Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'pago' | 'aberto')}
            className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Filter por Status (Todos)</option>
            <option value="pago">🟢 Apenas Pagos</option>
            <option value="aberto">🟠 Apenas Em Aberto</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="text-slate-400">
            Registros exibidos: <span className="text-white font-mono">{filteredDonations.length}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full">
            Soma dos registros: <span className="font-black text-white">{formatCurrency(totalSum)}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Doador / Empresa</th>
                <th className="p-4">Descrição / Lote</th>
                <th className="p-4">Status</th>
                <th className="p-4">Valor (R$)</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    Nenhuma doação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => {
                  const isPaid = d.status !== 'aberto';
                  return (
                    <tr key={d.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-4 text-slate-400 font-mono">{formatDateBR(d.created_at)}</td>
                      <td className="p-4 font-bold text-white text-sm">
                        <div>{d.doador}</div>
                        {(d.nome_real || d.telefone) && (
                          <div className="text-[11px] font-normal text-amber-300/90 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>🔒</span>
                            {d.nome_real && <span>Real: <strong>{d.nome_real}</strong></span>}
                            {d.telefone && <span>• 📱 {d.telefone}</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">{d.descricao || '-'}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(d)}
                          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                            isPaid
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                          }`}
                          title="Clique para alternar o status (Pago/Aberto)"
                        >
                          {isPaid ? '🟢 Pago' : '🟠 Em Aberto'}
                        </button>
                      </td>
                      <td className="p-4 font-black text-amber-300 text-sm">{formatCurrency(d.valor)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(d)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDonation(d)}
                          className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-500/40 transition-colors"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit or Add Modal */}
      {(editingDonation || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">
                {editingDonation ? 'Editar Doação' : 'Cadastrar Nova Doação'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Valor da Doação (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-amber-300 text-xl font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Status do Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('pago')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      status === 'pago'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🟢 Pago</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('aberto')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      status === 'aberto'
                        ? 'bg-amber-500 border-amber-300 text-slate-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🟠 Em Aberto</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Nome para Exibição no Telão (Público) *
                </label>
                <input
                  type="text"
                  value={doador}
                  onChange={(e) => setDoador(e.target.value)}
                  placeholder="Ex: Anônimo, Família Silva, Mercado São José..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Private Fields Box */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    🔒 Dados de Identificação Interna (Privado)
                  </span>
                  <span className="text-[10px] text-slate-400">Não vai para o Telão</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Nome Real do Doador
                    </label>
                    <input
                      type="text"
                      value={nomeReal}
                      onChange={(e) => setNomeReal(e.target.value)}
                      placeholder="Ex: João da Silva Sauro"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Telefone de Contato
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Descrição / Observação
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2 rounded-xl text-xs shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
