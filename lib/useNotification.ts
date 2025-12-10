import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getUnreadNotificationCount } from '@/lib/appwrite';
import { useUserStore } from '@/store/user.store';

export const useNotificationCount = () => {
  const user = useUserStore(state => state.user);
  const [counts, setCounts] = useState({ private: 0, global: 0 });
  const [loading, setLoading] = useState(true);

  const loadCounts = async () => {
    if (!user?.$id) {
      setCounts({ private: 0, global: 0 });
      setLoading(false);
      return;
    }

    try {
      const data = await getUnreadNotificationCount(user.$id);
      setCounts(data);
    } catch (error) {
      console.error('❌ Erreur chargement compteur notifications:', error);
      setCounts({ private: 0, global: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, [user?.$id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadCounts();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.$id]);

  // Total
  const total = counts.private + counts.global;

  return {
    counts,
    total,
    loading,
    refresh: loadCounts, 
  };
};
