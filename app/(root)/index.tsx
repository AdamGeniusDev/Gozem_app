import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { images, onboarding, services } from "@/constants";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import ServiceModal from "@/components/ServiceModal";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import useLocationStore from "@/store/location.store";
import { useUserStore } from "@/store/user.store";
import { useFavorisStore } from "@/store/favoris.store";
import { useTranslation } from "react-i18next";
import { Redirect, useFocusEffect } from "expo-router";
import useNotificationStore from "@/store/notification.store";
import { getRestaurants } from "@/lib/appwrite";
import { Restaurant } from "@/types/type";
import useAppwrite from "@/lib/useAppwrite";
import RestaurantCard from "@/components/RestaurantCard";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import CustomButton from "@/components/CustomButton";

export default function Index() {
  const { t } = useTranslation();
  const { isLoaded, getToken, userId, isSignedIn } = useAuth();
  const avatar = useUserStore(state => state.avatar);
  const loadUser = useUserStore(state => state.loadUser);
  const user = useUserStore(state => state.user);
  const { getAll } = useLocationStore();
  const { initialize, requestPermission } = useNotificationStore();
  
  const { loadFavoris, removeFavori } = useFavorisStore();
  
  const [modalAddedVisible, setModalAddedVisible] = useState(false);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [addedItem, setAddedItem] = useState<Restaurant | null>(null);
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<Restaurant | null>(null);

  const number = 0;

  useEffect(() => {
    if (!isLoaded || !userId) return;
    loadUser(getToken, userId);
  }, [userId, isLoaded]);

  useEffect(() => {
    getAll();
  }, [getAll]);

  useEffect(() => {
    requestPermission();
    initialize();
  }, [initialize, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        loadFavoris(user.$id);
      }
    }, [user?.$id, loadFavoris])
  );

  const { data: sponsored} = useAppwrite<Restaurant[]>({
    fn: () => getRestaurants({ sponsored: 'yes' }),
  });

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
      console.error('Erreur suppression favori:', error);
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

  if (!isSignedIn) return <Redirect href='/' />;

  return (
    <Animated.View
      entering={SlideInRight.duration(200)}
      exiting={SlideOutLeft.duration(200)}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white">
        <View className='w-full h-full'>
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
            <View className='rounded-full bg-white w-14 h-14 flex items-center justify-center' style={{ elevation: 5 }}>
              <Image source={images.cloche} className='size-7' resizeMode="contain" />
              {!!number && (
                <View className='home_notif'>
                  <Text className='font-medium text-white text-[10px] text-center'>{number}</Text>
                </View>
              )}
            </View>
          </View>

          <FlatList
            numColumns={4}
            data={services}
            className='flex-1'
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ServiceModal data={item} />}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
            contentContainerStyle={{ paddingTop: 10, rowGap: 16 }}
            ListHeaderComponent={() => {
              return (
                <View className='px-5 w-full mb-5'>
                  <View className='w-full' style={{ height: 180, marginTop: 80, marginBottom: 20 }}>
                    <Image source={onboarding.image} className='h-full w-full rounded-lg' resizeMode='cover' />
                  </View>
                  <View className='w-full rounded-lg mt-3' style={{ height: 80, overflow: 'hidden' }}>
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
                        <Text className='font-poppins-bold text-[22px] text-white'>
                          0<Text className='ml-3 text-[18px]'>F</Text>
                        </Text>
                      </View>
                      <Pressable className='w-[45px] h-[45px] rounded-full bg-white items-center justify-center'>
                        <Image source={images.plus} style={{ width: '60%', height: '60%' }} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={() => {
              return (
                <View
                  className='pl-3 py-5 mt-5'
                  style={{
                    backgroundColor: '#dc2626',
                    height: 400
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

                  <FlatList
                    data={sponsored}
                    className='flex-1'
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ columnGap: 15, paddingBottom: 20, paddingRight: 10 }}
                    horizontal
                    keyExtractor={(item) => String(item.$id)}
                    renderItem={({ item }) => (
                      <View style={{ width: 300 }}>
                        <RestaurantCard
                          item={item}
                          onFavoriChange={handleChangeFavori}
                        />
                      </View>
                    )}
                  />
                </View>
              );
            }}
          />
        </View>
      </SafeAreaView>

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

      <BottomSheetModal
        ref={modalPendingRemoveItem}
        snapPoints={['45%']}
        handleIndicatorStyle={{ display: 'none' }}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableBlurKeyboardOnGesture={false}
        enableHandlePanningGesture={false}
        enableContentPanningGesture={false}
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
                borderEndWidth: 2,
                borderBottomColor: '#e5e5e5'
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