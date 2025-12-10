import { create } from 'zustand';
import { Query, ID } from 'react-native-appwrite';
import { appwriteConfig, databases } from '@/lib/appwrite';

type FavorisStore = {
  favorisIds: Set<string>;
  loading: boolean;
  
  // Actions
  loadFavoris: (userId: string) => Promise<void>;
  addFavori: (userId: string, restaurantId: string) => Promise<void>;
  removeFavori: (userId: string, restaurantId: string) => Promise<void>;
  isFavori: (restaurantId: string) => boolean;
  clearFavoris: () => void;
};

export const useFavorisStore = create<FavorisStore>((set, get) => ({
  favorisIds: new Set<string>(),
  loading: false,

  // ✅ Charger tous les favoris d'un utilisateur
  loadFavoris: async (userId: string) => {
    try {
      set({ loading: true });
      
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.favorisCollectionId,
        [Query.equal('userId', userId)]
      );

      const ids = new Set(result.documents.map(doc => doc.restaurantId));
      set({ favorisIds: ids, loading: false });
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      set({ loading: false });
    }
  },

  addFavori: async (userId: string, restaurantId: string) => {
    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.favorisCollectionId,
        ID.unique(),
        { userId, restaurantId }
      );

      set(state => ({
        favorisIds: new Set(state.favorisIds).add(restaurantId)
      }));
    } catch (error) {
      console.error('Erreur ajout favori:', error);
      throw error;
    }
  },

  removeFavori: async (userId: string, restaurantId: string) => {
    try {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.favorisCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('restaurantId', restaurantId)
        ]
      );

      if (result.documents.length > 0) {
        await databases.deleteDocument(
          appwriteConfig.databaseId,
          appwriteConfig.favorisCollectionId,
          result.documents[0].$id
        );

        set(state => {
          const newSet = new Set(state.favorisIds);
          newSet.delete(restaurantId);
          return { favorisIds: newSet };
        });
      }
    } catch (error) {
      console.error('Erreur suppression favori:', error);
      throw error;
    }
  },

  isFavori: (restaurantId: string) => {
    return get().favorisIds.has(restaurantId);
  },

  clearFavoris: () => {
    set({ favorisIds: new Set() });
  },
}));