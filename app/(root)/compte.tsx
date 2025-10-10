import { images } from '@/constants'
import { useUserStore } from '@/store/user.store'
import { useAuth } from '@clerk/clerk-expo'
import { Href, router } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, Text, View, ImageSourcePropType } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

type Params = {
  title: string;
  screen: Href;
  param?: number;
  icon: ImageSourcePropType;
}



const Compte = () => {

  const {t} = useTranslation();
  const params: Params[] = [
  { title: t('account.menu.activityHistory'), screen: '/(root)/activity', param: 1, icon: images.historique },
  { title: t('account.menu.discountCodes'), screen: '/(compte)/reduction', icon: images.reduction },
  { title: t('account.menu.myTickets'), screen: '/(compte)/tickets', icon: images.ticket },
  { title: t('account.menu.referral'), screen: '/(compte)/parrainage', icon: images.parrain },
  { title: t('account.menu.settings'), screen: '/(compte)/settings', icon: images.settings },
]
  const { isLoaded, getToken, userId } = useAuth();
  
  const user = useUserStore(state => state.user);
  const avatar = useUserStore(state => state.avatar);
  const loadUser = useUserStore(state => state.loadUser);

  const handlePress = (item: Params) => {
    if (item.param !== undefined) {
      router.push({
        pathname: item.screen as any,
        params: { initialIndex: String(item.param) },
      } as Href);
    } else {
      router.push(item.screen);
    }
  };

  useEffect(() => {
    if (!isLoaded || !userId) return;
    loadUser(getToken, userId);
  }, [userId, isLoaded]);

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top', 'left', 'right']}>
      <Text className='font-semibold text-[16px] pt-5 px-5'>{t('account.title')}</Text>
      <ScrollView>
        <View className=' bg-neutral-100 mt-8 px-3 py-5 flex-row'>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 100,
            overflow: 'hidden',
            elevation: 5,
          }}>
            <Image 
              source={avatar ? { uri: avatar.uri } : images.utilisateur} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode='cover' 
              fadeDuration={0}
            />
          </View>
          <View className='flex-row justify-between flex-1 items-center'>
            <View style={{ height: 100, marginLeft: 15, justifyContent: 'center' }}>
              <Text className='font-poppins-extra text-[20px]'>{user?.firstname} {user?.name?.charAt(0)}.</Text>
            </View>
            <Pressable onPress={() => router.push('/(compte)/profil')} hitSlop={12}>
              <Image source={images.depart} resizeMode='contain' style={{ width: 50, height: 50 }} />
            </Pressable>
          </View>
        </View>
        <View className='bg-neutral-100 flex-1' style={{ paddingTop: 20, height: '100%' }}>
          {params.map((item, i) => {
            return (
              <Pressable key={i} className='px-5 flex-row gap-x-3 items-center' style={{ height: 70 }} onPress={() => handlePress(item)}>
                <Image source={item.icon} style={{ width: 25, height: 25 }} resizeMode='contain' tintColor={'#B0B3B2'} />
                <View className='flex-row justify-between items-center flex-1 border-neutral-200' style={{ height: '100%', borderBottomWidth: 1 }}>
                  <Text className='font-regular text-[16px] text-neutral-500' >{item.title}</Text>
                  <Image source={images.droite} className='w-5 h-5' resizeMode='contain' tintColor={'#B0B3B2'} />
                </View>
              </Pressable>
            )
          })}
        </View>
        <View className='bg-white px-5 gap-x-3 flex-row flex-1 items-center mt-5' style={{ marginTop: 40 }}>
          <Pressable style={{ width: '45%', alignItems: 'center', justifyContent: 'center' }}>
            <Text className='text-primary-300 text-[14px] text-center' numberOfLines={2}>{t('account.links.terms')}</Text>
          </Pressable>
          <Text className='text-primary-300 text-[25px]'>|</Text>
          <Pressable style={{ width: '50%', alignItems: 'center', justifyContent: 'center' }}>
            <Text className='text-primary-300 text-[14px] text-center' numberOfLines={2}>{t('account.links.communityCharter')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Compte