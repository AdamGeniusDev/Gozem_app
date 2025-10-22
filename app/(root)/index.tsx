import {FlatList, Image, Pressable, Text, View } from "react-native";
import { useEffect} from "react";
import { footer, images, onboarding, services } from "@/constants";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import ServiceModal from "@/components/ServiceModal";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import ServiceCard from "@/components/ServiceCard";
import useLocationStore from "@/store/location.store";
import { useUserStore } from "@/store/user.store";
import { useTranslation } from "react-i18next";
import { Redirect } from "expo-router";
import useNotificationStore from "@/store/notification.store";

export default function Index() {
  const {t}= useTranslation();
  const { isLoaded,getToken, userId, isSignedIn } = useAuth();
  const avatar = useUserStore(state => state.avatar);
  const loadUser = useUserStore(state => state.loadUser);
  const {getAll} = useLocationStore();
  const {initialize} = useNotificationStore();
  const {requestPermission} = useNotificationStore();

  const number = 0;

   useEffect(() => {
    if (!isLoaded || !userId) return;
    loadUser(getToken, userId);
  }, [userId, isLoaded]);

 useEffect(()=>{
  getAll();  
 },[getAll]);

 useEffect (() => {
  requestPermission();
  initialize();
 },[initialize,requestPermission]);

 if(!isSignedIn) return <Redirect href='/' />

 

  return (
    <Animated.View
    entering={SlideInRight.duration(200)}
    exiting={SlideOutLeft.duration(200)}
    style={{flex: 1}}
    >

    <SafeAreaView  edges={['top', 'left', 'right']}   className="flex-1 bg-white">

    <View className='w-full h-full'>
      <View className='home_header' style={{zIndex:100}}>
        <Image source={avatar ? avatar :images.utilisateur} className='w-12 h-12 rounded-full' resizeMode="cover" resizeMethod="resize" fadeDuration={0}/>
      <View className='flex items-center justify-center' style={{width: 125,height:50}}>
        <Image source={images.gozem} className='w-full h-full' resizeMode="contain" />
      </View>
      <View className='rounded-full bg-white w-14 h-14 flex items-center justify-center' style={{elevation: 5}}>
        <Image source={images.cloche} className='size-7' resizeMode="contain"/>
        {
          !!number && <View className='home_notif'>
            <Text className='font-medium text-white text-[10px] text-center'>{number}</Text>
          </View>
        }
      </View>
      </View>

      <FlatList
      numColumns={4}
      data={services}
      className='flex-1'
      keyExtractor={(item)=>String(item.id)}
      renderItem={({item})=>(
        <ServiceModal data={item}/>
      )}
      columnWrapperStyle={{justifyContent: 'space-between', paddingHorizontal:10}}
      contentContainerStyle={{paddingTop: 10,rowGap:16}}
      ListHeaderComponent={()=>{
        return(
          <View className='px-5 w-full mb-5'>
          <View className='w-full' style={{height: 180,marginTop: 80, marginBottom: 20}}>
            <Image source={onboarding.image} className='h-full w-full rounded-lg' resizeMode='cover' />
          </View>
          <View className='w-full rounded-lg mt-3' style={{
            height: 80,
            overflow:'hidden'}}>
            <Image source={images.porgozem} className='w-full h-full' resizeMode="cover" resizeMethod="resize"/>
            <View className="w-full absolute px-5 py-3 flex-row justify-between items-center">
              <View>
                <View className='flex-row gap-2 items-center'>
                  <Image source={images.portefeuille} className='w-[15px] h-[15px]' resizeMode='contain' tintColor={'#FFFFFF'}/>
                  <Text className='text-white font-regular text-[12px]'>{t('home.walletTitle')}</Text>
                </View>
                <Text className='font-poppins-bold text-[22px] text-white'>0<Text className='ml-3 text-[18px]'>F</Text></Text>
              </View>
              <Pressable className='w-[45px] h-[45px] rounded-full bg-white items-center justify-center'>
                  <Image source={images.plus} style={{width: '60%',height:'60%'}}/>
              </Pressable>
            </View>
          </View>

          </View>
        )
      }}
      ListFooterComponent={()=>{
        return (
          <View className='pl-3 py-5 mt-5'
          style={{
            backgroundColor: '#dc2626',
            height: 360
          }}
          >
              <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              className='font-poppins-bold text-white text-[20px]'>{t('home.freeDeliveryTitle')}</Text>
              <Text className='font-regular text-white text-[14px]'>{t('home.freeDeliverySubtitle')}</Text>

              <FlatList
              data={footer}
              className='flex-1'
              showsHorizontalScrollIndicator={false}
              horizontal
              keyExtractor={(item)=>String(item.id)}
              contentContainerStyle={{paddingTop:15,paddingBottom: 10,columnGap:16,paddingRight: 10}}
              renderItem={({item}) => (
                <ServiceCard data={item}/>
              )}
               />
          </View>
        )
      }}
       />      
      </View>
    </SafeAreaView>
    </Animated.View>

  );
}
