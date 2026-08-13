import React, { useState, useEffect } from 'react';
import { CampaignConfig } from '../types';
import { ChurchRoofStage } from '../components/ChurchRoofStage';
import { DEFAULT_ADMIN_EMAIL, isSupabaseConfigured, SUPABASE_SQL_SCHEMA, clearLocalDemoDonations } from '../lib/supabase';

interface AdminSettingsViewProps {
  config: CampaignConfig;
  onSaveConfig: (updated: Partial<CampaignConfig>) => Promise<void>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<CampaignConfig>({ ...config });

  // Sync formData whenever config changes from parent
  useEffect(() => {
    setFormData({ ...config });
  }, [config]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlCode, setShowSqlCode] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  // New admin email state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminNotice, setAdminNotice] = useState('');

  const adminEmailsList = Array.from(
    new Set([DEFAULT_ADMIN_EMAIL.toLowerCase(), ...(formData.admin_emails || []).map((e) => e.toLowerCase())])
  );

  const handleChange = (field: keyof CampaignConfig, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('imagem_igreja', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleClearDemoDonations = () => {
    clearLocalDemoDonations();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 4000);
  };

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAdminNotice('Por favor, digite um e-mail válido.');
      setTimeout(() => setAdminNotice(''), 4000);
      return;
    }

    if (adminEmailsList.includes(cleanEmail)) {
      setAdminNotice('Este e-mail já está cadastrado como administrador.');
      setTimeout(() => setAdminNotice(''), 4000);
      return;
    }

    const updatedList = [...adminEmailsList, cleanEmail];
    handleChange('admin_emails', updatedList);
    setNewAdminEmail('');
    setAdminNotice(`E-mail "${cleanEmail}" adicionado! Salve as alterações para confirmar.`);
    setTimeout(() => setAdminNotice(''), 4000);
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      setAdminNotice('O e-mail do administrador principal não pode ser removido.');
      setTimeout(() => setAdminNotice(''), 4000);
      return;
    }

    const updatedList = adminEmailsList.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase());
    handleChange('admin_emails', updatedList);
    setAdminNotice(`E-mail "${emailToRemove}" removido! Salve as alterações para confirmar.`);
    setTimeout(() => setAdminNotice(''), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Erro ao salvar configurações.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configurações e Administradores</h1>
          <p className="text-xs text-slate-400">
            Gerencie administradores autorizados, metas de arrecadação e integração com Supabase.
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold animate-pulse">
            ✓ Configurações salvas e enviadas ao Telão!
          </div>
        )}
      </div>

      {/* SECTION 1: ADMIN EMAILS MANAGEMENT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-amber-400 flex items-center gap-2">
              <span>👥</span>
              <span>Gerenciar Administradores Autorizados</span>
            </h2>
            <p className="text-xs text-slate-400">
              Inclua os e-mails das pessoas que terão permissão para acessar este painel.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
            {adminEmailsList.length} Administrador(es)
          </span>
        </div>

        {adminNotice && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-3 rounded-xl text-xs font-bold animate-pulse">
            {adminNotice}
          </div>
        )}

        <form onSubmit={handleAddAdminEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Digite o novo e-mail do administrador..."
            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs shadow-md transition-colors whitespace-nowrap"
          >
            ➕ Adicionar Administrador
          </button>
        </form>

        {/* Admin Emails List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {adminEmailsList.map((emailItem) => {
            const isPrimary = emailItem.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
            return (
              <div
                key={emailItem}
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate font-mono">{emailItem}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">
                    {isPrimary ? '👑 Administrador Principal' : '🛡️ Administrador Auxiliar'}
                  </div>
                </div>

                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAdminEmail(emailItem)}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold p-1 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Remover acesso deste e-mail"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: CAMPAIGN PARAMETERS FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORM FIELDS (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-extrabold text-amber-400 pb-3 border-b border-slate-800 flex items-center gap-2">
            <span>⚙️</span>
            <span>Parâmetros da Campanha</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Nome da Igreja *
              </label>
              <input
                type="text"
                value={formData.nome_igreja}
                onChange={(e) => handleChange('nome_igreja', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.nome_campanha}
                onChange={(e) => handleChange('nome_campanha', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Valor Total da Meta (R$) *
              </label>
              <input
                type="number"
                step="100"
                value={formData.meta_total}
                onChange={(e) => handleChange('meta_total', Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Quantidade Total de Painéis *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.quantidade_paineis}
                onChange={(e) => handleChange('quantidade_paineis', Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Potência de Cada Painel (Wp)
              </label>
              <input
                type="number"
                value={formData.potencia_painel}
                onChange={(e) => handleChange('potencia_painel', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Economia Mensal Estimada (R$/mês)
              </label>
              <input
                type="number"
                value={formData.economia_mensal_total}
                onChange={(e) => handleChange('economia_mensal_total', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Valor Estimado do kWh (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_kwh}
                onChange={(e) => handleChange('valor_kwh', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Estilo da Imagem da Igreja
              </label>
              <select
                value={formData.imagem_igreja.startsWith('http') || formData.imagem_igreja.startsWith('data:') ? 'custom' : 'default-vector'}
                onChange={(e) => {
                  if (e.target.value === 'default-vector') {
                    handleChange('imagem_igreja', 'default-vector');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="default-vector">🎨 Ilustração Vetorial Padrão (Recomendado)</option>
                <option value="custom">📷 Foto Personalizada (URL ou Upload)</option>
              </select>
            </div>
          </div>

          {/* Custom Image Upload or URL */}
          {formData.imagem_igreja !== 'default-vector' && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-300">
                Imagem da Igreja (URL ou Upload)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={formData.imagem_igreja === 'default-vector' ? '' : formData.imagem_igreja}
                  onChange={(e) => handleChange('imagem_igreja', e.target.value || 'default-vector')}
                  placeholder="https://exemplo.com/fotografia-igreja.jpg"
                  className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
                <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors text-center self-stretch flex items-center justify-center">
                  <span>📁 Enviar Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Visual Roof Grid Calibration Controls */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              📐 Calibração da Posição dos Painéis no Telhado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Posição Vertical (Topo):</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_top_percent ?? 28}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={formData.painel_roof_top_percent ?? 28}
                  onChange={(e) => handleChange('painel_roof_top_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Posição Horizontal (Esquerda):</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_left_percent ?? 23}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={formData.painel_roof_left_percent ?? 23}
                  onChange={(e) => handleChange('painel_roof_left_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Largura do Telhado:</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_width_percent ?? 54}%</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={formData.painel_roof_width_percent ?? 54}
                  onChange={(e) => handleChange('painel_roof_width_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Altura do Telhado / Grade:</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_height_percent ?? 22}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={formData.painel_roof_height_percent ?? 22}
                  onChange={(e) => handleChange('painel_roof_height_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Inclinação da Perspectiva:</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_perspective_tilt ?? 8}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={formData.painel_roof_perspective_tilt ?? 8}
                  onChange={(e) => handleChange('painel_roof_perspective_tilt', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-base shadow-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES E ADMINISTRADORES'}
          </button>
        </div>

        {/* RIGHT COLUMN: LIVE CALIBRATION PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pré-visualização em Tempo Real</span>
              <span className="text-slate-500 font-normal text-[10px]">Efeito no Telão</span>
            </div>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <ChurchRoofStage
                config={formData}
                paineisConquistados={15}
                totalPaineis={formData.quantidade_paineis || 40}
                interactiveMode
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
              Simulação com 15 painéis solares para ajustar a simetria visual do telhado.
            </p>
          </div>
        </div>
      </form>

    </div>
  );
};
