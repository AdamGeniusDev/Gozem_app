import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native'
import  { useState } from 'react'
import { SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { images } from '@/constants'
import { router } from 'expo-router'

const Tickets = () => {

 const insets = useSafeAreaInsets();

  const FirstRoute = ()=>(
    <View className='flex-1 items-center justify-center px-3'>
        <Text className='text-center font-poppins-bold text-[18px]'>Vous n'avez pas encore de commande </Text>
        <Text className='font-regular text-[14px] text-neutral-500 text-center'>Lorsque vous passez une commande elle s'affichera ici</Text>
    </View>
  )
  const SecondRoute = ()=>(
    <View className='flex-1 items-center justify-center px-3'>
        <Text className='text-center font-poppins-bold text-[18px]'>Vous n'avez pas encore de commande </Text>
        <Text className='font-regular text-[14px] text-neutral-500 text-center'>Lorsque vous passez une commande elle s'affichera ici</Text>
    </View>
  )

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  });
  const routes= [
    {key: 'first',title: 'A utiliser'},
    {key: 'second',title: 'Utilises/Expires'},
  ]
  const layout= useWindowDimensions();
  const [index,setIndex] = useState(0); 

  const renderTab = (props:any) => (
    <TabBar
    {...props}
    indicatorStyle={{backgroundColor: '#169137',height: 3, borderRadius: 100}}
    style={{backgroundColor:'white',fontFamily: 'Poppins'}}
    inactiveColor='#737373'
    activeColor='black'
    />
  );
  return (
    <SafeAreaView style={{paddingTop: insets.top + 2}}  className='flex-1 bg-white'>
      <View className='flex-row px-3 items-center'>
      <Pressable onPress={()=> router.back()} hitSlop={15}>
        <Image source={images.back} className='size-6' resizeMode='contain' />
      </Pressable>
         <Text className='font-semibold text-[17px] px-5'>Mes tickets</Text>
      </View>
      <View className='pt-5 flex-1'>
        <TabView
        navigationState={{index,routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        renderTabBar={renderTab}
        />
      </View>
      <Pressable className='bg-primary-300 items-center justify-center flex-1 h-[60px] w-[60px] absolute rounded-full bottom-[40px] right-5' style={{elevation: 5}}>
        <Image source={images.plus} style={{width: '55%',height: '55%'}} tintColor={'#fff'} />
      </Pressable>
    </SafeAreaView>
  )
}

export default Tickets