// stores/useLocationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

type Perms = Location.PermissionStatus | 'unknown';
type Coords = { latitude: number; longitude: number };
type Region = Coords & { latitudeDelta: number; longitudeDelta: number };

type LocationProps = {
  region: Region | null;
  coords: Coords | null;
  status: Perms;
  isLoading: boolean;
  error: string | null;

  askPermission: () => Promise<Perms>;
  getAll: () => Promise<void>;
};

const useLocationStore = create<LocationProps>()(
//on fait ici un persist sur le statut pour que l'appareil puisse garder en memoire s'il a deja donner l'autorisation
  persist(
    (set, get) => ({
      region: null,
      coords: null,
      status: 'unknown',     
      isLoading: false,
      error: null,

      // une fonction pour demander a l'utilisateur la permission pour la localisation
      askPermission: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        set({ status });
        return status;
      },

      //fonction pour recuperer les coordonnes de l'utilisateur.On regarde le status de la permission avant de continuer la procedure 
      getAll: async () => {
        try {
          const { status } = get();
          if (status !== 'granted') {
            await get().askPermission();
            if (get().status !== 'granted') return;
          }

          set({ isLoading: true, error: null });

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // fais un compromis entre les performances et la batterie
          });

          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          //une map a besoin d'une latitude, longitude,latitudeDelta,longitudeDelta . La longitudeDelta et la latitudeDelta sont ceux qui permettent de definir le zoom initial de l'ecran
          const region: Region = {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          set({ coords, region, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false, error: e?.message ?? 'Location error' });
        }
      },

    }),
    {
      name: 'location-store',
      storage: createJSONStorage(() => AsyncStorage), 
      partialize: (s) => ({ status: s.status }),      
    }
  )
);

export default useLocationStore;
