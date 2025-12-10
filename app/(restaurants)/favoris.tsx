import { View, Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useAppwrite from '@/lib/useAppwrite'
import { getUserAllFavori } from '@/lib/appwrite'
import { useUserStore } from '@/store/user.store'
import { Restaurant } from '@/types/type'
import { FlatList } from 'react-native-gesture-handler'
import RestaurantCard from '@/components/RestaurantCard'
import { useCallback, useRef, useState } from 'react'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import CustomButton from '@/components/CustomButton'
import { images } from '@/constants'
import { useFocusEffect } from 'expo-router'
import { useFavorisStore } from '@/store/favoris.store'
import RestaurantCardSkeleton from '@/components/RestaurantCardSkeleton'

const Favoris = () => {

   const user = useUserStore(state => state.user);
   const { loadFavoris, removeFavori } = useFavorisStore();
   const [modalAddedVisible,setModalAddedVisible] = useState(false);
    const [modalDeleteVisible,setModalDeleteVisible] = useState(false);
    const [addedItem,setAddedItem] = useState<Restaurant | null>(null);
    const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
    const [pendingRemoveItem,setPendingRemoveItem] = useState<Restaurant | null>(null);

    const {data: restaurants,loading ,refetch} = useAppwrite<Restaurant[]> ({
      fn: () => getUserAllFavori(user.$id as string),
      skip: !user
    });

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

    useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        loadFavoris(user.$id);
        refetch();
      }
    }, [user?.$id, loadFavoris])
  );

  const confirmRemovedFavori = useCallback(async () => {
    if (!pendingRemoveItem || !user) return;

    try {
      await removeFavori(user.$id, pendingRemoveItem.$id);
      
      modalPendingRemoveItem.current?.dismiss();
      await refetch(); 
      setModalDeleteVisible(true);
      setTimeout(() => {
        setModalDeleteVisible(false);
        setPendingRemoveItem(null);
      }, 2000);
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
  }, [pendingRemoveItem, user, removeFavori,refetch]);

   if(!user) return;

   const handleChangeFavori = async(action: 'added' | 'removeRequest', item?: Restaurant) =>{
       if(action === 'added' && item){
         setModalAddedVisible(true);
         setAddedItem(item);

          await refetch()
         setTimeout(() => (setModalAddedVisible(false),setAddedItem(null)),2000)
       } else if( action === 'removeRequest' && item){
         modalPendingRemoveItem.current?.present()
         setPendingRemoveItem(item);
       }
     }
     
     

    

  return (
    <SafeAreaView className='bg-white flex-1 px-5' edges={['top','left','right']}>
      <View className='mt-5'>
        <Text className='font-poppins-bold text-[16px]'>Mes favoris</Text>
      </View>

      {loading ? (
  // Pendant le chargement : afficher les skeletons
  <View className='px-5'>
    <RestaurantCardSkeleton />
    <View className='mt-4'>
      <RestaurantCardSkeleton />
    </View>
    <View className='mt-4'>
      <RestaurantCardSkeleton />
    </View>
  </View>
) : (
  // Une fois chargé : afficher les données réelles
  <FlatList
    data={restaurants}
    keyExtractor={item => item.$id}
    contentContainerStyle={{ 
      paddingHorizontal: 5, 
      paddingTop: 15, 
      rowGap: 15, 
      paddingBottom: 25, 
      flexGrow: 1 
    }}
    showsVerticalScrollIndicator={false}
    renderItem={({ item }) => (
      <RestaurantCard 
        item={item} 
        onFavoriChange={handleChangeFavori} 
      />
    )}
    ListEmptyComponent={() => (
      <View className='flex-1 items-center justify-center'>
        <View 
          className='bg-neutral-200 items-center justify-center' 
          style={{ width: 80, height: 80, borderRadius: 50 }}
        >
          <Image 
            source={images.coeurp} 
            resizeMode='cover' 
            style={{ width: '50%', height: '50%' }} 
            tintColor={'#a3a3a3'}
          />
        </View>

        <Text className='font-semibold text-[16px] mt-3'>
          Vous n'avez aucun favori
        </Text>
        <Text className='font-regular text-[14px] mt-2 text-center'>
          Pour ajouter un marchand a vos favoris, appuyez sur l'icone de coeur pour l'enregistrer
        </Text>
      </View>
    )}
  />
)}
       {modalAddedVisible && (
        <View className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-primary-300 px-4 py-2 rounded-lg '
          style={{ zIndex: 999 ,height: 60}}>
      <Text className='text-white font-medium text-[14px]'>
        {addedItem?.restaurantName} a été ajouté à vos favoris
      </Text>
      </View>

      )}

      {modalDeleteVisible && (
        <View className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-primary-400 px-4 py-2 rounded-lg '
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

export default Favoris