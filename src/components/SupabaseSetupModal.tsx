import React, { useState } from 'react';
import { isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 md:p-8 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Status do Banco de Dados Supabase</h2>
              <p className="text-xs text-slate-400">
                {isSupabaseConfigured
                  ? 'Conectado com sucesso ao seu projeto Supabase!'
                  : 'Modo de Demonstração Ativo (Persistência Local e Tempo Real simulado ativados)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg">
            ✕
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 text-sm">
              <strong className="block mb-1 text-amber-300">💡 Aplicação Pronta para o Supabase!</strong>
              O aplicativo já está funcionando perfeitamente em modo de demonstração e sincroniza em tempo real entre abas do mesmo computador.
              Para conectar ao seu banco de dados Supabase na nuvem, configure as variáveis no arquivo <code className="bg-amber-950 px-1.5 py-0.5 rounded text-amber-300">.env</code>:
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=sua-chave-anonima</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">Script SQL de Inicialização (1-Clique)</h3>
                <button
                  onClick={handleCopySql}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? '✓ Copiado!' : '📋 Copiar SQL do Supabase'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Execute o script abaixo no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas <code className="text-amber-300">doacoes</code>, <code className="text-amber-300">configuracoes</code> e habilitar o <strong>Realtime</strong>:
              </p>
              <textarea
                readOnly
                value={SUPABASE_SQL_SCHEMA}
                rows={10}
                className="w-full bg-slate-950 text-slate-300 p-3 rounded-xl border border-slate-800 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm">
              <strong className="block mb-1 font-bold text-emerald-200">✅ Conexão Ativa e Sincronizada!</strong>
              Sua aplicação está conectada ao Supabase. Todas as doações cadastradas no painel <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200">/admin</code> serão enviadas instantaneamente para a tela do telão <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200">/telão</code>.
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400">Tabelas configuradas:</div>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono">doacoes (Realtime: OK)</span>
                <span className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono">configuracoes (Realtime: OK)</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
