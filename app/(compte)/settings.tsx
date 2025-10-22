import { View, Text, Pressable, ImageSourcePropType, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { router } from 'expo-router';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useRef, useState } from 'react';
import CustomButton from '@/components/CustomButton';
import { account } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { useClerk } from '@clerk/clerk-expo';
import { useTranslation } from 'react-i18next'; 

type MainSettings = {
  title: string,
  icone: ImageSourcePropType,
  onPress: () => void
}

const Settings = () => {

  const { t } = useTranslation(); 

  const modalRef = useRef<BottomSheetModal>(null);
  const { logout } = useAuthStore();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const mainSettings: MainSettings[] = [
    {
      title: t('settings.language'),
      icone: images.langue,
      onPress: () => router.push('/(settings)/langue'),
    },
    {
      title: t('settings.notifications'),
      icone: images.cloche,
      onPress: () => router.push('/(settings)/notification'),
    },
    {
      title: t('settings.updatePassword'),
      icone: images.cadenas,
      onPress: () => router.push('/(settings)/updatePassword'),
    }
  ];

  const logoutUser = async () => {
    try {
      setLoading(true);

      await logout();
      await signOut();
      await account.deleteSession('current').catch(() => {});

      router.replace('/(auth)/sign');
    } catch (e) {
      console.log('Erreur de déconnexion:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className='bg-white flex-1'>
      <View className='px-5'>
        <View className='bg-white flex-row gap-x-5 items-center' style={{ marginTop: 25 }}>
          <Pressable onPress={() => router.back()} hitSlop={15}>
            <Image source={images.back} className='size-5' resizeMode='contain' />
          </Pressable>
          <Text className='font-semibold text-[16px]'>{t('settings.title')}</Text>
        </View>

        <View className='bg-white' style={{ marginTop: 25, paddingBottom: 25 }}>
          {mainSettings.map((item, i) => (
            <Pressable
              key={item.title}
              onPress={item.onPress}
              className='flex-row gap-x-5 items-center'
              style={{ height: 70 }}
            >
              <Image source={item.icone} style={{ height: 25, width: 25 }} resizeMode='contain' tintColor={'#B0B3B2'} />
              <View
                className='flex-row justify-between items-center flex-1 border-neutral-100'
                style={{ borderBottomWidth: i === (mainSettings.length - 1) ? 0 : 1, height: 70 }}
              >
                <Text className='font-regular text-[16px]'>{item.title}</Text>
                <Image source={images.droite} style={{ height: 15, width: 15 }} resizeMode='contain' tintColor={'#B0B3B2'} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View className='bg-neutral-100' style={{ height: 90 }}>
        <Pressable
          className='bg-white mt-3 px-5 flex-row gap-x-3 items-center rounded-lg'
          style={{ height: 70 }}
          onPress={() => modalRef.current?.present()}
        >
          <Image source={images.logout} style={{ height: 30, width: 30 }} resizeMode='contain' tintColor={'#B0B3B2'} />
          <Text className='font-regular text-[16px]'>{t('settings.logout')}</Text>
        </Pressable>
      </View>

      <Pressable
        className='flex-row px-5 gap-x-4 items-center'
        style={{ paddingTop: 20 }}
        hitSlop={12}
        onPress={() => router.push('/(settings)/deleteAccount')}
      >
        <Image source={images.deleted} style={{ height: 25, width: 25 }} resizeMode='contain' tintColor={'#B0B3B2'} />
        <Text className='text-[16px] font-regular'>{t('settings.deleteAccount')}</Text>
      </Pressable>

      <BottomSheetModal
        ref={modalRef}
        snapPoints={['30%']}
        enableContentPanningGesture={false}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        handleComponent={() => {
          return (
            <Pressable onPress={() => modalRef.current?.dismiss()} hitSlop={15}>
              <Image
                source={images.close}
                className="h-[40] w-[40] absolute right-3 top-[-50] z-10"
                resizeMode='contain'
              />
            </Pressable>
          );
        }}
      >
        <BottomSheetView className='flex-1 px-5 py-5'>
          <View className='justify-center items-center flex-1 gap-y-3 flex-col'>
            <Text className='font-poppins-bold text-center text-[20px]'>{t('settings.logoutTitle')}</Text>
            <Text className='font-roboto text-[13px] text-center text-neutral-700 mb-3'>
              {t('settings.logoutMessage')}
            </Text>
            {loading ? (
              <CustomButton titre={t('settings.logoutLoading')} disabled={true} />
            ) : (
              <CustomButton titre={t('settings.logoutButton')} disabled={false} onPress={logoutUser} />
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default Settings;
