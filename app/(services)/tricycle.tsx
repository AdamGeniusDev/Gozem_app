import AnimatedTabs from '@/components/AnimatedTabs'
import CustomButton from '@/components/CustomButton'
import Map from '@/components/Map'
import { images } from '@/constants'
import { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'



const Tricycle = () => {
  const tab = [
    'Contact Gozem',
    'Contact telephonique',
    'Quelqu\'un d\'autre'
  ]

  const [modalVisible, setModalVisible] = useState(false);

  const FirstRoute = () => (
    <View className='px-4 pt-2'>
      <View className='flex-row max-w-full justify-between'>
        <Text
          numberOfLines={2}
          ellipsizeMode='tail'
          className='font-poppins-bold text-[18px]'
          style={{ width: '50%' }}>
          Definir les adresses de departs
        </Text>
        <Pressable 
          className='bg-neutral-100 py-2 flex-row rounded-lg border-neutral-200 justify-center items-center gap-2 px-2' 
          style={{ borderWidth: 2, width: '45%' }} 
          onPress={() => setModalVisible(!modalVisible)}>
          <View className='flex items-end'>
            <Text className='font-regular text-neutral-500 text-[12px]'>Commande pour</Text>
            <Text className='font-medium text-[12px]'>Moi-meme</Text>
          </View>
          <View>
            <Image source={images.compte} className='w-10 h-10' tintColor={'#a3a3a3'} />
            <Image 
              source={images.expand} 
              className='w-5 h-5 absolute bottom-[-5] right-0' 
              style={{ zIndex: 10 }} 
              resizeMode='contain' 
              tintColor={'#e5e5e5'} 
            />
          </View>
        </Pressable>
      </View>

      {modalVisible && (
        <View 
          className='bg-white absolute'
          style={{
            right: 20,
            top: 65,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            width: 230,
            height: 150,
            borderRadius: 15,
            padding: 5,
            zIndex: 20, 
          }}>
          {tab.map((item, index) => (
            <Pressable 
              key={item} 
              className='h-[45px] px-5 justify-center flex items-end border-b border-neutral-200'
              style={{ 
                borderBottomWidth: index < tab.length - 1 ? 1 : 0 
              }}
              onPress={() => {
                setModalVisible(false);
              }}>
              <Text className='text-neutral-600'>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
      <View className='mt-2 p-3  rounded-lg flex items-center justify-center bg-white' style={{height: 65, width:130,elevation: 3}}>
        <Text className='font-medium text-[14px]'>Continuer sans destination</Text>
      </View>
    </View>
  )

  const SecondRoute = () => (
     <View className='px-4 pt-2'>
      <View className='flex-row max-w-full justify-between'>
        <Text
          numberOfLines={2}
          ellipsizeMode='tail'
          className='font-poppins-bold text-[18px]'
          style={{ width: '50%' }}>
          Definir les adresses de departs
        </Text>
        <Pressable 
          className='bg-neutral-100 py-2 flex-row rounded-lg border-neutral-200 justify-center items-center gap-2 px-2' 
          style={{ borderWidth: 2, width: '45%' }} 
          onPress={() => setModalVisible(!modalVisible)}>
          <View className='flex items-end'>
            <Text className='font-regular text-neutral-500 text-[12px]'>Commande pour</Text>
            <Text className='font-medium text-[12px]'>Moi-meme</Text>
          </View>
          <View>
            <Image source={images.compte} className='w-10 h-10' tintColor={'#a3a3a3'} />
            <Image 
              source={images.expand} 
              className='w-5 h-5 absolute bottom-[-5] right-0' 
              style={{ zIndex: 10 }} 
              resizeMode='contain' 
              tintColor={'#e5e5e5'} 
            />
          </View>
        </Pressable>
      </View>

      {modalVisible && (
        <View 
          className='bg-white absolute'
          style={{
            right: 20,
            top: 65,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            width: 230,
            height: 150,
            borderRadius: 15,
            padding: 5,
            zIndex: 20, 
          }}>
          {tab.map((item, index) => (
            <Pressable 
              key={item} 
              className='h-[45px] px-5 justify-center flex items-end border-b border-neutral-200'
              style={{ 
                borderBottomWidth: index < tab.length - 1 ? 1 : 0 
              }}
              onPress={() => {
                setModalVisible(false);
              }}>
              <Text className='text-neutral-600'>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
     <View className='py-3 items-center px-3 flex-1 justify-center' style={{gap: 15}}>
      <View className='flex-row items-center gap-x-3'>
      <Image source={images.locate} className='w-5 h-5' resizeMode='contain' tintColor={'#169137'}/>
      <Pressable className='bg-neutral-100 flex-row items-center h-[60px] rounded-lg border-neutral-200 border-[1px] w-full p-2 justify-between'style={{height: 55}}>
            <View>
              <Text className='font-regular text-neutral-500 text-[12px]'>Adresse de depart</Text>
              <Text className='font-medium text-[14px]'>Ma position actuelle</Text>
            </View>
            <Image source={images.depart} className='w-10 h-10' resizeMode='contain'/>
        </Pressable>
      </View>
      <View className='flex-row items-center gap-x-3'>
      <Image source={images.heure} className='w-5 h-5' resizeMode='contain' tintColor={'#169137'}/>
      <Pressable className='bg-neutral-100 flex-row items-center h-[60px] rounded-lg border-neutral-200 border-[1px] w-full p-2 justify-between' style={{height: 55}}>
            <View>
              <Text className='font-regular text-neutral-400 text-[14px]'>Duree de la course</Text>
            </View>
            <Image source={images.droite} className='w-4 h-4' resizeMode='contain' tintColor={'#B0B3B2'}/>
        </Pressable>
      </View>
     <CustomButton titre='Continuer' disabled={true}/>

     </View>
    </View>
    
  )

  const routes = [
    {
      key: 'first', title: 'A la distance', component: FirstRoute
    },
    {
      key: 'second', title: 'A la duree', component: SecondRoute
    }
  ]

  return (
    <View className='flex-1'>
      <Map>
        <View className='w-full'>
          <AnimatedTabs routes={routes} initialView={0} />
        </View>
      </Map>
      {modalVisible && (
        <Pressable
          onPress={() => setModalVisible(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10, 
          }}
        />
      )}
    </View>
  )
}

export default Tricycle