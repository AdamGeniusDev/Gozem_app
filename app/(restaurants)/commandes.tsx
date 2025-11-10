import { View, Text, useWindowDimensions, Image } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { images } from '@/constants';

// 🧠 Définis les routes ici
const FirstRoute = () => (
  <View className='flex-1 justify-center items-center'>
    <View className='bg-neutral-200 items-center justify-center'style={{width:100,height: 100, borderRadius: 150}}>
      <Image source={images.facture} style={{width: '75%',height:'75%'}} resizeMode='contain' tintColor={'#737373'} />
    </View>
    <Text className='font-semibold text-[17px] text-center pt-3'>Vous n'avez aucune commande</Text>
    <Text className='font-regular text-neutral-700 text-center'>Lorsque vous passez une commande, elle s'affichera ici</Text>
  </View>
);

const SecondRoute = () => (
   <View className='flex-1 justify-center items-center'>
    <View className='bg-neutral-200 items-center justify-center'style={{width:100,height: 100, borderRadius: 150}}>
      <Image source={images.facture} style={{width: '75%',height:'75%'}} resizeMode='contain' tintColor={'#737373'} />
    </View>
    <Text className='font-semibold text-[17px] text-center pt-3'>Vous n'avez aucune commande</Text>
    <Text className='font-regular text-neutral-700 text-center'>Lorsque vous passez une commande, elle s'affichera ici</Text>
  </View>
);

const ThirdRoute = () => (
   <View className='flex-1 justify-center items-center'>
    <View className='bg-neutral-200 items-center justify-center'style={{width:100,height: 100, borderRadius: 150}}>
      <Image source={images.facture} style={{width: '75%',height:'75%'}} resizeMode='contain' tintColor={'#737373'} />
    </View>
    <Text className='font-semibold text-[17px] text-center pt-3'>Vous n'avez aucune commande</Text>
    <Text className='font-regular text-neutral-700 text-center'>Lorsque vous passez une commande, elle s'affichera ici</Text>
  </View>
);

const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
  third: ThirdRoute,
});

const Commandes = () => {
  const [index, setIndex] = useState(0);
  const layout = useWindowDimensions();

  const routes = [
    { key: 'first', title: 'En cours' },
    { key: 'second', title: 'Programme' },
    { key: 'third', title: 'Historique' }
  ];

  const renderTab = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#169137', height: 3, borderRadius: 100 }}
      style={{ backgroundColor: 'white' }}
      inactiveColor='#a3a3a3'
      activeColor='black'
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'right', 'left']}>
      <View className='px-5 py-6'>
        <Text className='font-poppins-bold text-[16px]'>Mes Commandes</Text>
      </View>

      <View className='px-2 flex-1'>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTab}
      />
      </View>
    </SafeAreaView>
  );
};

export default Commandes;
