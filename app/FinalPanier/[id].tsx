import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { UseCartStore } from '@/store/cart.store'
import useLocationStore from '@/store/location.store'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { TextInput } from 'react-native-gesture-handler'
import useAppwrite from '@/lib/useAppwrite'
import { Coords, Restaurant } from '@/types/type'
import { getRestaurantInformations } from '@/lib/appwrite'
import { CalculateDistance, CalculatePriceFromDistance } from '@/lib/map'

const FinalPanier = () => {
  const { id } = useLocalSearchParams();

  // Store states
  const items = UseCartStore(state => state.items);
  const SoustotalPrice = UseCartStore(state => state.getTotalPrice(id as string));
  
  // Local states
  const [address, setAddress] = useState<string | null>(null);
  const [noteLivraison, setNoteLivraison] = useState('');
  const [coord, setCoord] = useState<Coords | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  // Location store
  const { coords, getAll, reverseGeocode, convertAddress } = useLocationStore();
  
  // Restaurant data
  const { data: restaurant, loading: restaurantLoading } = useAppwrite<Restaurant>({
    fn: () => getRestaurantInformations(id as string),
  });

  // Memoize filtered items
  const restaurantsItems = useMemo(
    () => items.filter((i) => i.restaurantId === id as string),
    [items, id]
  );

  // Memoize prices
  const livraisonPrice = useMemo(
    () => CalculatePriceFromDistance({ distance }),
    [distance]
  );
  
  const totalPrice = useMemo(
    () => SoustotalPrice + livraisonPrice,
    [SoustotalPrice, livraisonPrice]
  );

  // Global loading effect - charge tout en parallèle
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      try {
        setIsGlobalLoading(true);

        // Charger l'adresse utilisateur et les coordonnées restaurant en parallèle
        const [userAddr, restaurantCoords] = await Promise.allSettled([
          // 1. Charger l'adresse de l'utilisateur
          (async () => {
            if (!coords) {
              await getAll();
            }
            const currentCoords = useLocationStore.getState().coords;
            if (currentCoords && isMounted) {
              const addr = await reverseGeocode(currentCoords);
              return addr;
            }
            return null;
          })(),
          
          // 2. Charger les coordonnées du restaurant
          (async () => {
            if (!restaurant?.address) return null;
            const c = await convertAddress({ address: restaurant.address });
            if (c && isMounted) {
              const dist = CalculateDistance({ lat: c.latitude, lon: c.longitude });
              return { coord: c, distance: dist ?? 0 };
            }
            return null;
          })(),
        ]);

        // Mettre à jour les states seulement si le composant est monté
        if (isMounted) {
          if (userAddr.status === 'fulfilled' && userAddr.value) {
            setAddress(userAddr.value);
          }

          if (restaurantCoords.status === 'fulfilled' && restaurantCoords.value) {
            setCoord(restaurantCoords.value.coord);
            setDistance(restaurantCoords.value.distance);
          }
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        if (isMounted) {
          setIsGlobalLoading(false);
        }
      }
    };

    // Attendre que le restaurant soit chargé avant de charger le reste
    if (!restaurantLoading && restaurant) {
      loadAllData();
    }

    return () => {
      isMounted = false;
    };
  }, [restaurant, restaurantLoading, coords, getAll, reverseGeocode, convertAddress]);

  // Memoize character counter color
  const counterColor = useMemo(
    () => noteLivraison.length >= 480 ? 'text-red-500' : 'text-neutral-500',
    [noteLivraison.length]
  );

  // Callback pour le retour
  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  // Afficher le loader global pendant le chargement
  if (isGlobalLoading || restaurantLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size="large" color="#48681B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className='flex-1'
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    >
      <SafeAreaView className='flex-1 bg-white' edges={['top','right','left']}>
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className='px-5'>
            <View className='bg-white flex-row gap-x-5 items-center' style={{ marginTop: 15 }}>
              <Pressable onPress={handleGoBack} hitSlop={15}>
                <Image source={images.back} className='size-6' resizeMode='contain' />
              </Pressable>
              <Text className='font-semibold text-[16px]'>Resume</Text>
            </View>
          </View>

          {/* Section Panier */}
          <View className='px-5' style={{ marginTop: 25 }}>
            <View className='flex-row gap-x-3 items-center'>
              <View className='bg-neutral-200 items-center justify-center' style={{ width: 35, height: 35, borderRadius: 70 }}>
                <Image source={images.panier} style={{ width: '50%', height: '50%' }} resizeMode='contain' tintColor='#48681B' />
              </View>
              <Text className='font-poppins-bold text-[22px]'>Mon panier</Text>
            </View>

            <View style={{ paddingTop: 20, paddingBottom: 35 }}>
              {restaurantsItems.map((item, index) => {
                const hasAccompagnement = item.customizations?.some((c) => c.accompagnement);
                const supplements = item.customizations?.filter((c) => !c.accompagnement) || [];
                const supplementsPrice = item.customizations?.reduce(
                  (sum, c) => sum + (c.price * c.quantity),
                  0
                ) || 0;
                const itemTotalPrice = (item.normalPrice + supplementsPrice) * item.quantity;

                return (
                  <View
                    key={item.$id}
                    className='flex-row gap-x-5 items-center border-neutral-200'
                    style={{
                      borderBottomWidth: 1,
                      paddingBottom: 15,
                      marginBottom: 15,
                      borderStyle: index === restaurantsItems.length - 1 ? 'dashed' : 'solid',
                    }}
                  >
                    <View className='px-3'>
                      <Text className='font-semibold text-[16px]'>{item.quantity} x</Text>
                    </View>

                    <View className='flex-1 flex-row'>
                      <View style={{ width: '70%', rowGap: 3 }}>
                        <Text className='font-medium text-[15px] text-black'>{item.menuName}</Text>

                        {hasAccompagnement && (
                          <View style={{ marginTop: 5 }}>
                            <Text className='font-semibold text-neutral-600 text-[13px]'>Accompagnement</Text>
                            {item.customizations
                              ?.filter((c) => c.accompagnement)
                              .map((c, idx) => (
                                <Text key={idx} className='text-neutral-600 text-[12px] ml-2' style={{ marginTop: 2 }}>
                                  • {c.accompagnement}
                                </Text>
                              ))}
                          </View>
                        )}

                        {supplements.length > 0 && (
                          <View style={{ marginTop: 5 }}>
                            <Text className='font-semibold text-neutral-600 text-[13px]'>Supplément</Text>
                            {supplements.map((supp, idx) => (
                              <Text key={idx} className='text-neutral-600 text-[12px] ml-2' style={{ marginTop: 2 }}>
                                • {supp.quantity}x {supp.name} - {supp.price * supp.quantity} F
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>

                      <View className='items-center gap-y-2' style={{ width: '30%' }}>
                        <Text className='font-semibold text-[15px]'>{itemTotalPrice} F</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Sous Total */}
              <View className='flex-row flex-1 justify-between px-2'>
                <Text className='font-medium text-[15px]'>Sous Total</Text>
                <Text className='font-semibold text-[15px]'>{SoustotalPrice} F</Text>
              </View>
            </View>
          </View>

          {/* Section Livraison */}
          <View className='bg-neutral-100 py-2'>
            <View className='bg-white px-5' style={{ paddingVertical: 30 }}>
              <View className='flex-row gap-x-3 items-center py-5'>
                <View className='bg-neutral-200 items-center justify-center' style={{ width: 35, height: 35, borderRadius: 70 }}>
                  <Image source={images.locate} style={{ width: '50%', height: '50%' }} resizeMode='contain' tintColor='#48681B' />
                </View>
                <Text className='font-poppins-bold text-[22px]'>Livraison a</Text>
              </View>

              <View>
                <Text className='font-medium text-[14px] px-2 text-center'>{address || 'Adresse non disponible'}</Text>
              </View>

              <View className='px-2 py-5'>
                <TextInput
                  placeholder='Ajouter une note de livraison'
                  className='px-3 py-2 rounded-lg border-neutral-300 border-2 font-regular'
                  style={{
                    height: 100,
                    textAlignVertical: 'top',
                    lineHeight: 20,
                  }}
                  multiline
                  maxLength={500}
                  value={noteLivraison}
                  onChangeText={setNoteLivraison}
                />

                <View className='flex-row justify-end mt-2'>
                  <Text className={`text-[13px] font-regular ${counterColor}`}>
                    {noteLivraison.length}/500
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section Total Commande */}
          <View className='bg-white px-5' style={{ paddingBottom: 25 }}>
            <View className='flex-row gap-x-3 items-center py-5'>
              <View className='bg-neutral-200 items-center justify-center' style={{ width: 35, height: 35, borderRadius: 70 }}>
                <Image source={images.panier} style={{ width: '50%', height: '50%' }} resizeMode='contain' tintColor='#48681B' />
              </View>
              <Text className='font-poppins-bold text-[22px]'>Total de la commande</Text>
            </View>

            <View className='border-neutral-200 flex-row gap-x-4 py-4 items-center' style={{ borderBottomWidth: 1 }}>
              <Image source={images.total} className='size-5' resizeMode='contain' tintColor='#525252' />
              <View className='flex-1 flex-row justify-between'>
                <Text className='font-regular text-neutral-600 text-[14px]'>Sous total</Text>
                <Text className='font-semibold text-neutral-900 text-[14px]'>{SoustotalPrice} F</Text>
              </View>
            </View>

            <View className='border-neutral-200 flex-row gap-x-4 py-4 items-center' style={{ borderBottomWidth: 1, borderStyle: 'dashed' }}>
              <Image source={images.livraison} className='size-5' resizeMode='contain' tintColor='#525252' />
              <View className='flex-1 flex-row justify-between'>
                <Text className='font-regular text-neutral-600 text-[14px]'>Frais de livraison</Text>
                <Text className='font-semibold text-neutral-900 text-[14px]'>{livraisonPrice} F</Text>
              </View>
            </View>

            <View className='flex-1 justify-between flex-row pt-5'>
              <Text className='font-medium text-[14px]'>Total</Text>
              <Text className='font-semibold text-neutral-900 text-[14px]'>{totalPrice} F</Text>
            </View>
          </View>

          {/* Section Paiement */}
          <View className='bg-neutral-100 py-5 px-5 gap-y-3'>
            <View className='flex-row gap-x-3 items-center py-5'>
              <View className='bg-neutral-200 items-center justify-center' style={{ width: 35, height: 35, borderRadius: 70 }}>
                <Image source={images.billet} style={{ width: '50%', height: '50%' }} resizeMode='contain' tintColor='#48681B' />
              </View>
              <Text className='font-poppins-bold text-[22px]'>Mode de paiement</Text>
            </View>

            <Pressable className='border-2 py-3 px-2 rounded-lg flex-row border-neutral-300 gap-x-3 items-center bg-neutral-100'>
              <Image source={images.billet} className='size-5' resizeMode='contain' tintColor='#48681B' />
              <View className='flex-1 justify-between items-center flex-row '>
                <Text className='font-medium text-[15px]'>Especes</Text>
                <Image source={images.droite} className='size-4' resizeMode='contain' tintColor='#525252' />
              </View>
            </Pressable>

            <Pressable className='rounded-full bg-primary-300 items-center py-4'>
              <Text className='font-semibold text-[14px] text-white'>Commander · {totalPrice} F</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default FinalPanier;