import { images } from '@/constants'
import { createOrder, getRestaurantInformations } from '@/lib/appwrite'
import { CalculateDistance, CalculatePriceFromDistance } from '@/lib/map'
import { notifyClientOrderPlaced, notifyMerchantNewOrder } from '@/lib/orderNotification'
import useAppwrite from '@/lib/useAppwrite'
import { UseCartStore } from '@/store/cart.store'
import useLocationStore from '@/store/location.store'
import useNotificationStore from '@/store/notification.store'
import { useUserStore } from '@/store/user.store'
import { Coords, Restaurant, CreateOrderData, CreateOrderItemData } from '@/types/type'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Href, router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

const time_cancel = 25;

const FinalPanier = () => {
  const { id } = useLocalSearchParams();

  const [secondsLeft, setSecondsLeft] = useState(time_cancel);
  const [isOrdering, setIsOrdering] = useState(false);

  // Store states
  const items = UseCartStore(state => state.items);
  const clearRestaurantItems = UseCartStore(state => state.clearCart);
  const SoustotalPrice = UseCartStore(state => state.getTotalPrice(id as string));
  
  // Local states
  const [address, setAddress] = useState<string | null>(null);
  const [noteLivraison, setNoteLivraison] = useState('');
  const [coord, setCoord] = useState<Coords | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const user = useUserStore(state => state.user);

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
  const totalItems = useMemo(()=>{
    return restaurantsItems.length
  },[restaurantsItems])

  const finalModal = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (secondsLeft === 0) {
      finalModal.current?.dismiss();
    } else {
      const timerId = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [secondsLeft]);

  const startTimer = useCallback(() => {
    setSecondsLeft(time_cancel);
  }, []);

  // Global loading effect
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      try {
        setIsGlobalLoading(true);

        const [userAddr, restaurantCoords] = await Promise.allSettled([
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

    if (!restaurantLoading && restaurant) {
      loadAllData();
    }

    return () => {
      isMounted = false;
    };
  }, [restaurant, restaurantLoading, coords, getAll, reverseGeocode, convertAddress]);

  const counterColor = useMemo(
    () => noteLivraison.length >= 480 ? 'text-red-500' : 'text-neutral-500',
    [noteLivraison.length]
  );

  const final = () => {
    finalModal.current?.present();
    startTimer();
  };

  const format = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

 const handleCreateOrder = async () => {
  if (!address) {
    Alert.alert('Erreur', 'Adresse de livraison non disponible');
    return;
  }

  if (restaurantsItems.length === 0) {
    Alert.alert('Erreur', 'Votre panier est vide');
    return;
  }

  if (!restaurant) {
    Alert.alert('Erreur', 'Informations du restaurant non disponibles');
    return;
  }

  if (!user?.$id) {
    Alert.alert('Erreur', 'Utilisateur non connecté');
    return;
  }

  try {
    setIsOrdering(true);

    // 1. Préparer les données de la commande
    const orderData: CreateOrderData = {
      userId: user.$id,
      restaurantId: id as string,
      totalPrice: totalPrice,
      subtotalPrice: SoustotalPrice,
      deliveryAddress: address,
      status: 'pending',
      paymentStatus: 'unpaid',
      totalItems: totalItems,
      merchantId: restaurant.merchantId,
    };

    // 2. Préparer les items de commande
    const orderItemsData: CreateOrderItemData[] = restaurantsItems.map(item => ({
      menuId: item.$id,
      menuName: item.menuName,
      quantity: item.quantity,
      price: item.reductionPrice,
      restaurantId: item.restaurantId,
      customizations: JSON.stringify(item.customizations || []),
      deliveryInstructions: item.instructions?.trim(),
      livraisonInstructions: item.livraisonInstruction?.trim(),
    }));

    console.log('🚀 Création de la commande...');
    const result = await createOrder(orderData, orderItemsData);
    console.log('✅ Commande créée:', result.order.$id);

    // 3. Notifier le MARCHAND (Push + BD)
    try {
      await notifyMerchantNewOrder(
        restaurant.merchantId,
        result.order.$id,
        restaurant.restaurantName,
        totalItems,
        totalPrice
      );
      console.log('✅ Marchand notifié');
    } catch (notifError) {
      console.error('⚠️ Erreur notification marchand (non bloquant):', notifError);
    }
    try {
      await notifyClientOrderPlaced(
        user.$id,
        result.order.$id,
        restaurant.restaurantName,
        totalPrice
      );
      console.log('✅ Client notifié');
    } catch (notifError) {
      console.error('⚠️ Erreur notification client (non bloquant):', notifError);
    }

    
    clearRestaurantItems(id as string);
    finalModal.current?.dismiss();

    router.push(`orderProcess/${result.order.$id}` as Href);

  } catch (error) {
    console.error('❌ Erreur création commande:', error);

    Alert.alert(
      'Erreur',
      error instanceof Error
        ? error.message
        : 'Impossible de créer la commande. Veuillez réessayer.',
      [
        {
          text: 'Réessayer',
          onPress: handleCreateOrder,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  } finally {
    setIsOrdering(false);
  }
};

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
      <SafeAreaView className='flex-1 bg-white' edges={['top', 'right', 'left']}>
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

            <Pressable className='rounded-full bg-primary-300 items-center py-4' onPress={final}>
              <Text className='font-semibold text-[14px] text-white'>Commander · {totalPrice} F</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomSheetModal
        ref={finalModal}
        snapPoints={['90%']}
        handleIndicatorStyle={{ display: 'none' }}
        enablePanDownToClose={false}
        backdropComponent={renderBackdrop}
        style={{ flex: 1 }}
      >
        <BottomSheetView className='flex-1 bg-white'>
          <View className='px-4 py-2'>
            <Text className='font-poppins-bold text-primary-300' style={{ fontSize: 32 }}>
              {secondsLeft > 0 && format(secondsLeft)}
            </Text>
            <Text className='font-poppins-bold text-[20px]'>Confirmation de la commande !</Text>
            <Text className='font-regular text-[14px] text-neutral-600'>Verifier si votre commande est correcte...</Text>
          </View>

          <View className='bg-neutral-100 px-4 flex-1 gap-y-5 '>
            <View className='pt-3 px-2 rounded-lg bg-white border-neutral-200' style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 3,
              borderWidth: 1,
            }}>
              <View className='flex-row gap-x-3 px-2 items-center'>
                <Image source={{ uri: restaurant?.restaurantLogo }} style={{ width: 40, height: 40, borderRadius: 50 }} resizeMode='contain' />
                <Text className='font-poppins-bold text-[15px]'>{restaurant?.restaurantName}</Text>
              </View>

              <FlatList
                data={restaurantsItems}
                keyExtractor={(item, index) => `${item.$id}-${index}`}
                renderItem={({ item }) => {
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
                      className='flex-row gap-x-5 items-center'
                      style={{
                        paddingBottom: 5,
                        marginBottom: 15,
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
                }}
              />
            </View>

            <View className='p-3 rounded-lg gap-y-3 bg-white border-neutral-200' style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 3,
              borderWidth: 1,
            }}>
              <View className='flex-row gap-x-3 px-2 items-center'>
                <View className='bg-neutral-200 items-center justify-center' style={{ width: 40, height: 40, borderRadius: 50 }}>
                  <Image source={images.facture} style={{ width: '60%', height: '60%' }} resizeMode='contain' tintColor={'#48681B'} />
                </View>
                <Text className='font-poppins-bold text-[15px]'>Facture</Text>
              </View>

              <View className='border-neutral-200 flex-row gap-x-4 py-3 items-center' style={{ borderBottomWidth: 1 }}>
                <Image source={images.total} className='size-5' resizeMode='contain' tintColor='#525252' />
                <View className='flex-1 flex-row justify-between'>
                  <Text className='font-regular text-neutral-600 text-[13px]'>Sous total</Text>
                  <Text className='font-semibold text-neutral-900 text-[13px]'>{SoustotalPrice} F</Text>
                </View>
              </View>

              <View className='border-neutral-200 flex-row gap-x-4 py-3 items-center' style={{ borderBottomWidth: 1, borderStyle: 'dashed' }}>
                <Image source={images.livraison} className='size-5' resizeMode='contain' tintColor='#525252' />
                <View className='flex-1 flex-row justify-between'>
                  <Text className='font-regular text-neutral-600 text-[13px]'>Frais de livraison</Text>
                  <Text className='font-semibold text-neutral-900 text-[13px]'>{livraisonPrice} F</Text>
                </View>
              </View>

              <View className='flex-1 justify-between flex-row'>
                <Text className='font-medium text-[14px]'>Total</Text>
                <Text className='font-semibold text-neutral-900 text-[13px]'>{totalPrice} F</Text>
              </View>
            </View>

            <Pressable 
              className='flex-1 rounded-full items-center mt-2' 
              style={{
                backgroundColor: isOrdering ? '#93A87C' : '#48681B',
                paddingVertical: isOrdering?  12: 16
              }}
              onPress={handleCreateOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className='font-semibold text-white'>Valider la commande</Text>
              )}
            </Pressable>

            <Pressable 
              className='flex-1 rounded-full bg-white border-primary-300 py-3 items-center border-2' 
              onPress={() => router.push(`/PanierRestaurant/${id}`)}
              disabled={isOrdering}
            >
              <Text className='font-semibold text-primary-300'>Modifier la commande</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
};

export default FinalPanier;