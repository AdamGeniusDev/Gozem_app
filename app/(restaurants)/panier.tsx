import { View, Text, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useMemo } from 'react';
import { getRestaurantInformations } from '@/lib/appwrite';
import { UseCartStore } from '@/store/cart.store';
import { Restaurant } from '@/types/type';
import useLocationStore from '@/store/location.store';
import { images } from '@/constants';
import { router } from 'expo-router';

const Panier = () => {
  // Store
  const items = UseCartStore((state) => state.items);
  const getTotalItems = UseCartStore((state) => state.getTotalItems);
  const getTotalPrice = UseCartStore((state) => state.getTotalPrice);

  // Calcule les IDs avec useMemo
  const restaurantIds = useMemo(() => {
    return Array.from(new Set(items.map(item => item.restaurantId)));
  }, [items]);

  // States
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getAll, reverseGeocode, coords, askPermission, status } = useLocationStore();

  // Effet global qui charge tout en parallèle
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      try {
        setIsGlobalLoading(true);
        setError(null);

        // Si pas d'items dans le panier, arrêter tout de suite
        if (restaurantIds.length === 0) {
          if (isMounted) {
            setRestaurants([]);
            setIsGlobalLoading(false);
          }
          return;
        }

        // Charger tout en parallèle
        const [locationResult, restaurantsResult] = await Promise.allSettled([
          // 1. Charger la localisation et l'adresse
          (async () => {
            try {
              // Demander la permission si nécessaire
              if (status !== 'granted') {
                const permissionResult = await askPermission();
                if (permissionResult !== 'granted') {
                  return null;
                }
              }

              // Récupérer les coordonnées
              await getAll();

              // Reverse geocoding si coords disponibles
              if (coords) {
                const userAddress = await reverseGeocode(coords);
                return userAddress;
              }
              
              return null;
            } catch (err) {
              console.error('Erreur localisation:', err);
              return null;
            }
          })(),

          // 2. Charger les informations des restaurants
          (async () => {
            const results = await Promise.all(
              restaurantIds.map(async (id) => {
                try {
                  const info = await getRestaurantInformations(id);
                  return info || null;
                } catch (error) {
                  console.error(`Erreur pour restaurant ${id}:`, error);
                  return null;
                }
              })
            );
            return results.filter(Boolean) as Restaurant[];
          })()
        ]);

        // Mettre à jour les states si le composant est toujours monté
        if (isMounted) {
          // Adresse
          if (locationResult.status === 'fulfilled' && locationResult.value) {
            setAddress(locationResult.value);
          } else {
            setAddress('Localisation actuelle');
          }

          // Restaurants
          if (restaurantsResult.status === 'fulfilled' && restaurantsResult.value) {
            setRestaurants(restaurantsResult.value);
          }
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        if (isMounted) {
          setError('Une erreur est survenue lors du chargement');
        }
      } finally {
        if (isMounted) {
          setIsGlobalLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [restaurantIds.join(','), status]);

  // Loading global
  if (isGlobalLoading) {
    return (
      <SafeAreaView className="bg-white flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#48681B" />
          <Text className="text-neutral-500 mt-4 text-[14px]">
            Chargement de vos paniers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Erreur
  if (error) {
    return (
      <SafeAreaView className="bg-white flex-1">
        <View className="py-5 px-5">
          <Text className="font-poppins-bold text-[16px]">Paniers</Text>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-red-500 text-center text-[15px] font-semibold">
            {error}
          </Text>
          <Pressable 
            className="mt-4 bg-primary-300 px-6 py-3 rounded-full"
            onPress={() => {
              setIsGlobalLoading(true);
              setError(null);
            }}
          >
            <Text className="text-white font-semibold">Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Panier vide
  if (restaurants.length === 0) {
    return (
      <SafeAreaView className="bg-white flex-1" edges={['top','left','right']}>
        <View className="py-5 px-5">
          <Text className="font-poppins-bold text-[16px]">Paniers</Text>
        </View>
        <View className="flex-1 items-center justify-center px-5 bg-neutral-100">
          <View 
            className="bg-neutral-200 items-center justify-center mb-4" 
            style={{ width: 100, height: 100, borderRadius: 100 }}
          >
            <Image 
              source={images.panier} 
              style={{ width: '50%', height: '50%' }} 
              resizeMode="contain" 
              tintColor="#737373"
            />
          </View>
          <Text className="text-neutral-800 text-center text-[18px] font-poppins-bold mb-2">
            Vous n'avez aucun panier
          </Text>
          <Text className="text-neutral-600 text-center text-[14px]">
            Une fois que vous avez ajoute des plats d'un restaurant ou les articles d'un magasin, votre panier s'affichera ici.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-white flex-1" edges={['top', 'right', 'left']}>
      <View className="py-5 px-5">
        <Text className="font-poppins-bold text-[16px]">Paniers</Text>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ 
          paddingHorizontal: 15, 
          paddingBottom: 30,
          backgroundColor: '#f5f5f5',
          flexGrow: 1
        }}
        renderItem={({ item }) => {
          const totalItem = getTotalItems(item.$id);
          const totalPrice = getTotalPrice(item.$id);

          return (
            <Pressable 
              className="flex-row items-center mt-5 bg-white rounded-xl mb-3 px-4 py-4 shadow-sm" 
              style={{ elevation: 2 }}
              onPress={() => router.push(`/PanierRestaurant/${item.$id}`)}
            >
              {/* Logo du restaurant */}
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5',
                  borderWidth: 1,
                  borderColor: '#e5e5e5'
                }}
              >
                <Image
                  source={{ uri: item.restaurantLogo }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>

              {/* Infos du restaurant */}
              <View className="flex-1 ml-3 justify-center">
                <Text 
                  className="font-poppins-bold text-[16px] text-neutral-800" 
                  numberOfLines={1}
                >
                  {item.restaurantName}
                </Text>
                
                <View className="flex-row items-center mt-1">
                  <Text className="font-poppins-bold text-[16px] text-neutral-500">
                    {totalPrice} F
                  </Text>
                  <Text className="font-regular text-neutral-500 text-[14px]">
                    {' '}· {totalItem} article{totalItem > 1 ? 's' : ''}
                  </Text>
                </View>

                <Text 
                  className="font-regular text-[13px] text-neutral-500 mt-1" 
                  numberOfLines={1}
                >
                  Livraison à {address || 'Localisation actuelle'}
                </Text>
              </View>

              {/* Icône flèche */}
              <View className="ml-2 items-center justify-center">
                <Image 
                  source={images.droite} 
                  style={{ width: 16, height: 16 }} 
                  resizeMode="contain" 
                  tintColor="#737373"
                />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default Panier;