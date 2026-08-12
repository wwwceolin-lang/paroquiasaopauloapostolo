import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(!showIosGuide);
    }
  };

  if (isInstalled || dismissed) {
    return null;
  }

  // If there's a native prompt available OR on iOS
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-yellow-500/90 text-slate-950 px-4 py-2.5 border-b border-amber-300/30 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <img
          src="/favicon.png"
          alt="App Icon"
          className="w-7 h-7 rounded-lg shadow-sm border border-slate-950/20"
          referrerPolicy="no-referrer"
        />
        <div>
          <span className="font-extrabold text-slate-950">
            Instalar Aplicativo Campanha Solar
          </span>
          <span className="hidden md:inline text-slate-900 font-medium ml-2">
            — Acesse direto da sua tela inicial offline e em tela cheia!
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold px-3.5 py-1.5 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1.5"
        >
          <span>📲</span>
          <span>{isIos ? 'Como Instalar no iPhone' : 'Instalar PWA'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-900/70 hover:text-slate-950 p-1 font-black text-sm"
          title="Fechar"
        >
          ✕
        </button>
      </div>

      {showIosGuide && (
        <div className="w-full bg-slate-950 text-white p-3 rounded-xl border border-amber-500/40 text-xs space-y-1.5 mt-2 font-normal">
          <div className="font-bold text-amber-400 flex items-center gap-1">
            <span>🍎</span> Instruções de Instalação no iOS (iPhone/iPad):
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-200">
            <li>Abra este site no navegador <strong>Safari</strong>.</li>
            <li>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima ⎋).</li>
            <li>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
