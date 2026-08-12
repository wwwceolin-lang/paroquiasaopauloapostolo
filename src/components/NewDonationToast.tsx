import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NewDonationEvent } from '../types';
import { formatCurrency } from '../lib/formatters';
import { playDonationChime } from '../lib/audio';

interface NewDonationToastProps {
  event: NewDonationEvent | null;
  onDismiss: () => void;
  audioEnabled?: boolean;
}

export const NewDonationToast: React.FC<NewDonationToastProps> = ({
  event,
  onDismiss,
  audioEnabled = true,
}) => {
  useEffect(() => {
    if (!event) return;

    if (audioEnabled) {
      playDonationChime();
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, 8000); // Display spotlight for 8 seconds

    return () => clearTimeout(timer);
  }, [event, onDismiss, audioEnabled]);

  if (!event) return null;

  const { donation, paineisGained } = event;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative max-w-2xl w-full bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-slate-950 rounded-3xl p-8 md:p-12 shadow-[0_0_80px_rgba(245,158,11,0.6)] border-4 border-amber-300 text-center overflow-hidden"
        >
          {/* Animated Rays Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-200/40 via-transparent to-transparent animate-pulse pointer-events-none" />

          {/* Top Sun Icon & Badge */}
          <div className="relative z-10 inline-flex items-center justify-center p-4 bg-slate-950 text-amber-400 rounded-2xl mb-6 shadow-xl border border-amber-300/40">
            <span className="text-3xl md:text-4xl">☀️</span>
            <span className="text-xs md:text-sm font-black uppercase tracking-widest ml-3">
              NOVA DOAÇÃO!
            </span>
          </div>

          {/* Donor Name */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-10 text-3xl md:text-5xl font-extrabold text-slate-950 mb-2 drop-shadow-sm tracking-tight"
          >
            {donation.doador}
          </motion.h2>

          {/* Optional Description */}
          {donation.descricao && (
            <p className="relative z-10 text-base md:text-xl font-medium text-slate-900/90 mb-6 italic">
              "{donation.descricao}"
            </p>
          )}

          {/* Donation Value Highlight */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.25 }}
            className="relative z-10 my-4 inline-block bg-slate-950 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-amber-300"
          >
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-1">
              Valor Contribuído
            </div>
            <div className="text-4xl md:text-6xl font-black tracking-tight text-amber-300">
              + {formatCurrency(donation.valor)}
            </div>
          </motion.div>

          {/* Solar Panels Impact Badge */}
          {paineisGained > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative z-10 mt-6 inline-flex items-center gap-2 bg-emerald-950 text-emerald-300 font-bold px-6 py-3 rounded-full text-lg md:text-xl shadow-lg border border-emerald-400/50"
            >
              <span>🎉</span>
              <span>+ {paineisGained} {paineisGained === 1 ? 'PAINEL SOLAR CONQUISTADO!' : 'PAINÉIS SOLARES CONQUISTADOS!'}</span>
            </motion.div>
          ) : (
            <div className="relative z-10 mt-4 text-slate-900 font-bold text-base">
              Avançando em direção ao próximo painel solar!
            </div>
          )}

          {/* Close button manually if needed */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 z-20 text-slate-950/70 hover:text-slate-950 p-2 rounded-full hover:bg-black/10 transition-colors"
            title="Fechar aviso"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
