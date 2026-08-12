import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CampaignConfig, Donation, NewDonationEvent } from '../types';
import { calculateCampaignStats } from '../lib/calcStats';
import { formatCurrency, formatDateBR, formatPercent } from '../lib/formatters';
import { ChurchRoofStage } from '../components/ChurchRoofStage';
import { NewDonationToast } from '../components/NewDonationToast';
import { GoalCelebrationModal } from '../components/GoalCelebrationModal';
import { isSupabaseConfigured } from '../lib/supabase';

interface TelaoViewProps {
  config: CampaignConfig;
  donations: Donation[];
  lastEvent: NewDonationEvent | null;
  onClearEvent: () => void;
  onNavigate?: (path: string) => void;
  isAdminAuthenticated?: boolean;
  onOpenSupabaseModal?: () => void;
}

export const TelaoView: React.FC<TelaoViewProps> = ({
  config,
  donations,
  lastEvent,
  onClearEvent,
  onNavigate,
  isAdminAuthenticated = false,
  onOpenSupabaseModal,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Calculate overall stats dynamically
  const stats = calculateCampaignStats(config, donations);

  // Get last donation
  const lastDonation = donations.length > 0 ? donations[0] : null;

  // Trigger celebration modal when 100% is reached
  useEffect(() => {
    if (stats.progresso_percentual >= 100 && !celebrationDismissed) {
      setShowCelebrationModal(true);
    }
  }, [stats.progresso_percentual, celebrationDismissed]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full bg-slate-950 text-white p-2.5 sm:p-4 flex flex-col justify-between overflow-y-auto lg:overflow-hidden select-none selection:bg-amber-500 selection:text-slate-950 box-border pb-12 sm:pb-16 lg:pb-3">
      
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Header Banner - Compact Single-Row Presentation Header */}
      <header className="relative z-10 w-full mb-2 flex-shrink-0 flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md px-3 sm:px-5 py-2 rounded-xl border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-lg shadow-md text-xl font-black flex-shrink-0">
            ⛪
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white truncate">
              {config.nome_igreja}
            </h1>
            <p className="text-amber-400 font-bold text-xs truncate">
              {config.nome_campanha} • Sistema de Energia Solar
            </p>
          </div>
        </div>

        {/* Live Badge & Options Menu Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 px-3 py-1 rounded-full text-xs font-bold shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>AO VIVO NO LEILÃO</span>
          </div>

          {/* Discreet Floating Icon Button for Navigation & Settings Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95"
            title="Abrir opções e navegação"
          >
            <span>⚙️</span>
            <span className="font-bold">Opções</span>
          </button>
        </div>
      </header>

      {/* Main Content Grid - Strictly Constrained to 100vh height */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0">
        
        {/* LEFT COLUMN: Visual Church Roof & Solar Panel Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0">
          <ChurchRoofStage
            config={config}
            paineisConquistados={stats.paineis_conquistados}
            totalPaineis={stats.paineis_totais}
            newlyUnlockedIndices={lastEvent ? Array.from({ length: lastEvent.paineisGained }, (_, i) => lastEvent.previousPaineis + i) : []}
          />
        </div>

        {/* RIGHT COLUMN: Key Financials & Progress Panels (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 h-full min-h-0 justify-between">
          
          {/* CARD 1: MAIN FINANCIAL NUMBERS (HERO JÁ ARRECADADO) */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 flex-shrink-0">
            
            {/* JA ARRECADADO - HERO HIGHLIGHT */}
            <div className="bg-slate-950/90 p-3 sm:p-4 rounded-xl border border-amber-500/40 text-center relative overflow-hidden">
              <div className="text-[11px] uppercase font-extrabold text-amber-400 tracking-widest mb-0.5 flex items-center justify-center gap-1.5">
                <span>✨</span>
                <span>JÁ ARRECADADO</span>
                <span>✨</span>
              </div>
              <motion.div
                key={stats.ja_arrecadado}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              >
                {formatCurrency(stats.ja_arrecadado)}
              </motion.div>
            </div>

            {/* INVESTIMENTO TOTAL & FALTA ARRECADAR */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Investimento Total</div>
                <div className="text-base sm:text-lg font-bold text-slate-200 mt-0.5">
                  {formatCurrency(stats.investimento_total)}
                </div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Falta Arrecadar</div>
                <div className="text-base sm:text-lg font-bold text-rose-400 mt-0.5">
                  {formatCurrency(stats.falta_arrecadar)}
                </div>
              </div>
            </div>

          </div>

          {/* CARD 2: PROGRESS BAR & PAINÉIS CONQUISTADOS */}
          <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-3 shadow-lg space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="uppercase text-slate-300 tracking-wider">Progresso da Campanha</span>
              <span className="text-xl font-black text-amber-400">{formatPercent(stats.progresso_percentual)}</span>
            </div>
            
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-amber-500/30 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progresso_percentual}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>☀️ Painéis:</span>
                <span className="text-amber-300">{stats.paineis_conquistados} / {stats.paineis_totais}</span>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-black border border-amber-500/30">
                {stats.porcentagem_capacidade.toFixed(0)}% da capacidade
              </span>
            </div>
          </div>

          {/* CARD 3: ESTIMATED SAVINGS */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 shadow-lg space-y-1.5 flex-shrink-0">
            <div className="text-emerald-400 font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-1.5">
              <span>☀️</span>
              <span>ENERGIA QUE JÁ CONQUISTAMOS</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-emerald-500/20">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Economia mensal</div>
                <div className="text-sm sm:text-base font-extrabold text-emerald-300 mt-0.5">
                  {formatCurrency(stats.economia_mensal_conquistada)} <span className="text-[10px] font-normal text-slate-400">/mês</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-emerald-500/20">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Economia anual</div>
                <div className="text-sm sm:text-base font-extrabold text-emerald-300 mt-0.5">
                  {formatCurrency(stats.economia_anual_conquistada)} <span className="text-[10px] font-normal text-slate-400">/ano</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: LAST DONATION ROW */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex-shrink-0">
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1 flex items-center justify-between">
              <span>ÚLTIMA CONTRIBUIÇÃO</span>
              <span className="text-slate-500 font-mono text-[9px]">TEMPO REAL</span>
            </div>

            {lastDonation ? (
              <motion.div
                key={lastDonation.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-extrabold text-white text-xs sm:text-sm truncate">{lastDonation.doador}</div>
                  {lastDonation.descricao && (
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {lastDonation.descricao}
                    </div>
                  )}
                  <div className="text-[9px] text-slate-500">
                    {formatDateBR(lastDonation.created_at)}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-black text-amber-300">
                    + {formatCurrency(lastDonation.valor)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-2 text-slate-500 text-xs italic">
                Aguardando a primeira doação...
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer Instructions */}
      <footer className="relative z-10 w-full text-center text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider flex-shrink-0 pt-6 pb-4 lg:pt-4 lg:pb-2">
        Plataforma Leilão Solar • Telão Oficial em Tempo Real • {config.nome_igreja}
      </footer>

      {/* Floating Options Menu Overlay Modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h2 className="font-extrabold text-lg text-white">Menu & Navegação</h2>
                    <p className="text-xs text-amber-400 font-medium">Controles do Telão e Sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Options */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Navegar Para</div>
                
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onNavigate) onNavigate('/');
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">📺 Tela do Telão (Apresentação)</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">Ativo</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onNavigate) onNavigate('/admin');
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">⚡ Painel Administrativo</span>
                    <span className="text-slate-400">➜</span>
                  </button>

                  {isAdminAuthenticated && (
                    <>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onNavigate) onNavigate('/admin/doacoes');
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">📋 Gerenciar Doações</span>
                        <span className="text-slate-400">➜</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onNavigate) onNavigate('/admin/configuracoes');
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">⚙️ Configurações da Campanha</span>
                        <span className="text-slate-400">➜</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Presentation Tools */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Ferramentas de Apresentação</div>

                <div>
                  <button
                    onClick={toggleFullscreen}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>⛶</span>
                    <span>Modo Tela Cheia (Apresentação)</span>
                  </button>
                </div>

                {onOpenSupabaseModal && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSupabaseModal();
                    }}
                    className={`w-full mt-1 px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                      isSupabaseConfigured
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demo Local'}</span>
                    </span>
                    <span className="text-[10px] underline">Configurar</span>
                  </button>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Fechar Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realtime New Donation Toast Modal */}
      <NewDonationToast
        event={lastEvent}
        onDismiss={onClearEvent}
        audioEnabled={soundEnabled}
      />

      {/* Goal Celebration Modal */}
      <GoalCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => {
          setShowCelebrationModal(false);
          setCelebrationDismissed(true);
        }}
        churchName={config.nome_igreja}
        totalRaised={formatCurrency(stats.ja_arrecadado)}
      />

    </div>
  );
};
