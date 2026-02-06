'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';
import { useTranslation } from '@/lib/i18n';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, waitingWorker, updateServiceWorker } = useServiceWorker();
  const { t } = useTranslation();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }
    if (isOnline && wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showBackOnline && !waitingWorker) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-white shadow-2xl shadow-amber-600/30 backdrop-blur-sm animate-slide-up">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">{t('offline.youAreOffline')}</span>
          <span className="text-xs opacity-80">— {t('offline.changesWillSync')}</span>
        </div>
      )}

      {showBackOnline && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-white shadow-2xl shadow-emerald-600/30 backdrop-blur-sm animate-slide-up">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">{t('offline.backOnline')}</span>
        </div>
      )}

      {waitingWorker && (
        <button
          onClick={updateServiceWorker}
          className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">Update available — click to refresh</span>
        </button>
      )}
    </div>
  );
}
