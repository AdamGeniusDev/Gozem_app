import React, { useState } from 'react'
import Map from '@/components/Map'
import { Text, View } from 'react-native'
import {SceneMap, TabBar, TabView} from 'react-native-tab-view';

const First = () => (
  <View style={{flex:1,alignItems: 'center',justifyContent: 'center'}}>
      <Text>Premier onglet</Text>
  </View>
)

const Second = () => (
  <View style={{flex:1,alignItems: 'center',justifyContent: 'center'}}>
      <Text>Deuxieme onglet</Text>
  </View>
)
const renderScene = SceneMap({
    first: First,
    second:Second,
})
const Zem = () => {

  const [index,setIndex]=useState(0);
  const [routes] = useState([
    {key: 'first',title: 'Infos'},
    {key: 'second',title: 'Historique'},
  ])
  return (
    <View className='flex-1'>
      <Map>
        <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        lazy                                         // charge à la demande
        renderTabBar={(props) => (
        <TabBar
          {...props}
          scrollEnabled={false}
          indicatorStyle={{ backgroundColor: '#169137', height: 3 }}
          style={{ backgroundColor: 'white', elevation: 0 }}
          labelStyle={{ color: 'black', fontWeight: '600' }}
        />
      )}
    />
      </Map>
    </View>
  )
}

export default Zem