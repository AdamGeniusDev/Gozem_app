import Map from '@/components/Map'
import { images } from '@/constants'
import { Image, Pressable, Text, View } from 'react-native'


const Ouidah = () => {
 
  return (
    <View className='flex-1'>
      <Map>
        <View className='w-full px-3 pt-3'>
          <Text
          ellipsizeMode='tail'
          className='font-poppins-bold text-[18px]'>
          🚙Reserver votre trajet de Cotonou a Ouidah
        </Text>
        <View className='flex-row py-3 gap-x-3 items-center'>
        <Image source={images.fil} className='h-[70px]' resizeMode='contain' />
        <View className='flex-1 flex gap-y-3'>
          <Pressable className='bg-neutral-100 flex-row items-center rounded-lg border-neutral-200 border-[1px] w-full p-2 justify-between' style={{height: 55}}>
            <View>
              <Text className='font-regular text-neutral-500 text-[12px]'>Adresse de depart</Text>
              <Text className='font-medium text-[14px]'>Ma position actuelle</Text>
            </View>
            <Image source={images.depart} className='w-10 h-10' resizeMode='contain'/>
          </Pressable>
          <Pressable className='bg-neutral-100 flex-row items-center rounded-lg border-neutral-200 border-[1px] w-full p-2 justify-between' style={{height: 55}}>
            <Text className='font-regular text-neutral-500 text-[14px]'>
              Adresse de destination
            </Text>
            <Image source={images.dest} className='w-5 h-5' resizeMode='contain' tintColor={'#B0B3B2'}/>
          </Pressable>
        </View>
      </View>
      <Text className='text-neutral-500 text-[12px]'>Destination recentes depuis ce lieu</Text>
      <View className='mt-2 p-2  rounded-lg flex items-center justify-center bg-white' style={{height: 65, width:130,elevation: 3}}>
        <Text className='font-medium text-[13px]'>Continuer sans destination</Text>
      </View>
      </View>
      </Map>
    </View>
  )
}

export default Ouidah