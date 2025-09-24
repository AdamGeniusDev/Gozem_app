import { View, Text, ImageSourcePropType, Image } from 'react-native'
import React from 'react'
import { images } from '@/constants'

type ServiceCardProps = {
  id: number,
  nom: string,
  livraison: number,
  specialite: string,
  note?: number ,
  nbr?: number,
  delai: string,
  image: ImageSourcePropType,
}
const ServiceCard = ({data}: {data:ServiceCardProps}) => {
  return (
    <View style={{width: 250, columnGap:2,overflow: 'hidden',elevation: 5}} className='bg-white rounded-lg' >
      <Image source={data.image} className='w-full' resizeMode='cover' style={{height: '60%'}}/>
      <View className='px-3 py-2 bg-white w-full' style={{borderBottomLeftRadius:30,borderBottomRightRadius:30}}>
          <View className='absolute rounded-lg w-[80px] h-[45px] items-center justify-center bg-white right-3 top-[-20]' style={{zIndex: 100,backgroundColor: 'white',elevation:3}}>
            <Text className='font-bold text-neutral-800'>{data.delai}</Text>
            <Text className='font-regular text-neutral-600 text-[12px] mt-[-5]'>mins</Text>
          </View>
      <Text className='font-poppins-bold'>{data.nom}</Text>
      <View className='flex-row gap-2'>
        {
          data.nbr && (<View className='flex-row items-center justify-center'>
            <Image source={images.etoile} className='w-4 h-4 mt-[-5]' resizeMode='contain' tintColor={'#404040'}/>
            <Text className='font-poppins-bold text-neutral-700'> {data.note}</Text>
            <Text className='font-poppins-bold text-neutral-700'> ({data.nbr}) •</Text>
          </View>
           )
        }
        <Text className='font-regular text-[12px] text-neutral-500'>Livraison :</Text>
        <Text className='font-bold'>{data.livraison} F</Text>
      </View>
      <View >
        <Text numberOfLines={1} ellipsizeMode='tail' className=' self-start bg-neutral-100 px-2 py-[2px] rounded-full text-neutral-500 font-regular text-[12px]'>{data.specialite.split(',').join(' • ')}</Text>
      </View>
    </View>
    </View>
  )
}

export default ServiceCard;