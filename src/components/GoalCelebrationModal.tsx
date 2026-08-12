import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playGoalCelebrationFanfare } from '../lib/audio';

interface GoalCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchName: string;
  totalRaised: string;
}

export const GoalCelebrationModal: React.FC<GoalCelebrationModalProps> = ({
  isOpen,
  onClose,
  churchName,
  totalRaised,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Trigger audio fanfare
    playGoalCelebrationFanfare();

    // Trigger festive confetti cannon bursts
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#fbbf24', '#38bdf8', '#34d399'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#f59e0b', '#ec4899', '#ffffff'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ['#fbbf24', '#ffffff'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative max-w-3xl w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-8 md:p-14 text-center text-white shadow-[0_0_100px_rgba(245,158,11,0.5)] overflow-hidden"
        >
          {/* Background Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />

          {/* Golden Trophy / Sun Burst Icon */}
          <div className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-full flex items-center justify-center text-5xl shadow-2xl border-4 border-amber-200 animate-bounce">
            🎉
          </div>

          <div className="relative z-10 uppercase tracking-widest text-amber-400 font-extrabold text-sm md:text-base mb-2">
            OBJETIVO ALCANÇADO COM SUCESSO!
          </div>

          <h1 className="relative z-10 text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            CONSEGUIMOS!
          </h1>

          <div className="relative z-10 inline-block bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 text-slate-950 font-black px-8 py-3 rounded-full text-2xl md:text-3xl mb-6 shadow-xl">
            100% DA META ALCANÇADA
          </div>

          <p className="relative z-10 text-xl md:text-2xl text-slate-200 font-medium max-w-xl mx-auto mb-8">
            Total arrecadado: <strong className="text-amber-300 font-extrabold">{totalRaised}</strong>
          </p>

          <p className="relative z-10 text-lg md:text-xl text-amber-200/90 italic mb-8 max-w-lg mx-auto">
            "Obrigado a todos que fizeram parte dessa conquista! A {churchName} agora produzirá sua própria energia limpa e abençoada!"
          </p>

          <button
            onClick={onClose}
            className="relative z-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-10 py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-2xl"
          >
            CONTINUAR COMEMORANDO
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
