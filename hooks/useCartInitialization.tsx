import { useEffect } from 'react';
import { UseCartStore } from '@/store/cart.store';
import { useUserStore } from '@/store/user.store';

export const useCartInitialization = () => {
  const user = useUserStore(state => state.user);
  const setCurrentUser = UseCartStore(state => state.setCurrentUser);

  useEffect(() => {
    if (user?.$id) {
      setCurrentUser(user.$id);
    } else {
      setCurrentUser(null);
    }
  }, [user?.$id, setCurrentUser]);
};

