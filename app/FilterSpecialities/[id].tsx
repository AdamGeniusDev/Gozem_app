import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native'
import { router, useLocalSearchParams,useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import useAppwrite from '@/lib/useAppwrite';
import { Restaurant } from '@/types/type';
import { getRestaurantsBySpeciality } from '@/lib/appwrite';
import { FlatList } from 'react-native-gesture-handler';
import RestaurantCard from '@/components/RestaurantCard';
import { useCallback, useRef, useState } from 'react';
import  { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import CustomButton from '@/components/CustomButton';
import { useUserStore } from '@/store/user.store';
import { useFavorisStore } from '@/store/favoris.store';

const Speciality = () => {

  const { id } = useLocalSearchParams();
  const [modalAddedVisible,setModalAddedVisible] = useState(false);
  const [modalDeleteVisible,setModalDeleteVisible] = useState(false);
  const [addedItem,setAddedItem] = useState<Restaurant | null>(null);
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
  const [pendingRemoveItem,setPendingRemoveItem] = useState<Restaurant | null>(null);
  const user = useUserStore(state => state.user);
  const { loadFavoris, removeFavori } = useFavorisStore();  

  const handleChangeFavori = async(action: 'added' | 'removeRequest', item?: Restaurant) =>{
       if(action === 'added' && item){
         setModalAddedVisible(true);
         setAddedItem(item);

         setTimeout(() => (setModalAddedVisible(false),setAddedItem(null)),2000)
       } else if( action === 'removeRequest' && item){
         modalPendingRemoveItem.current?.present()
         setPendingRemoveItem(item);
       }
     }

     useFocusEffect(
         useCallback(() => {
           if (user?.$id) {
             loadFavoris(user.$id);
           }
         }, [user?.$id, loadFavoris])
       );

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

  const { data: restaurants, loading} = useAppwrite<Restaurant[]>({
    fn: () => getRestaurantsBySpeciality(id as string)
  });


  const numberofRestaurants = restaurants?.length || 0;
  const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []);

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-row h-[50px] justify-between items-center mb-3' style={{ paddingTop: 5, paddingHorizontal: 15 }}>
        <Pressable hitSlop={15} onPress={() => router.back()}>
          <Image source={images.back} className='size-6' resizeMode='contain' />
        </Pressable>
        <View className='items-center'>
          <Text className='text-primary-300 text-[13px] font-semibold'>Livraison a</Text>
          <Text className='text-[15px] font-semibold'>Localisation actuelle</Text>
        </View>
        <Image source={images.search} className='size-6' resizeMode='contain' />
      </View>

      <View className='flex-1 bg-neutral-100'>
        <FlatList
          data={restaurants}
          keyExtractor={item => item.$id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 15, rowGap: 15, paddingBottom: 25 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => {
            if (loading) {
              return (
                <View className='w-full justify-center items-center'>
                  <View className='bg-white rounded-full items-center justify-center' style={{ width: 50, height: 50 }}>
                    <ActivityIndicator size={'large'} color={'#48681B'} />
                  </View>
                </View>
              );
            }

            if (numberofRestaurants > 0) {
              return (
                <Text className='text-[20px] font-poppins-bold'>
                  {numberofRestaurants} restaurant{numberofRestaurants > 1 ? 's' : ''} trouvé{numberofRestaurants > 1 ? 's' : ''}
                </Text>
              );
            }

            return (
              <View className='w-full items-center justify-center py-10'>
                <Text className='text-neutral-500'>Aucun restaurant trouvé pour l'instant</Text>
              </View>
            );
          }}
          renderItem={({ item }) => <RestaurantCard item ={item} onFavoriChange={handleChangeFavori}/>}
        />
      </View>
      {modalAddedVisible && (
        <View className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-primary-300 px-4 py-2 rounded-lg '
          style={{ zIndex: 999 ,height: 60}}>
      <Text className='text-white font-medium text-[14px]'>
        {addedItem?.restaurantName} a été ajouté à vos favoris
      </Text>
      </View>

      )}

      {modalDeleteVisible && (
        <View className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-red-500 px-4 py-2 rounded-lg '
          style={{ zIndex: 999 ,height: 60}}>
      <Text className='text-white font-medium text-[14px]'>
        {pendingRemoveItem?.restaurantName} a été supprimer de vos favoris
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

      <View className='rounded-full ' style={{ overflow: 'hidden', height: 75, width: 75,borderEndWidth: 2,borderBottomColor: '#e5e5e5'}}>
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
        <CustomButton titre='Oui' onPress={confirmRemovedFavori} bg='bg-primary-300'  className='font-poppins-bold'/>
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
  )
}

export default Speciality
