// hooks/useNetworkStatus.ts - VERSION SIMPLE SANS PACKAGE
import { useEffect, useState } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Fonction de test de connexion
    const checkConnection = async () => {
      try {
        // Tenter de fetch une petite ressource
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsOnline(response.ok);
        console.log('🌐 Connexion:', response.ok ? 'OK' : 'KO');
      } catch (error) {
        setIsOnline(false);
        console.log('🌐 Pas de connexion');
      }
    };

    // Vérification initiale
    checkConnection();

    // Vérifier toutes les 10 secondes
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline };
};