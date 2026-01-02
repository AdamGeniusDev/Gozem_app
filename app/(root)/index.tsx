import { ActivityIndicator, AppState, AppStateStatus, Image, Pressable, Text, View } from "react-native";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { images, onboarding, services } from "@/constants";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import ServiceModal from "@/components/ServiceModal";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import useLocationStore from "@/store/location.store";
import { useUserStore } from "@/store/user.store";
import { useFavorisStore } from "@/store/favoris.store";
import { useTranslation } from "react-i18next";
import { Redirect, router, useFocusEffect } from "expo-router";
import useNotificationStore from "@/store/notification.store";
import { getRestaurants, soldOperation, updateExpoPushToken } from "@/lib/appwrite";
import { Coords, Restaurant } from "@/types/type";
import useAppwrite from "@/lib/useAppwrite";
import RestaurantCard from "@/components/RestaurantCard";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import CustomButton from "@/components/CustomButton";
import { useNotificationCount } from "@/lib/useNotification";
import RestaurantCardSkeleton from "@/components/RestaurantCardSkeleton";
import { FlatList } from "react-native-gesture-handler";

type SectionData = {
  type: 'header' | 'wallet' | 'services' | 'sponsored';
  data?: any;
}

export default function Index() {
  const { t } = useTranslation();
  const { isLoaded, getToken, userId, isSignedIn } = useAuth();
  const avatar = useUserStore(state => state.avatar);
  const loadUser = useUserStore(state => state.loadUser);
  const user = useUserStore(state => state.user);
  const { getAll, convertAddress } = useLocationStore();
  
  const { initialize, requestPermission, setupListeners, cleanupListeners } = useNotificationStore();
  
  const { total: numberNotification, refresh: refreshNotificationCount } = useNotificationCount();
  
  const { loadFavoris, removeFavori } = useFavorisStore();
  const [solde,setSolde] = useState(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  
  const [modalAddedVisible, setModalAddedVisible] = useState(false);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [addedItem, setAddedItem] = useState<Restaurant | null>(null);
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<Restaurant | null>(null);
  
  const [sponsoredWithCoords, setSponsoredWithCoords] = useState<(Restaurant & { coords?: Coords | null })[]>([]);
  const [isLoadingCoords, setIsLoadingCoords] = useState(true);

  const isLoadingRef = useRef(false);
  const loadedIdsRef = useRef<string>('');

  useEffect(() => {
    if (!isLoaded || !userId) return;
    loadUser(getToken, userId);
  }, [userId, isLoaded, loadUser, getToken]);

   useEffect(() => {
          const fetchSolde = async () => {
              if (!userId) {
                  setLoading(false)
                  return
              }
  
              try {
                  setLoading(true)
                  setError('')
                  const result = await soldOperation(userId, 'get')
                  
                  if (result !== undefined) {
                      setSolde(result)
                  }
              } catch (err) {
                  console.error('Erreur récupération solde:', err)
                  setError('Impossible de récupérer le solde')
              } finally {
                  setLoading(false)
              }
          }
  
          fetchSolde()
      }, [userId])

  useEffect(() => {
    const updateToken = async () => {
      const { token } = useNotificationStore.getState();
      if (user?.$id && token) {
        try {
          await updateExpoPushToken(user.$id, token);
          console.log('✅ Token Expo Push mis à jour');
        } catch (error) {
          console.error('❌ Erreur mise à jour token:', error);
        }
      }
    };
    
    updateToken();
  }, [user?.$id]);

  useEffect(() => {
    getAll();
  }, [getAll]);

  useEffect(() => {
    let isActive = true;
    
    const initNotifications = async () => {
      if (!isActive) return;
      
      try {
        await requestPermission();
        await initialize();
      } catch (error) {
        console.error('❌ Erreur initialisation notifications:', error);
      }
    };

    initNotifications();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isActive) {
        setupListeners();
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
      cleanupListeners();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        refreshNotificationCount();
      }
    }, [user?.$id, refreshNotificationCount])
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        loadFavoris(user.$id);
      }
    }, [user?.$id, loadFavoris])
  );

  const { data: sponsored } = useAppwrite<Restaurant[]>({
    fn: () => getRestaurants({ sponsored: 'yes' }),
  });

  // Mémorisez les données sponsored pour éviter les re-renders
  const sponsoredData = useMemo(() => {
    return sponsored || [];
  }, [sponsored]);

  const sponsoredIds = useMemo(() => {
    if (!sponsoredData || sponsoredData.length === 0) return '';
    return sponsoredData.map(r => r.$id).join(',');
  }, [sponsoredData]);

  useEffect(() => {
    if (!sponsoredData || sponsoredData.length === 0) {
      setIsLoadingCoords(false);
      setSponsoredWithCoords([]);
      loadedIdsRef.current = '';
      return;
    }

    if (loadedIdsRef.current === sponsoredIds) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    const preloadCoordinates = async () => {
      isLoadingRef.current = true;
      setIsLoadingCoords(true);
      
      try {
        const restaurantsWithCoords = await Promise.all(
          sponsoredData.map(async (restaurant) => {
            try {
              const coords = await convertAddress({ address: restaurant.address });
              return { ...restaurant, coords } as Restaurant & { coords: Coords };
            } catch (error) {
              console.log(`❌ Erreur conversion adresse pour ${restaurant.restaurantName}:`, error);
              return { ...restaurant, coords: null } as Restaurant & { coords: null };
            }
          })
        );

        console.log('✅ Restaurants avec coords chargés:', restaurantsWithCoords.length);
        setSponsoredWithCoords(restaurantsWithCoords);
        loadedIdsRef.current = sponsoredIds;
      } catch (error) {
        console.error('❌ Erreur préchargement coordonnées:', error);
        setSponsoredWithCoords(sponsoredData.map(r => ({ ...r, coords: null })));
      } finally {
        setIsLoadingCoords(false);
        isLoadingRef.current = false;
      }
    };

    preloadCoordinates();
  }, [sponsoredIds, sponsoredData, convertAddress]);

  const handleChangeFavori = useCallback(async (action: 'added' | 'removeRequest', item?: Restaurant) => {
    if (action === 'added' && item) {
      setModalAddedVisible(true);
      setAddedItem(item);
      setTimeout(() => {
        setModalAddedVisible(false);
        setAddedItem(null);
      }, 2000);
    } else if (action === 'removeRequest' && item) {
      modalPendingRemoveItem.current?.present();
      setPendingRemoveItem(item);
    }
  }, []);

  const confirmRemovedFavori = useCallback(async () => {
    if (!pendingRemoveItem || !user) return;

    try {
      await removeFavori(user.$id, pendingRemoveItem.$id);

      modalPendingRemoveItem.current?.dismiss();
      setModalDeleteVisible(true);
      setTimeout(() => {
        setModalDeleteVisible(false);
        setPendingRemoveItem(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Erreur suppression favori:', error);
    }
  }, [pendingRemoveItem, user, removeFavori]);

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

  // Renderer pour la section header
  const renderHeader = useCallback(() => (
    <View className='px-5 w-full mb-5'>
      <View className='w-full' style={{ height: 180, marginTop: 80, marginBottom: 20 }}>
        <Image source={onboarding.image} className='h-full w-full rounded-lg' resizeMode='cover' />
      </View>
    </View>
  ), []);

  // Renderer pour la section wallet
const renderWallet = useCallback(() => (
  <View className='px-5 w-full mb-5'>
    <View className='w-full rounded-lg' style={{ height: 80, overflow: 'hidden' }}>
      <Image source={images.porgozem} className='w-full h-full' resizeMode="cover" resizeMethod="resize" />
      <View className="w-full absolute px-5 py-3 flex-row justify-between items-center">
        <View>
          <View className='flex-row gap-2 items-center'>
            <Image 
              source={images.portefeuille} 
              className='w-[15px] h-[15px]' 
              resizeMode='contain' 
              tintColor={'#FFFFFF'}
            />
            <Text className='text-white font-regular text-[12px]'>{t('home.walletTitle')}</Text>
          </View>
          
          {/* Gestion du chargement du solde */}
          {loading ? (
            <View className='flex-row items-center gap-x-2'>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className='font-regular text-white text-[14px]'>Chargement...</Text>
            </View>
          ) : error ? (
            <Text className='font-regular text-white text-[12px]'>Erreur</Text>
          ) : (
            <Text className='font-poppins-bold text-[22px] text-white'>
              {solde.toLocaleString('fr-FR')}<Text className='ml-3 text-[18px]'>F</Text>
            </Text>
          )}
        </View>
        
        <Pressable 
          className='w-[45px] h-[45px] rounded-full bg-white items-center justify-center' 
          onPress={() => router.push('/(services)/depot')}
          disabled={loading} // Désactiver pendant le chargement
        >
          <Image source={images.plus} style={{ width: '60%', height: '60%' }} />
        </Pressable>
      </View>
    </View>
  </View>
), [t, solde, loading, error]);

  const renderServices = useCallback((servicesData: typeof services) => (
    <View className='px-5 w-full mb-5'>
      <View className='flex-row flex-wrap justify-between' style={{ rowGap: 16 }}>
        {servicesData.map((service) => (
          <View key={service.id} style={{ width: '22%' }}>
            <ServiceModal data={service} />
          </View>
        ))}
      </View>
    </View>
  ), []);

  // Renderer pour la section sponsored
  const renderSponsored = useCallback((restaurants: (Restaurant & { coords?: Coords | null })[]) => {
    return (
      <View
        className='pl-3 py-5 mt-5'
        style={{
          backgroundColor: '#dc2626',
          minHeight: 400
        }}
      >
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          className='font-poppins-bold text-white text-[20px]'
        >
          Profitez d'incroyables plats💥
        </Text>
        <Text className='font-regular text-white text-[15px] mb-5'>
          {t('home.freeDeliverySubtitle')}
        </Text>

        {isLoadingCoords ? (
          <FlatList
            data={[1, 2]}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ columnGap: 15, paddingBottom: 20, paddingRight: 10 }}
            keyExtractor={(_, index) => `skeleton-${index}`}
            renderItem={() => (
              <View style={{ width: 300 }}>
                <RestaurantCardSkeleton />
              </View>
            )}
          />
        ) : restaurants && restaurants.length > 0 ? (
          <>
            <FlatList
              data={restaurants}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ columnGap: 15, paddingBottom: 20, paddingRight: 10 }}
              keyExtractor={(item, index) => `${item.$id}-${index}`}
              removeClippedSubviews={false}
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
              renderItem={({ item, index }) => {
                return (
                  <View style={{ width: 300}}>
                    <RestaurantCard
                      item={item}
                      onFavoriChange={handleChangeFavori}
                      preloadedCoords={item.coords}
                    />
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <Text className='text-white'>Liste vide!</Text>
              )}
            />
          </>
        ) : (
          <View className='items-center justify-center py-10'>
            <Text className='text-white text-[14px]'>
              Aucun restaurant sponsorisé pour le moment
            </Text>
          </View>
        )}
      </View>
    );
  }, [isLoadingCoords, handleChangeFavori, t]);

  // Créer les sections pour la FlatList principale
  const sections = useMemo(() => {
    const items: SectionData[] = [];
    
    items.push({ type: 'header' });
    items.push({ type: 'wallet' });
    items.push({ type: 'services', data: services });
    
    // Toujours afficher la section sponsored si on charge ou si on a des données
    if (isLoadingCoords || sponsoredWithCoords.length > 0 || sponsoredData.length > 0) {
      items.push({ type: 'sponsored', data: sponsoredWithCoords });
    } 
    return items;
  }, [sponsoredWithCoords, isLoadingCoords, sponsoredData]);

  // Renderer principal pour les sections
  const renderSection = useCallback(({ item }: { item: SectionData }) => {
    switch (item.type) {
      case 'header':
        return renderHeader();
      case 'wallet':
        return renderWallet();
      case 'services':
        return renderServices(item.data);
      case 'sponsored':
        return renderSponsored(item.data);
      default:
        return null;
    }
  }, [renderHeader, renderWallet, renderServices, renderSponsored]);

  if (!isSignedIn) return <Redirect href='/' />;

  return (
    <Animated.View
      entering={SlideInRight.duration(200)}
      exiting={SlideOutLeft.duration(200)}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white">
        <View className='w-full h-full'>
          {/* Header fixe */}
          <View className='home_header' style={{ zIndex: 100 }}>
            <Image 
              source={avatar ? avatar : images.utilisateur} 
              className='w-12 h-12 rounded-full' 
              resizeMode="cover" 
              resizeMethod="resize" 
              fadeDuration={0}
            />
            <View className='flex items-center justify-center' style={{ width: 125, height: 50 }}>
              <Image source={images.gozem} className='w-full h-full' resizeMode="contain" />
            </View>
            
            <Pressable 
              onPress={() => router.push('/(services)/notification')}
              className='rounded-full bg-white w-14 h-14 flex items-center justify-center' 
              style={{ elevation: 5 }}
            >
              <Image source={images.cloche} className='size-8' resizeMode="contain" />
              {numberNotification > 0 && (
                <View className='home_notif'>
                  <Text className='font-medium text-white text-[10px] text-center'>
                    {numberNotification}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* FlatList principale avec toutes les sections */}
          <FlatList
            data={sections}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            renderItem={renderSection}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          />
        </View>
      </SafeAreaView>

      {/* Modales de confirmation */}
      {modalAddedVisible && (
        <View
          className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-primary-300 px-4 py-2 rounded-lg'
          style={{ zIndex: 999, height: 60 }}
        >
          <Text className='text-white font-medium text-[14px]'>
            {addedItem?.restaurantName} a été ajouté à vos favoris
          </Text>
        </View>
      )}

      {modalDeleteVisible && (
        <View
          className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-red-500 px-4 py-2 rounded-lg'
          style={{ zIndex: 999, height: 60 }}
        >
          <Text className='text-white font-medium text-[14px]'>
            {pendingRemoveItem?.restaurantName} a été supprimé de vos favoris
          </Text>
        </View>
      )}

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={modalPendingRemoveItem}
        snapPoints={['45%']}
        handleIndicatorStyle={{ display: 'none' }}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView className='p-4 bg-white'>
          <View className='items-center gap-y-4'>
            <View
              className='rounded-full'
              style={{
                overflow: 'hidden',
                height: 75,
                width: 75,
                borderWidth: 2,
                borderColor: '#e5e5e5'
              }}
            >
              <Image
                source={{ uri: pendingRemoveItem?.restaurantLogo }}
                className='w-full h-full'
                resizeMode='cover'
              />
            </View>

            <Text className='font-poppins-bold text-[18px] text-center'>
              Retirer {pendingRemoveItem?.restaurantName} des favoris
            </Text>

            <Text className='font-regular text-[13px] text-center text-neutral-500'>
              Voulez-vous vraiment retirer ce marchand ?
            </Text>

            <View className='w-full mt-2 gap-y-2'>
              <CustomButton
                titre='Oui'
                onPress={confirmRemovedFavori}
                bg='bg-primary-300'
                className='font-poppins-bold'
              />
              <CustomButton
                titre='Non'
                onPress={() => modalPendingRemoveItem.current?.dismiss()}
                className='bg-white border-2 border-primary-400'
                textColor='text-neutral-600 font-poppins-bold'
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </Animated.View>
  );
}