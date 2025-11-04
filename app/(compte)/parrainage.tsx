import { images } from '@/constants'
import { router } from 'expo-router'
import { View, Text, Pressable, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const parrainage = () => {
  return (
    <SafeAreaView className='bg-white flex-1'>
      <View className='flex-row gap-x-4 px-5 h-[60px] items-end pb-4'>
              <Pressable hitSlop={15} onPress={() => router.back()}>
                <Image source={images.back} className='size-6' resizeMode='contain' />
              </Pressable>
              <Text className='font-semibold text-[15px]'>Parrainage</Text>
            </View>

      <View className='bg-neutral-100 flex-1 p-5'>
        <View className='bg-white rounded-lg py-5 items-center justify-center px-5 gap-y-3'>
            <Image source={images.parrainage} style={{height: 100, width: 100}} resizeMode='contain' />
            <Text className='font-poppins-bold text-[18px] text-center'>Parrainez des amis et obtenez des reductions</Text>
            <View className='rounded-full border-neutral-200 px-3 py-2' style={{borderWidth: 1}}>
              <Text className='text-[11px] font-regular text-neutral-400'>Mon code de parrainage</Text>
            </View>
            <Text className='text-primary-400 font-poppins-bold text-[25px]'>MOLVLRDL</Text>
            <Pressable className='items-center justify-center w-[200px] bg-primary-300 rounded-full py-3'>
              <Text className='font-semibold text-[14px] text-white'>Partager</Text>
            </Pressable>
        </View>

      <Text className='mt-5 font-poppins-bold text-[15px] text-center'>Comment ca marche?</Text>
      <Text className='mt-5 font-regular text-[15px] text-center'>75% de reduction sur la premiere course</Text>

      </View>

    </SafeAreaView>
  )
}

export default parrainage