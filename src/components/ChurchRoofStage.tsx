import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CampaignConfig } from '../types';

interface ChurchRoofStageProps {
  config: CampaignConfig;
  paineisConquistados: number;
  totalPaineis: number;
  newlyUnlockedIndices?: number[];
  interactiveMode?: boolean; // For calibration preview in admin
}

export const ChurchRoofStage: React.FC<ChurchRoofStageProps> = ({
  config,
  paineisConquistados,
  totalPaineis,
  newlyUnlockedIndices = [],
}) => {
  const isCustomImage = config.imagem_igreja && config.imagem_igreja !== 'default-vector' && config.imagem_igreja.startsWith('http');

  // Roof positioning parameters from config (with defaults)
  const cols = config.painel_grid_cols || 10;
  const rows = Math.ceil(totalPaineis / cols);
  const topPercent = config.painel_roof_top_percent ?? 28;
  const leftPercent = config.painel_roof_left_percent ?? 23;
  const widthPercent = config.painel_roof_width_percent ?? 54;
  const heightPercent = config.painel_roof_height_percent ?? 28;
  const tiltDeg = config.painel_roof_perspective_tilt ?? 8;

  // Generate solar panel items array
  const panels = Array.from({ length: totalPaineis }, (_, i) => ({
    index: i,
    isUnlocked: i < paineisConquistados,
    isNew: newlyUnlockedIndices.includes(i),
  }));

  return (
    <div className="relative w-full h-full min-h-0 bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20 flex flex-col justify-between select-none">
      {/* Background Atmosphere - Sunburst & Sky Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl" />
        {/* Subtle Light Rays */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(251, 191, 36, 0.25) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Header Tagline inside canvas */}
      <div className="relative z-10 p-2.5 sm:p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-amber-300 text-xs font-medium shadow-lg">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{config.nome_igreja}</span>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 text-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <span>☀️ Sistema Solar</span>
          <span className="font-bold text-amber-300">{paineisConquistados}/{totalPaineis} Painéis</span>
        </div>
      </div>

      {/* Main Illustration / Image Stage Container */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2">
        <div className="relative w-full max-w-2xl aspect-[16/10] flex items-end justify-center">
          
          {isCustomImage ? (
            /* Custom Real Church Photograph */
            <img
              src={config.imagem_igreja}
              alt={config.nome_igreja}
              className="w-full h-full object-contain rounded-xl drop-shadow-2xl"
            />
          ) : (
            /* Detailed Vector Church Illustration */
            <div className="relative w-full h-full flex flex-col items-center justify-end">
              <svg
                viewBox="0 0 1000 650"
                className="w-full h-full drop-shadow-2xl overflow-visible"
                preserveAspectRatio="xMidYMax meet"
              >
                <defs>
                  {/* Sky gradient */}
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Church Wall Texture */}
                  <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="50%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>

                  {/* Roof Tile Base */}
                  <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="50%" stopColor="#78350f" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>

                  {/* Stained Glass Glow */}
                  <radialGradient id="stainedGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
                  </radialGradient>
                </defs>

                {/* Stars/Lights in Background */}
                <g opacity="0.3">
                  <circle cx="150" cy="80" r="1.5" fill="#ffffff" />
                  <circle cx="850" cy="110" r="2" fill="#fef08a" />
                  <circle cx="220" cy="140" r="1" fill="#ffffff" />
                  <circle cx="780" cy="70" r="1.5" fill="#ffffff" />
                </g>

                {/* Ground Grass / Base */}
                <ellipse cx="500" cy="620" rx="480" ry="30" fill="#064e3b" opacity="0.9" />
                <path d="M 50 620 Q 500 580 950 620 L 950 650 L 50 650 Z" fill="#022c22" />

                {/* Main Church Body */}
                {/* Side Wings */}
                <rect x="220" y="380" width="160" height="220" fill="url(#wallGrad)" rx="4" />
                <polygon points="210,380 300,310 390,380" fill="url(#roofGrad)" />

                <rect x="620" y="380" width="160" height="220" fill="url(#wallGrad)" rx="4" />
                <polygon points="610,380 700,310 790,380" fill="url(#roofGrad)" />

                {/* Central Nave */}
                <rect x="340" y="280" width="320" height="320" fill="url(#wallGrad)" rx="6" />

                {/* MAIN CENTRAL ROOF STRUCTURE (Roof layer for solar panels) */}
                <polygon
                  points="320,280 500,160 680,280"
                  fill="url(#roofGrad)"
                  stroke="#3b0764"
                  strokeWidth="2"
                />

                {/* Roof Ridge Trim */}
                <line x1="310" y1="282" x2="500" y2="158" stroke="#f59e0b" strokeWidth="4" />
                <line x1="500" y1="158" x2="690" y2="282" stroke="#f59e0b" strokeWidth="4" />

                {/* Bell Tower / Steeple in Center Back */}
                <rect x="440" y="80" width="120" height="180" fill="url(#wallGrad)" />
                {/* Tower Roof Spire */}
                <polygon points="430,80 500,-20 570,80" fill="#78350f" />
                {/* Cross on Steeple Top */}
                <g transform="translate(500, -45)">
                  {/* Glowing cross aura */}
                  <circle cx="0" cy="0" r="22" fill="#fbbf24" opacity="0.3" />
                  <rect x="-3" y="-20" width="6" height="40" fill="#fef08a" rx="2" />
                  <rect x="-15" y="-10" width="30" height="6" fill="#fef08a" rx="2" />
                </g>

                {/* Bell Tower Arch & Window */}
                <path d="M 475 120 A 25 25 0 0 1 525 120 L 525 160 L 475 160 Z" fill="#1e1b4b" />
                {/* Golden Bell inside */}
                <path d="M 490 145 C 490 135 510 135 510 145 L 515 152 L 485 152 Z" fill="#f59e0b" />

                {/* Main Church Door */}
                <path d="M 440 600 A 60 60 0 0 1 560 600 L 560 600 L 440 600 Z" fill="#451a03" />
                <path d="M 445 600 A 55 55 0 0 1 555 600 L 555 600 L 445 600 Z" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
                <line x1="500" y1="485" x2="500" y2="600" stroke="#451a03" strokeWidth="3" />
                <circle cx="488" cy="545" r="4" fill="#fbbf24" />
                <circle cx="512" cy="545" r="4" fill="#fbbf24" />

                {/* Beautiful Stained Glass Rosette Window */}
                <g transform="translate(500, 230)">
                  <circle cx="0" cy="0" r="38" fill="url(#stainedGlow)" stroke="#78350f" strokeWidth="4" />
                  <circle cx="0" cy="0" r="30" fill="none" stroke="#f59e0b" strokeWidth="2" />
                  {/* Petal Pattern */}
                  <path d="M 0 -30 C 12 -15 12 15 0 30 C -12 15 -12 -15 0 -30 Z" fill="#3b82f6" opacity="0.7" />
                  <path d="M -30 0 C -15 12 15 12 30 0 C 15 -12 -15 -12 -30 0 Z" fill="#ef4444" opacity="0.7" />
                  <circle cx="0" cy="0" r="10" fill="#fef08a" />
                </g>

                {/* Arch Windows Side */}
                <path d="M 260 440 A 20 20 0 0 1 300 440 L 300 520 L 260 520 Z" fill="#1e1b4b" stroke="#cbd5e1" strokeWidth="3" />
                <path d="M 260 440 A 20 20 0 0 1 300 440 L 300 520 L 260 520 Z" fill="#f59e0b" opacity="0.4" />

                <path d="M 700 440 A 20 20 0 0 1 740 440 L 740 520 L 700 520 Z" fill="#1e1b4b" stroke="#cbd5e1" strokeWidth="3" />
                <path d="M 700 440 A 20 20 0 0 1 740 440 L 740 520 L 700 520 Z" fill="#f59e0b" opacity="0.4" />
              </svg>
            </div>
          )}

          {/* DYNAMIC SOLAR PANELS OVERLAY ON ROOF */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-300"
            style={{
              top: `${topPercent}%`,
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              transform: `perspective(600px) rotateX(${tiltDeg}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            {/* Solar Panel Grid */}
            <div
              className="w-full h-full grid gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-slate-950/60 backdrop-blur-[2px] rounded-lg border border-amber-500/30 shadow-2xl overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
              <AnimatePresence>
                {panels.map((panel) => (
                  <motion.div
                    key={`solar-panel-${panel.index}`}
                    initial={panel.isNew ? { scale: 0, opacity: 0, rotateY: 180 } : false}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotateY: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                      delay: panel.isNew ? (panel.index % 10) * 0.08 : 0,
                    }}
                    className={`relative w-full h-full min-h-0 rounded-[2px] overflow-hidden transition-all duration-300 ${
                      panel.isUnlocked
                        ? 'bg-gradient-to-br from-blue-700 via-sky-800 to-indigo-950 border border-cyan-300/80 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                        : 'border border-dashed border-amber-400/30 bg-slate-900/40 hover:border-amber-400/50'
                    }`}
                  >
                    {panel.isUnlocked ? (
                      /* Active Photovoltaic Cell Design */
                      <div className="relative w-full h-full flex flex-col justify-between p-[1px]">
                        {/* Silicon grid lines */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] opacity-40 pointer-events-none">
                          <div className="border-r border-b border-cyan-200/50" />
                          <div className="border-b border-cyan-200/50" />
                          <div className="border-r border-cyan-200/50" />
                          <div className="" />
                        </div>

                        {/* Sunlight Glint / Reflection Effect */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 via-transparent to-transparent opacity-80" />

                        {/* New Unlocked Shimmer Badge */}
                        {panel.isNew && (
                          <motion.div
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-amber-400/40 pointer-events-none"
                          />
                        )}

                        {/* Metallic Frame Accent */}
                        <div className="w-full h-[1px] bg-cyan-300/60" />

                        {/* Panel Number Indicator */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[7px] sm:text-[9px] md:text-[10px] text-cyan-100 font-mono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none">
                            #{panel.index + 1}
                          </span>
                        </div>

                        <div className="w-full h-[1px] bg-sky-200/40" />
                      </div>
                    ) : (
                      /* Placeholder Dashed Outline */
                      <div className="w-full h-full flex items-center justify-center opacity-80">
                        <span className="text-[7px] sm:text-[9px] md:text-[10px] text-amber-200 font-mono font-bold leading-none">
                          #{panel.index + 1}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Banner Bar */}
      <div className="relative z-10 bg-slate-950/80 backdrop-blur-md px-6 py-3 border-t border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs text-amber-200/80 uppercase tracking-wider font-medium">Capacidade do Sistema</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{((paineisConquistados / totalPaineis) * 100).toFixed(1).replace('.', ',')}% Instalado</span>
              <span className="text-amber-400 font-normal text-xs">({paineisConquistados} de {totalPaineis} placas)</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden p-[1px] border border-amber-500/20">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (paineisConquistados / totalPaineis) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
