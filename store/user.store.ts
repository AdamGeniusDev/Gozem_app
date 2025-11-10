// store/userStore.ts
import { create } from 'zustand';
import { UserDoc } from '@/types/type';
import { getUser, getImage, updateUserInfo, updateUserImage } from '@/lib/appwrite';

type GetTokenFn = (opt?: { skipCache?: boolean }) => Promise<string | null>;

interface UserState {
  user: UserDoc | null;
  avatar: { uri: string } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadUser: (getToken: GetTokenFn, clerkUserId: string) => Promise<void>;
  updateUser: (getToken: GetTokenFn, clerkUserId: string, data: Partial<UserDoc>) => Promise<void>;
  updateAvatar: (getToken: GetTokenFn, clerkUserId: string, imageUri: string) => Promise<void>;
  clearUser: () => void;
  resetStore: () => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // État initial
  user: null,
  avatar: null,
  isLoading: false,
  error: null,

  // Charger les données utilisateur
  loadUser: async (getToken, clerkUserId) => {
    try {
      set({ isLoading: true, error: null });

      const [userDoc, avatarData] = await Promise.all([
        getUser(getToken, clerkUserId),
        getImage(getToken, clerkUserId),
      ]);

      set({
        user: userDoc,
        avatar: avatarData,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors du chargement',
        isLoading: false,
      });
      console.error('Erreur loadUser:', error);
    }
  },

  // Mettre à jour les infos utilisateur
  updateUser: async (getToken, clerkUserId, data) => {
    try {
      set({ isLoading: true, error: null });

      const updatedUser = await updateUserInfo(getToken, clerkUserId, data);

      set({
        user: updatedUser,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la mise à jour',
        isLoading: false,
      });
      throw error;
    }
  },

  // Mettre à jour l'avatar
  updateAvatar: async (getToken, clerkUserId, imageUri) => {
    try {
      set({ isLoading: true, error: null });

      const updatedUser = await updateUserImage(getToken, clerkUserId, imageUri);

      // Recharger l'avatar depuis Appwrite
      const newAvatar = await getImage(getToken, clerkUserId);

      set({
        user: updatedUser,
        avatar: newAvatar,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Erreur lors de la mise à jour de l\'avatar',
        isLoading: false,
      });
      throw error;
    }
  },

  // Réinitialiser l'état
  clearUser: () => {
    set({
      user: null,
      avatar: null,
      isLoading: false,
      error: null,
    });
  },

   resetStore: () => {
    set({
      user: null,
      avatar: null,
      isLoading: false,
      error: null,
    });
  },

  // Définir une erreur
  setError: (error) => {
    set({ error });
  },
}));

// Hook personnalisé pour faciliter l'utilisation
export const useUser = () => {
  const { user, avatar, isLoading, error } = useUserStore();
  return { user, avatar, isLoading, error };
};

// Hook pour les actions uniquement
export const useUserActions = () => {
  const { loadUser, updateUser, updateAvatar, clearUser, setError } = useUserStore();
  return { loadUser, updateUser, updateAvatar, clearUser, setError };
};