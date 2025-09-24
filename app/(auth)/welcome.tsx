import React, { useRef, useState } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { Dimensions, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PhoneInput, { ICountry } from 'react-native-international-phone-number'
import { getLocales } from 'expo-localization'
import {  router } from 'expo-router'
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel'
import { welcomedata } from '@/constants'
import { useSharedValue,configureReanimatedLogger, ReanimatedLogLevel  } from 'react-native-reanimated'

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn, // garde les warns/erreurs utiles
  strict: false,                  // ⬅️ désactive le strict mode Reanimated
});

const Welcome = () => {
  const region = (getLocales()[0]?.regionCode || 'BJ') as ICountry['cca2'];
  const [phone,setPhone] = useState('');
  const [country,setCountry]= useState<ICountry | undefined>(undefined);
  const ref= useRef<ICarouselInstance>(null);
  const  {width}= Dimensions.get('window');
  const {height}= Dimensions.get('screen');
  const progress = useSharedValue(0);



  return (
    <SafeAreaView className="flex-1 relative px-2 bg-secondary">

    <Pagination.Basic
      progress={progress}
      data={welcomedata}
      horizontal
      containerStyle={{
        rowGap: 5,
        marginTop: 30,
        
      }}
      dotStyle={{
        width:100,
        backgroundColor: '#8ADA9F',
        height: 3,
        marginStart: 7,
      }}
      activeDotStyle={{
        width: 100,
        backgroundColor: '#169137',
        height: 3,
      }}
       />
 
    <Carousel
    onProgressChange={(_,abs)=>{progress.value=abs}}
    data={welcomedata}
    ref={ref}
    width={width}
    height={height}
    loop
    autoPlayInterval={3000}
    autoPlay
    scrollAnimationDuration={600}
    renderItem={({item})=>(
       <View className="w-full px-5 py-10 h-full gap-3 ">
            <Text className="font-poppins-extra text-primary-400 text-2xl">{item.titre}</Text>
            <Text className="font-roboto text-primary-300">{item.description}</Text>
            <View className="flex justify-center items-center">
              <Image source={item.image} className="w-[200px] h-[200px]" resizeMode='contain'/>
            </View>
          </View>
    )}
    />
      
      
        <BottomSheet 
        index={1}
        snapPoints={['30%']}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        handleIndicatorStyle={{
          width: 50,
          backgroundColor: '#EBEDEC'}}
        >
        <BottomSheetView className="gap-y-2 p-[15px]">
          <Text className="font-poppins-bold text-[20px]">Entrez votre email</Text>
          <Text className="font-regular mb-4 mt-[-3] text-[14px] text-neutral-500">Entrez votre email pour vous connecter ou pour créer un nouveau compte.</Text>

          <PhoneInput 
          value={phone}
          onChangePhoneNumber={setPhone}
          defaultCountry={region}
          selectedCountry={country}
          onChangeSelectedCountry={setCountry}
          placeholder="Entrer votre email"
          onPress={()=> router.push('/(auth)/sign')}
          modalDisabled={true}
          showSoftInputOnFocus={false}
          phoneInputStyles={{
            container:{
              backgroundColor: '#fff',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent:'center',
              width: '100%',
            },           
            caret: {
              color: 'transparent',
              width: 0,
              height: 0,
            },
            divider: {
              width: 0,
              height: 0,
            },
            flag:{
              marginTop: 5,
              display: 'none'
            },
            input:{
              fontFamily: 'Regular',
            },
            flagContainer:{
              rowGap: 2,
              backgroundColor: '#fff',
              width: '35%',
              display: 'none'
            },
            callingCode:{
              marginLeft: -20,
              fontFamily: 'Bold',
              display: 'none'
            }
            
          }}
          />
        </BottomSheetView>
        </BottomSheet>
    </SafeAreaView>
  )
}

export default Welcome;