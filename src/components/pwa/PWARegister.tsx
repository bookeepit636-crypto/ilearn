'use client';

import { useEffect } from 'react';

export const PWARegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // PWA registered successfully
        })
        .catch((err) => {
          console.warn('PWA registration warning:', err);
        });
    }
  }, []);

  return null;
};
