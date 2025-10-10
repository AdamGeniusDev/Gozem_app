import { Image, Text, useWindowDimensions, View } from 'react-native'
import  { useCallback, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { images } from '@/constants'
import { router, useLocalSearchParams } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'


const Activity = () => {

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
    {key: 'first',title: t('activity.tabs.ongoing')},
    {key: 'second',title: t('activity.tabs.history')},
  ]
  const layout= useWindowDimensions();
  const toNumber = (v: string | string[])=>{
    return Array.isArray(v) ? Number(v[0]) : Number(v);
  }
  const {initialIndex} = useLocalSearchParams<{initialIndex?: string | string[]}>();
  const [index,setIndex] = useState(()=>toNumber(initialIndex ?? '0')); 

  
   useFocusEffect(
  useCallback(() => {
    if (initialIndex !== undefined) {
      const n = toNumber(initialIndex);
      setIndex(Number.isFinite(n) ? n : 0);
    } else {
      setIndex(0);
    }
  }, [initialIndex])
);

  const renderTab = (props:any) => (
    <TabBar
    {...props}
    indicatorStyle={{backgroundColor: '#169137',height: 3, borderRadius: 100}}
    style={{backgroundColor:'white'}}
    inactiveColor='#a3a3a3'
    activeColor='black'
    />
  );
  return (
    <SafeAreaView style={{paddingTop: insets.top}} className='flex-1 bg-white'>
      <View className='w-full flex-row justify-between items-center px-5'>
        <Text className='font-poppins-bold text-[17px] '>{t('activity.title')}</Text>

        <View className='bg-neutral-200 rounded-full px-5 py-2 flex-row gap-x-2 items-center'>
          <Image source={images.support} className='w-5 h-5' resizeMode='contain'/>
          <Text className='font-semibold'>{t('activity.support')}</Text>
        </View>
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
    </SafeAreaView>
  )
}

export default Activity