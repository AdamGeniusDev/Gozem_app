import { images } from '@/constants';
import useLocationStore from '@/store/location.store';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useSegments } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import {  useSafeAreaInsets } from 'react-native-safe-area-context';

const FALLBACK_REGION= {
    latitude: 6.431721,
    longitude: 2.331423,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
} as const;

type MapProps = { children?: React.ReactNode}

const Map = ({children}: MapProps) => {
  const regionFromstate= useLocationStore(s=>s.region);

  const segments = useSegments();
  const heure = segments[1] === 'heure'
  const porto = segments[1]=== 'porto'
  const ouidah = segments[1] === 'ouidah'


  const dimension = useWindowDimensions();
  const height = dimension.height*0.8

  const insets = useSafeAreaInsets();
  const modalRef =useRef<BottomSheet>(null);

  const bottom = insets.top + 5;

  const back = ()=> router.back();

  const snapPoints = useMemo<string[]>(() => {
  if (heure) return ['38%'];                // 1 seul point
  if (porto || ouidah) return ['45%'];                // 1 seul point
  return ['38%', '51%'];                    // 2 points par défaut
}, [heure, porto,ouidah]);
  
const initialIndex= useMemo(()=>{
    if(snapPoints.length ===1) return 0;

    return 1;
},[snapPoints])
  const region = regionFromstate ?? FALLBACK_REGION

  const static_url = `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth`+
  `&width=${dimension.width}&height=${dimension.height}`+
  `&marker=lonlat:${region.longitude},${region.latitude};icontype:awesome;icon:map-marker;size:48;color:%23169137`+
  `&center=lonlat:${region.longitude},${region.latitude}`+
  `&zoom=14.6497`+
  `&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`

  return (
      <View className='flex-1'>
         <Image source={{uri: static_url}} className='w-full' style={{height: height}}/>
            <View className='absolute bg-white h-[50px] w-[50px] rounded-full'
            style={{
              marginTop: bottom,
              left: 15,
              position: 'absolute',
              justifyContent: 'center',
              elevation: 5,
            }}
            >
              <Pressable className='items-center justify-center' onPress={back} hitSlop={15}>
                <Image source={images.back} style={{width: '45%',height: '60%'}} resizeMode='cover'/>
              </Pressable>
         </View>

         <BottomSheet
         ref={modalRef}
         snapPoints={snapPoints}
         index={initialIndex}
         enableDynamicSizing={false}
         enableHandlePanningGesture={false}
         handleIndicatorStyle={{
          width: 60,
          backgroundColor: '#EBEDEC',
         }}
         >
          <BottomSheetView>
            <View>
              {children ?? <Text style={{ color: '#999', padding: 15 }}>Aucun contenu</Text>}
            </View>
          </BottomSheetView>
         </BottomSheet>
         
      </View>
         
  )
}

export default Map