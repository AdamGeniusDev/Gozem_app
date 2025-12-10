import { View, Text, Pressable, Image, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { images } from '@/constants'

const reduction = () => {
  return (
   <SafeAreaView className='bg-primary-300'>
    <View  className='bg-primary-300 p-5 gap-y-4'style={{height: 200}}>
      <Pressable hitSlop={15} onPress={()=> router.back()}>
        <Image source={images.back} className='size-6' tintColor={'#ffffff'} />
      </Pressable>
      <View className='flex-row gap-x-3 items-center mt-3'>
        <View className='rounded-full bg-white p-3' style={{width: 40, height: 40, justifyContent: 'center', alignItems: 'center'}}>
          <Image source={images.treduction} resizeMode='contain' style={{height: '95%',width: '95%'}} tintColor={'#48681B'}/>
        </View>
        <Text className='text-[20px] font-poppins-bold text-white'>Ajouter un code promo</Text>
      </View>
      <View className='flex-row gap-x-4 items-center'style={{
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
      }}>

        <TextInput
          placeholder={'Code Promo'}
          placeholderTextColor={'#f8f8f8'}
          cursorColor={'#ffffff'}
          className='font-regular'
          style={{
            width: '65%',
            height: '80%',
            borderRightWidth: 1,
            borderRightColor: '#ffffff',
            color: '#ffffff'
          }}
          
        />
        <Pressable className='items-center justify-center' style={{
          width: '30%',
          borderRadius: 30,
          padding: 10,
          backgroundColor: '#ffffff',

        }}>
          <Text className='font-semibold text-primary-300 text-center text-[15px]'>Ajouter</Text>
        </Pressable>

      </View>
      
    </View>
   </SafeAreaView>
  )
}

export default reduction