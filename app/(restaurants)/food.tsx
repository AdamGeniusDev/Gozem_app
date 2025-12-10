import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router, useFocusEffect } from 'expo-router'
import { FlatList } from 'react-native-gesture-handler'
import {getRestaurants, getSpecialities } from '@/lib/appwrite'
import useAppwrite from '@/lib/useAppwrite'
import { Restaurant, Speciality } from '@/types/type'
import RestaurantCard from '@/components/RestaurantCard'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useRef, useState, useMemo } from 'react'
import { useUserStore } from '@/store/user.store'
import CustomButton from '@/components/CustomButton'
import { useFavorisStore } from '@/store/favoris.store'
import RestaurantCardSkeleton from '@/components/RestaurantCardSkeleton'

type SectionData = {
  type: 'specialities' | 'best' | 'sponsored';
  data?: any;
}

const Food = () => {
  const [modalAddedVisible, setModalAddedVisible] = useState(false);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
  const [addedItem, setAddedItem] = useState<Restaurant | null>(null);
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<Restaurant | null>(null);
  const user = useUserStore(state => state.user);
  const { loadFavoris, removeFavori } = useFavorisStore();

  


  const { data: specialities, loading: loadingSpecialities } = useAppwrite<Speciality[]>({
    fn: () => getSpecialities(),
  });

  const { data: best, loading: loadingBest} = useAppwrite<Restaurant[]>({
    fn: () => getRestaurants({ numberOpinion: true })
  });

  const { data: sponsored, loading: loadingSponsored } = useAppwrite<Restaurant[]>({
    fn: () => getRestaurants({ sponsored: 'yes' }),
  });

  // Créer les sections pour la FlatList
  const sections = useMemo(() => {
    const items: SectionData[] = [];
    
    if (specialities && specialities.length > 0) {
      items.push({ type: 'specialities', data: specialities });
    }
    
    if (best && best.length > 0) {
      items.push({ type: 'best', data: best });
    }
    
    if (sponsored && sponsored.length > 0) {
      items.push({ type: 'sponsored', data: sponsored });
    }
    
    return items;
  }, [specialities, best, sponsored]);

   useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        loadFavoris(user.$id);
      }
    }, [user?.$id, loadFavoris])
  );

 


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
      await removeFavori(user.$id,pendingRemoveItem.$id)

      modalPendingRemoveItem.current?.dismiss();
      setModalDeleteVisible(true);
      setTimeout(() => {
        setModalDeleteVisible(false);
        setPendingRemoveItem(null);
      }, 2000);
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
  }, [pendingRemoveItem, user,removeFavori]);

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

  const renderSpecialities = useCallback((specialities: Speciality[]) => (
    <View className='bg-white mb-5'>
      <FlatList
        data={specialities}
        horizontal
        keyExtractor={item => item.$id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          columnGap: 15, 
          paddingHorizontal: 20, 
          paddingVertical: 15 
        }}
        renderItem={({ item }) => (
          <Pressable 
            className='items-center' 
            style={{ width: 70 }} 
            onPress={() => router.push(`/FilterSpecialities/${item.$id}`)}
          >
            <Image 
              source={{ uri: item.specialityImage }} 
              className='items-center justify-center' 
              resizeMode='cover' 
              style={{ width: 60, height: 60, borderRadius: 15 }}
            />
            <Text numberOfLines={1} className='pt-2 font-semibold text-[12px] text-center'>
              {item.specialityName}
            </Text>
          </Pressable>
        )}
      />
    </View>
  ), []);

  const renderBestSection = useCallback((restaurants: Restaurant[]) => (
  <View className='bg-white px-5 py-4 mb-5'>
    <Text className='font-poppins-bold text-[20px]'>À la une</Text>
    <Text className='font-regular text-neutral-600 mb-4'>
      Prépare-toi à savourer ce qui fait le buzz du moment
    </Text>
    
    {/* Afficher skeleton pendant le chargement */}
    {loadingBest ? (
      <>
        <RestaurantCardSkeleton />
        <View className='mb-4'>
          <RestaurantCardSkeleton />
        </View>
      </>
    ) : (
      restaurants.map(restaurant => (
        <View key={restaurant.$id} className='mb-4'>
          <RestaurantCard 
            item={restaurant} 
            onFavoriChange={handleChangeFavori}
            best={true}
          />
        </View>
      ))
    )}
  </View>
), [handleChangeFavori, loadingBest]);

 const renderSponsoredSection = useCallback((restaurants: Restaurant[]) => (
  <View className='bg-white px-5 py-4 mb-5'>
    <View className='w-[100px] mb-2'>
      <Text className='text-primary-300 text-[12px] font-semibold text-center bg-neutral-100 rounded-full py-1'>
        Sponsorisé
      </Text>
    </View>
    <Text className='text-[20px] font-poppins-bold mb-4'>
      Propositions du moment 💯
    </Text>
    
    
    {loadingSponsored ? (
      <FlatList
        data={[1, 2, 3]} // 3 skeletons
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ columnGap: 15, paddingBottom: 20, paddingHorizontal: 10 }}
        keyExtractor={(item) => String(item)}
        renderItem={() => (
          <View style={{ width: 280 }}>
            <RestaurantCardSkeleton />
          </View>
        )}
      />
    ) : (
      <FlatList
        data={restaurants}
        keyExtractor={item => item.$id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ columnGap: 15, paddingBottom: 20, paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <View style={{ width: 280 }}>
            <RestaurantCard 
              item={item} 
              onFavoriChange={handleChangeFavori}
            />
          </View>
        )}
      />
    )}
  </View>
), [handleChangeFavori, loadingSponsored]);

  const renderSection = useCallback(({ item }: { item: SectionData }) => {
    switch (item.type) {
      case 'specialities':
        return renderSpecialities(item.data);
      case 'best':
        return renderBestSection(item.data);
      case 'sponsored':
        return renderSponsoredSection(item.data);
      default:
        return null;
    }
  }, [renderSpecialities, renderBestSection, renderSponsoredSection]);

  const isLoading = loadingSpecialities || loadingBest || loadingSponsored;

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className='flex-row h-[60px] justify-between items-center mb-3 px-5'>
        <Pressable hitSlop={15} onPress={() => router.back()}>
          <Image source={images.back} className='size-6' resizeMode='contain' />
        </Pressable>
        <View className='items-center'>
          <Text className='text-primary-300 text-[13px] font-semibold'>Livraison à</Text>
          <Text className='text-[15px] font-semibold'>Localisation actuelle</Text>
        </View>
        <Pressable hitSlop={20} onPress={()=> router.push(`/(services)/search`)}>
          <Image source={images.search} className='size-6' resizeMode='contain' />
        </Pressable>
      </View>

      <View className='flex-1 bg-neutral-100'>
        {isLoading ? (
          <View className='w-full justify-center items-center mt-2'>
                  <View className='bg-white rounded-full items-center justify-center' style={{ width: 50, height: 50 }}>
                    <ActivityIndicator size={'large'} color={'#48681B'} />
                  </View>
            </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            renderItem={renderSection}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View className='flex-1 items-center justify-center py-20'>
                <Text className='text-neutral-500 text-[16px]'>
                  Aucun restaurant disponible
                </Text>
              </View>
            )}
          />
        )}
      </View>

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
    </SafeAreaView>
  );
};

export default Food;