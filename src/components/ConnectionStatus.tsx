import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus = () => {
  const isOnline = useNetworkStatus();

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${isOnline ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="text-sm font-medium">{isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}</span>
    </div>
  );
};
