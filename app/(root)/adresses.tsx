import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native'
import  { useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { images } from '@/constants'
import { useTranslation } from 'react-i18next'

const Adresses = () => {

  const {t} = useTranslation();
  const insets = useSafeAreaInsets()

  const FirstRoute = ()=>(
    <View className='flex-1'>
        <Text>Enregistrer</Text>
    </View>
  )
  const SecondRoute = ()=>(
    <View className='flex-1'>
        <Text>Demande en attente</Text>
    </View>
  )

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  });
  const routes= [
    {key: 'first',title: t('addresses.tabs.saved')},
    {key: 'second',title: t('addresses.tabs.pending')},
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
    <SafeAreaView style={{paddingTop: insets.top}} className='flex-1 bg-white'>
      <Text className='font-poppins-bold text-[17px] px-5'>{t('addresses.title')}</Text>
      <View className='pt-5 flex-1'>
        <TabView
        navigationState={{index,routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        renderTabBar={renderTab}
        />
      </View>
      <Pressable className='bg-primary-300 items-center justify-center flex-1 h-[60px] w-[60px] absolute rounded-full bottom-5 right-5' style={{elevation: 5}}>
        <Image source={images.plus} style={{width: '55%',height: '55%'}} tintColor={'#fff'} />
      </Pressable>
    </SafeAreaView>
  )
}

export default Adresses