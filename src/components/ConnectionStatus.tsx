import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus = () => {
  const isOnline = useNetworkStatus();

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-md text-xs font-bold transition-all backdrop-blur-md border ${
        isOnline 
          ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
          : 'bg-slate-800/95 text-slate-200 border-slate-700/80'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
          <span>متصل بالإنترنت</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>وضع أوفلاين محلي (متاح بالكامل)</span>
        </>
      )}
    </div>
  );
};
