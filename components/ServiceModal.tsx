import { View, Text, ImageSourcePropType, Image, Pressable } from 'react-native'
import React, { useCallback, useRef } from 'react'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { images } from '@/constants'
import { Href,router } from 'expo-router'

type Operation = {
    text: string,
    icone: ImageSourcePropType,
}
type ServiceKey = 'zem' | 'tricycle' | 'voiture' | 'eco' | 'prestige' | 'porto' | 'heure' | 'evenement' |  'ouidah'
type Data = {
    id: number,
    title: string,
    nop: number,
    operation: Operation[],
    image: ImageSourcePropType,
    link?: ServiceKey,
  }
  
  const ServiceModal = ({data}: {data:Data}) => {
    const snapPoints = data.nop>2 ? ['65%'] : ['45%'];

    const SERVICE_PATH : Record<ServiceKey,Href> = {
      zem: '/(services)/zem',
      tricycle: '/(services)/tricycle',
      voiture: '/(services)/voiture',
      eco: '/(services)/eco',
      porto: '/(services)/porto',
      prestige: '/(services)/prestige',
      heure: '/(services)/heure',
      evenement: '/(services)/evenement',
      ouidah: '/(services)/ouidah',
    }
    
    const modalRef = useRef<BottomSheetModal>(null);

    const openModal = () =>{
      modalRef.current?.present();
    }
    const closeModal =() => {
      modalRef.current?.dismiss();
    }
    const renderBackdrop = useCallback(
      (props:any) => (
        <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={'none'}
        />
      )
    ,[])

    const onPress = ()=>{

      if(data.nop > 0) openModal();

      if(data.link) {
        router.push(SERVICE_PATH[data.link]);
      }
    }

  return (
    <View>
    <Pressable className='items-center' style={{flex:1,gap:6}} onPress={onPress}>
        <View className='bg-neutral-100 rounded-full items-center justify-center'style={{width:65,height:65}}>
            <Image source={data.image} style={{width:'60%',height:'60%'}}resizeMode='contain' resizeMethod='resize'/>
        </View>
        <Text className='font-regular text-[12px] text-neutral-500 text-center' 
        numberOfLines={2}
        ellipsizeMode='tail'
        style={{
          width: 80,
        }}
        >{data.title}</Text>
    </Pressable>
        
    <BottomSheetModal
     ref={modalRef} 
     snapPoints={snapPoints}
     enableDynamicSizing={false}
     enablePanDownToClose={false}
     enableContentPanningGesture={false}
     enableHandlePanningGesture={false}
     backdropComponent={renderBackdrop}
     handleComponent={()=>null}
     >
      <BottomSheetView className='flex-1'>
        <View className="h-[110px]" style={{flex:1,borderTopLeftRadius: 24,borderTopRightRadius:24,overflow:'hidden'}}>
          <Image source={images.modalback} className='w-full h-full'/>
          <View className='p-5  w-full flex-row items-center justify-between absolute' style={{paddingRight: 35}}>
          <View>
            <Text className="font-poppins-bold text-[16px] text-black">{data.title}</Text>
           <Text className="font-regular text-[14px] text-neutral-600">{data.nop} rubriques</Text>
          </View>
          <Image source={data.image} className='w-[55] h-[55] mt-3'/>
          </View>
          
        </View>
        {data.operation.slice(0,data.nop).map((item, i) => {
          return (
            <View key={i} style={{
              paddingRight: 15,
              paddingLeft: 15,
            }}>
              <View className='h-[75px] flex-row items-center justify-between border-neutral-200' style={{borderBottomWidth: 1}}>
              <View className='flex-row gap-3 items-center'>
                <Image source={item.icone} className='w-[25px] h-[25px]' resizeMode='contain'/>
              <Text>{item.text}</Text>
              </View>      
              <Image source={images.droite} className='w-[10px] h-[10px]' tintColor={'#B0B3B2'}/>       
            </View>
            </View>
          )
        })}
        <View style={{
          paddingLeft: 15,
          paddingRight: 15,
        }}>
          <Pressable className='mt-5 py-2 w-full items-center justify-center border-primary-400 border-2 rounded-full'onPress={closeModal}>
          <Text className='text-primary-300 font-bold'>Fermer</Text>
        </Pressable>
        </View>
        
        </BottomSheetView>
      </BottomSheetModal>
    </View>
    
  )
}

export default ServiceModal