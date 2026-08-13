import React from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isAdminAuthenticated: boolean;
  onOpenSupabaseModal: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  isAdminAuthenticated,
  onOpenSupabaseModal,
  onLogout,
}) => {
  const isTelao = currentPath === '/' || currentPath === '/telao';

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
    <nav className="bg-slate-950/95 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 text-xl font-black shadow-lg group-hover:scale-105 transition-transform">
              ☀️
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                PAINÉIS DE LUZ
              </div>
              <div className="text-[10px] text-amber-400 font-medium uppercase tracking-widest">
                Campanha Solar Leilão
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onNavigate('/')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                isTelao
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📺</span>
              <span>Tela do Telão</span>
            </button>

            <button
              onClick={() => onNavigate('/admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                currentPath === '/admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>⚡</span>
              <span>Painel Admin</span>
            </button>

            {isAdminAuthenticated && (
              <>
                <button
                  onClick={() => onNavigate('/admin/doacoes')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    currentPath === '/admin/doacoes'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>📋</span>
                  <span>Doações</span>
                </button>

                <button
                  onClick={() => onNavigate('/admin/configuracoes')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    currentPath === '/admin/configuracoes'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>⚙️</span>
                  <span>Configurações</span>
                </button>
              </>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Logout Button */}
            {isAdminAuthenticated && onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                title="Sair do Painel Administrativo"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            {/* Fullscreen Button */}
            {isTelao && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1"
                title="Ativar Tela Cheia (Ideal para TVs e Projetores)"
              >
                <span>⛶</span>
                <span className="hidden sm:inline">Tela Cheia</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded-lg font-bold ${isTelao ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
          >
            📺 Telão
          </button>
          <button
            onClick={() => onNavigate('/admin')}
            className={`px-3 py-1.5 rounded-lg font-bold ${currentPath === '/admin' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
          >
            ⚡ Painel
          </button>
          {isAdminAuthenticated && (
            <>
              <button
                onClick={() => onNavigate('/admin/doacoes')}
                className={`px-3 py-1.5 rounded-lg font-bold ${currentPath === '/admin/doacoes' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
              >
                📋 Doações
              </button>
              <button
                onClick={() => onNavigate('/admin/configuracoes')}
                className={`px-3 py-1.5 rounded-lg font-bold ${currentPath === '/admin/configuracoes' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
              >
                ⚙️ Config
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
