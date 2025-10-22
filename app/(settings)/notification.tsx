import { View, Text, Image, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import CustomButton from '@/components/CustomButton'
import useNotificationStore from '@/store/notification.store'



const Notification = () => {
  const [allEnabled,setAllEnabled] = useState(true);
  const [active,setActive] = useState(true);
  const [emailEnabled,setEmailEnabled] = useState(true);
  const [smsEnabled,setSmsEnabled] = useState(true);

    const {
    initialize,
    permissionsStatus,
  } = useNotificationStore();

  useEffect(()=>{
    (async()=> {
      await initialize();

      if(permissionsStatus === 'granted'){
        setActive(true);
      } else {
        setActive(false);
      }
    })();
  },[permissionsStatus])


 

  const params = [
  {title: 'Push',icone:images.cloche, active: active, onPress: () => setActive(!active)},
  {title: 'Email',icone:images.email, active: emailEnabled, onPress: ()=> setEmailEnabled(!emailEnabled)},
  {title: 'SMS',icone:images.sms, active: smsEnabled, onPress: ()=> setSmsEnabled(!smsEnabled)}
]

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-row gap-x-4 px-5 h-[60px] items-end pb-4'>
        <Pressable hitSlop={15} onPress={()=> router.back()}>
        <Image source={images.back} className='size-6' resizeMode='contain' />
        </Pressable>
        <Text className='font-semibold text-[15px]'>Parametres des notifications</Text>
      </View>
      <View className='bg-neutral-100 flex-1 p-5 flex-col justify-between'>
        <View>
          <View className=' flex-row p-3 items-center gap-x-5 mt-3 rounded-xl' style={{height: 100,backgroundColor: '#f2efea'}}>
            <Image source={images.notif} style={{height: 40, width: 40, tintColor: allEnabled? '#169137':'#B0B3B2'}}/>
            <View className='flex-row justify-between items-center flex-1'>
              <View className='gap-y-2' style={{width: '80%'}}>
                <Text className='font-semibold text-[16px]'>
                Tout Desactiver
              </Text>
              <Text className='font-regular text-[13px] text-neutral-600'>Desactiver toutes les notifications</Text>
              </View> 
              <Switch 
              trackColor={{false: '#e5e5e5', true: '#169137' }}
              thumbColor={'#ffffff'}
              value={allEnabled} 
              onValueChange={()=> setAllEnabled(!allEnabled)}
              style={{transform: [{scaleX: 1.2},{scaleY: 1.2}]}}
              />
            </View>
          </View>
           <View  style={{paddingVertical: 30}}>
              <View className='flex-row items-center justify-between'>
                <View className='gap-y-2 mb-5' style={{width: '75%'}}>
                  <Text className='font-semibold text-[16px]'>
                    Marketing : promo & offres
                  </Text>
                  <Text className='font-regular text-[13px] text-neutral-600'>
                    Recevoir les notifications pour les codes promo et les offres
                  </Text>
                  </View>
                   <Switch 
                    trackColor={{false: '#e5e5e5', true: '#169137' }}
                    thumbColor={'#ffffff'}
                    value={allEnabled} 
                    onValueChange={()=> setAllEnabled(!allEnabled)}
                    style={{transform: [{scaleX: 1.2},{scaleY: 1.2}]}}
                    />
              </View>

              {
                params.map((item,i)=>(
                  <View key={i} className='flex-row gap-x-4 items-center' style={{height: 60}}>
                    <View className='items-center pb-5'>
                    <Image source={item.icone} className='size-6' tintColor={item.active ?'#169137':'#B0B3B2'} />
                    </View>
                    <View className='flex-row  justify-between items-center border-neutral-200 flex-1 pb-5' style={{borderBottomWidth: i < (params.length - 1) ? 1 : 0}}>

                      <Text className='font-medium text-[15px]'>{item.title}</Text>

                       <Switch 
                        trackColor={{false: '#e5e5e5', true: '#169137' }}
                        thumbColor={'#ffffff'}
                        value={item.active} 
                        onValueChange={item.onPress}
                        style={{transform: [{scaleX: 1.2},{scaleY: 1.2}]}}
                        />

                    </View>

                  </View>
                ))
              }
            </View>
        </View>
        <CustomButton titre='Enregistrer les modifications' disabled={true} />
      </View>
    </SafeAreaView>
  )
}

export default Notification