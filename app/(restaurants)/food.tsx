import { View, Text, Pressable, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router } from 'expo-router'
import { FlatList} from 'react-native-gesture-handler'
import { DeleteFavori, getFavori, getRestaurants, getSpecialities } from '@/lib/appwrite'
import useAppwrite from '@/lib/useAppwrite'
import { Restaurant, Speciality } from '@/types/type'
import RestaurantCard from '@/components/RestaurantCard'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useRef, useState } from 'react'
import { useUserStore } from '@/store/user.store'
import CustomButton from '@/components/CustomButton'


const Food = () => {

  const [modalAddedVisible,setModalAddedVisible] = useState(false);
  const [modalDeleteVisible,setModalDeleteVisible] = useState(false);
  const [addedItem,setAddedItem] = useState<Restaurant | null>(null);
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
  const [pendingRemoveItem,setPendingRemoveItem] = useState<Restaurant | null>(null);
  const user = useUserStore(state => state.user);
  const [removedFavoris, setRemovedFavoris] = useState<string[]>([]);


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
  const confirmRemovedFavori = async ()=> {

    if(!pendingRemoveItem || !user) return;

    const favori = await getFavori({userId: user?.$id, restaurantId: pendingRemoveItem?.$id});

    if(favori) await DeleteFavori(favori.$id);

    modalPendingRemoveItem.current?.dismiss();
    setRemovedFavoris(prev => [...prev, pendingRemoveItem.$id]);
    setModalDeleteVisible(true);
    setTimeout(() => (setModalDeleteVisible(false),setPendingRemoveItem(null)),2000);

  }
  const {data:specialities} = useAppwrite<Speciality[]>({
    fn: () => getSpecialities(),
  })

  const{data: best} = useAppwrite<Restaurant[]>({
    fn: ()=> getRestaurants({numberOpinion: true})
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

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top','left','right']}>
      <View className='flex-row  h-[60px] justify-between items-center mb-3' style={{paddingTop: 5,paddingHorizontal: 15}}>
                    <Pressable hitSlop={15} onPress={() => router.back()}>
                      <Image source={images.back} className='size-6' resizeMode='contain' />
                    </Pressable>
                    <View className='items-center '>
                      <Text className='text-primary-300 text-[13px] font-semibold'>Livraison a</Text>
                      <Text className='text-[15px] font-semibold'>Localisation actuelle</Text>

                    </View>

                    <Image source={images.search} className='size-6' resizeMode='contain'/>
      </View>

      <View className=' bg-neutral-100 pt-5'>
        <FlatList
          data = {specialities}
          horizontal
          keyExtractor={item => item.$id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{columnGap: 5,backgroundColor: "#ffffff",height: 120, alignItems: 'center', paddingBottom: 0, marginBottom: 20}}
          renderItem={({item})=> {
            return(
              <Pressable className='flex-column items-center'style={{width: 70}} onPress={()=> router.push(`/Filter/${item.$id}`)}>
                <Image source={{uri: item.specialityImage}} className='items-center justify-center' resizeMode='cover' style={{width: 50, height: 50, borderRadius: 12}}/>
                <Text numberOfLines={1} className='pt-2 font-semibold text-[12px]'>{item.specialityName}</Text>
              </Pressable>
            )
          }}
         />
         <View className='bg-white p-5'>
            <Text className='font-poppins-bold text-[18px]'>A la une</Text>
            <Text className='font-regular text-neutral-600'>Prepare toi a savourer ce qui fait le buzz du moment</Text>

            <FlatList
            data={best}
            contentContainerStyle={{paddingVertical: 10}}
            keyExtractor={(item)=> item.$id}
            renderItem={({item})=> <RestaurantCard item ={item} best={true} onFavoriChange={handleChangeFavori} removedFavoris={removedFavoris} />}
             />

         </View>
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

export default Food