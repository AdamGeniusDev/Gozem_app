import { View, Text, Pressable, Image, ImageSourcePropType, TextInput, Keyboard, Alert, ActivityIndicator } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { formatAppwriteDate } from '@/utils/date'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import CustomButton from '@/components/CustomButton'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import DatePicker from 'react-native-date-picker'
import { Asset, launchImageLibrary } from 'react-native-image-picker'
import { useUserStore } from '@/store/user.store'
import { useTranslation } from 'react-i18next'

type FieldKey = "firstname" | "name" | "email" | "gender" | "date" | "validDate";

type InfoProps = {
    title: string,
    field: FieldKey,
    icon: ImageSourcePropType,
    value: string,
    onOpen?: () => void,
    onClose?: () => void,
}




const Profil = () => {

  const {t,i18n} = useTranslation();

  const GENRE = [
  { key: 'male', label: t('profile.genders.male') },
  { key: 'female', label: t('profile.genders.female') },
];

  type Genre = 'male' | 'female' | '';
  type FormState = {
  name: string,
  firstname: string,
  gender: Genre,
  validDate: string,
 }


  const [form, setForm] = useState<FormState>({
    name: '',
    firstname: '',
    gender: '',
    validDate: '',
  })

  const { isLoaded, userId, getToken } = useAuth();
  
  // ✅ Remplacer les states locaux par le store
  const user = useUserStore(state => state.user);
  const avatar = useUserStore(state => state.avatar);
  const loadUser = useUserStore(state => state.loadUser);
  const updateUser = useUserStore(state => state.updateUser);
  const updateAvatar = useUserStore(state => state.updateAvatar);
  
  const [loading, setLoading] = useState(false);

  const date = formatAppwriteDate(user?.$createdAt);
  const userDate = formatAppwriteDate(user?.date);

  const nameRef = useRef<BottomSheetModal>(null);
  const firstNameRef = useRef<BottomSheetModal>(null);
  const genderModalRef = useRef<BottomSheetModal>(null);
  const dateRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);

  const [genre, setGenre] = useState<Genre>('');
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [image, setImage] = useState<Asset | null>(null);

  const selectionPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
      includeBase64: false,
    })
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Erreur', result.errorMessage ?? result.errorCode);
      return;
    }
    if (result.assets) {
      setImage(result.assets[0] ?? null);
    };
  }

  const Component = ({ item, selected, onPress }: { item: { key: string; label: string }; selected: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 h-[65]"
    hitSlop={10}
  >
    <Image
      source={item.key === 'male' ? images.homme : images.femme}
      className='h-[20] w-[20] absolute left-3'
      style={{ tintColor: '#B0B3B2' }}
    />
    <Text className="text-[16px] font-regular px-6">{item.label}</Text>
    <Image
      source={!selected ? images.cocher : images.checked}
      className='h-[24] w-[24]'
      style={{ tintColor: selected ? '#169137' : '#B0B3B2' }}
    />
  </Pressable>
);


  const openModalGenre = () => {
    const current = (form.gender || (user?.gender as Genre) || '') as Genre
    setGenre(current);
    genderModalRef.current?.present();
  }
  const openModalDate = () => {
    const current = form.validDate || user?.date;
    setTempDate(current ? new Date(current) : new Date());
    dateRef.current?.present();
  }
  const openModalName = () => {
    const current = (form.name || user?.name) as string;
    setForm((prev) => ({ ...prev, name: current }));
    nameRef.current?.present();
  }
  const openModalFirstname = () => {
    const current = (form.firstname || user?.firstname) as string;
    setForm((prev) => ({ ...prev, firstname: current }));
    firstNameRef.current?.present();
  }

  const sourceImage = useMemo((): ImageSourcePropType => {
    if (image?.uri) return { uri: image.uri };
    if (avatar?.uri) return { uri: avatar.uri };
    return images.utilisateur;
  }, [image?.uri, avatar?.uri]);

  const closeModalName = () => {
    Keyboard.dismiss();
    nameRef.current?.dismiss();
  }
  const closeModalFirstName = () => {
    Keyboard.dismiss();
    firstNameRef.current?.dismiss();
  }
  const closeGenderModal = () => {
    Keyboard.dismiss()
    genderModalRef.current?.dismiss();
    setTimeout(() => {
      setGenre('');
    }, 0);
  };
  const closeDateModal = () => {
    dateRef.current?.dismiss();
    setTimeout(() => {
      setTempDate(new Date());
    }, 0);
  };

  const handleInputFocusName = () => {
    setTimeout(() => {
      nameRef.current?.snapToIndex(1);
    }, 100);
  };
  const handleInputFocusFName = () => {
    setTimeout(() => {
      firstNameRef.current?.snapToIndex(1);
    }, 100);
  };

  const validateName = () => {
    return form.name.trim() === (user?.name ?? '');
  }
  const validateGender = () => {
    return (genre || (user?.gender ?? '')) === (user?.gender ?? '');
  };
  const validateFirstName = () => {
    return form.firstname.trim() === (user?.firstname ?? '');
  }
  const validateDate = (selectedDate: Date) => {
    const today = new Date();
    if (selectedDate > today) return true;
    const current = form.validDate || user?.date || '';
    if (!current) return false;
    return new Date(current).toDateString() === selectedDate.toDateString();
  }
  const validInfo = () => {
    const sameName = (form.name.trim() || user?.name || '') === (user?.name || '');
    const sameFirst = (form.firstname.trim() || user?.firstname || '') === (user?.firstname || '');
    const sameGender = (form.gender || user?.gender || '') === (user?.gender || '');

    const formDateForCompare = form.validDate || user?.date || '';
    const userDateForCompare = user?.date || '';
    const sameDate = (() => {
      if (!formDateForCompare && !userDateForCompare) return true;
      if (!formDateForCompare || !userDateForCompare) return false;
      return new Date(formDateForCompare).toDateString() === new Date(userDateForCompare).toDateString();
    })();

    const sameAvatar = !image || (image.uri === avatar?.uri);

    return sameName && sameFirst && sameGender && sameDate && sameAvatar;
  };

  const saveGender = () => {
  setForm(prev => ({ ...prev, gender: genre }))
  closeGenderModal()
  }
  const saveDate = () => {
    setForm(prev => ({ ...prev, validDate: tempDate.toISOString() }))
    closeDateModal()
  }

  const disabledEmail = (item: any) => {
    return item.field === 'email';
  }

  // ✅ Fonction de sauvegarde avec le store Zustand
  const saveModifications = async () => {
  if (!isLoaded || !userId) return;
  
  try {
    setLoading(true);

    await updateUser(getToken, userId, {name: form.name.trim() || user?.name,
        firstname: form.firstname.trim() || user?.firstname,
        gender: form.gender || user?.gender,
        date: form.validDate || user?.date,});

    if (image?.uri && image.uri !== avatar?.uri) {
      useUserStore.setState({ 
        avatar: { uri: image.uri } 
      });

      
      updateAvatar(getToken, userId, image.uri).catch(() => {
        loadUser(getToken, userId);
      });
    }

    setForm({ name: '', firstname: '', gender: '', validDate: '' });
    setImage(null);
    router.back(); 

  } catch (e: any) {
    Alert.alert(t('profile.errors.title'), t('profile.errors.saveFailed'));
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      nameRef.current?.snapToIndex(1);
      firstNameRef.current?.snapToIndex(1);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      nameRef.current?.snapToIndex(0);
      firstNameRef.current?.snapToIndex(0);
    });
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="none"
      />
    ),
    []);

  const info: InfoProps[] = [
    { title: t('profile.fields.lastname'), field: "firstname", icon: images.identite, value: form.firstname || user?.firstname || '', onOpen: openModalFirstname, onClose: closeModalFirstName },
    { title: t('profile.fields.firstname'), field: "name", icon: images.identite, value: form.name || user?.name || "", onOpen: openModalName, onClose: closeModalName },
    { title: t('profile.fields.email'), field: "email", icon: images.email, value: user?.email ?? "" },
    { title: t('profile.fields.gender'), field: "gender", icon: images.genre, value:  form.gender ? t(`profile.genders.${form.gender}`): user?.gender? t(`profile.genders.${user.gender}`): '', onOpen: openModalGenre, onClose: closeGenderModal },
    { title: t('profile.fields.birthday'), field: "date", icon: images.calendrier, value: form.validDate ? formatAppwriteDate(form.validDate) : (userDate ?? ""), onOpen: openModalDate, onClose: closeDateModal },
  ]

  // ✅ Charger les données du store au montage
  useEffect(() => {
    if (!isLoaded || !userId) return;
    loadUser(getToken, userId);
  }, [isLoaded, userId]);

  return (
    <SafeAreaView className='bg-neutral-100 flex-1 w-full'>
      <View >
        <View style={{ overflow: 'hidden', height: 150 }}>
          <Image source={images.modalback} resizeMode='cover' className='w-full h-full' />
          <Pressable className='absolute' style={{ width: 40, height: 40, left: 15, top: 25 }} onPress={() => router.back()}>
            <Image source={images.back} resizeMode='contain' style={{ width: '60%', height: '60%' }} />
          </Pressable>
        </View>

        <View className='flex-row gap-x-4 px-3 bg-white pb-5' style={{ position: 'relative' }}>
          <View>
            <View style={{ width: 110, height: 110, borderRadius: 200, overflow: 'hidden', marginTop: -40, elevation: 5 }}>
              <Image source={sourceImage} resizeMode='cover' style={{ width: '100%', height: '100%' }} />
            </View>
            <Pressable style={{ width: 30, height: 30, position: 'absolute', zIndex: 100, bottom: 10, right: 10, elevation: 5 }} onPress={() => selectionPhoto()}>
              <Image source={images.depart} style={{ width: 40, height: 40 }} resizeMode='contain' />
            </Pressable>
          </View>
          <View className='pt-2 justify-center'>
            <Text className='font-semibold text-[16px]'>{user?.firstname} {user?.name}</Text>
            <Text className='text-neutral-500 text-[11px]'>{t('profile.header.savedOn')}{date}</Text>
          </View>
        </View>

        <ScrollView className='bg-gray-100' contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          rowGap: 15,
        }}>
          {info.map((item, i) => {
            return (
              <View key={i} className='bg-white rounded-lg gap-x-3 px-3 flex-row items-center' style={{ height: 70 }}>
                <Image source={item.icon} className='size-7' resizeMode='contain' tintColor={'#B0B3B2'} />
                <View className='justify-between flex-row flex-1 items-center'>
                  <View>
                    <Text className='text-14px font-regular'>{item.title}</Text>
                    <Text className={`font-semibold text-[14px] ${item.field === 'email' ? 'text-neutral-300' : 'text-black'}`}>{item.value}</Text>
                  </View>
                  <Pressable disabled={disabledEmail(item)} onPress={item.onOpen} hitSlop={12}>
                    <Image source={images.depart} resizeMode='contain' style={{ width: 35, height: 35 }} />
                  </Pressable>
                </View>
              </View>
            )
          })}
        </ScrollView>
        {
          loading ? (
            <View className='px-3'>
              <Pressable className='w-full mb-3 py-2 rounded-full bg-primary-400'>
                <ActivityIndicator size='large' color='white' />
              </Pressable>
            </View>
          ) : <View className='px-3'>
            <CustomButton titre={t('profile.actions.saveChanges')} disabled={validInfo()} onPress={saveModifications} />
          </View>
        }

      </View>


      <BottomSheetModal
        ref={nameRef}
        snapPoints={['25%', '60%']}
        index={0}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        backdropComponent={renderBackdrop}
        keyboardBehavior={'extend'}
        keyboardBlurBehavior={'restore'}
        android_keyboardInputMode='adjustResize'
        enableDynamicSizing={false}
        handleComponent={() => {
          return (
            <Pressable onPress={closeModalName} hitSlop={15}>
              <Image source={images.close} className="h-[40] w-[40] absolute right-3 top-[-50] z-10" resizeMode='contain' />
            </Pressable>
          )
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className='flex-1 justify-center items-center gap-y-3 px-5 py-5'>
            <Text className='font-poppins-bold text-[16px]'>{t('profile.modals.editNameTitle')}</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
              style={{ borderWidth: 1, borderColor: 'black', width: '100%', borderRadius: 15, paddingHorizontal: 10, height: 50 }}
              showSoftInputOnFocus={true}
              ref={inputRef}
              onFocus={handleInputFocusName}
            />
            <CustomButton titre={t('profile.modals.validate')} disabled={validateName()} className='w-full' onPress={() => { Keyboard.dismiss(); nameRef.current?.dismiss() }} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>


      <BottomSheetModal
        ref={firstNameRef}
        snapPoints={['25%', '60%']}
        index={0}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        backdropComponent={renderBackdrop}
        keyboardBehavior={'extend'}
        keyboardBlurBehavior={'restore'}
        android_keyboardInputMode='adjustResize'
        enableDynamicSizing={false}
        handleComponent={() => {
          return (
            <Pressable onPress={closeModalFirstName} hitSlop={15}>
              <Image source={images.close} className="h-[40] w-[40] absolute right-3 top-[-50] z-10" resizeMode='contain' />
            </Pressable>
          )
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className='flex-1 justify-center items-center gap-y-3 px-5 py-5'>
            <Text className='font-poppins-bold text-[16px]'>{t('profile.modals.editFirstnameTitle')}</Text>
            <TextInput
              value={form.firstname}
              onChangeText={(value) => setForm({ ...form, firstname: value })}
              style={{ borderWidth: 1, borderColor: 'black', width: '100%', borderRadius: 15, paddingHorizontal: 10, height: 50 }}
              showSoftInputOnFocus={true}
              ref={inputRef}
              onFocus={handleInputFocusFName}
            />
            <CustomButton titre={t('profile.modals.validate')}disabled={validateFirstName()} className='w-full' onPress={() => { Keyboard.dismiss(); firstNameRef.current?.dismiss() }} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>


      <BottomSheetModal
        ref={genderModalRef}
        snapPoints={['35%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableBlurKeyboardOnGesture={false}
        enableHandlePanningGesture={false}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        handleComponent={() => (
          <View>
            <Pressable onPress={closeGenderModal} hitSlop={15}>
              <Image source={images.close} className="w-[40] h-[40] absolute right-3 top-[-50]" />
            </Pressable>
          </View>
        )}
      >
        <BottomSheetView className="py-5 gap-y-3 flex-1 px-3">
          <Text className="font-poppins-bold text-[20px] px-5">{t('profile.modals.genderTitle')}</Text>
        <FlatList
          data={GENRE}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Component
              item={item}
              selected={genre === item.key}
              onPress={() => setGenre(item.key as Genre)}
            />
          )}
          className='border-t border-neutral-200'
        />

          <CustomButton titre={t('profile.modals.validate')} disabled={validateGender()} onPress={saveGender} />
        </BottomSheetView>
      </BottomSheetModal>


      <BottomSheetModal
        ref={dateRef}
        snapPoints={['40%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableBlurKeyboardOnGesture={false}
        enableHandlePanningGesture={false}
        enableContentPanningGesture={false}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        handleComponent={() => (
          <View>
            <Pressable onPress={closeDateModal} hitSlop={15}>
              <Image source={images.close} className="w-[40] h-[40] absolute right-3 top-[-50]" />
            </Pressable>
          </View>
        )}
      >
        <BottomSheetView className="p-5">
          <Text className="font-poppins-bold text-[20px]">{t('profile.modals.birthdayTitle')}</Text>
          <DatePicker
            date={tempDate}
            onDateChange={setTempDate}
            mode='date'
            minimumDate={new Date(1970, 0, 1)}
            maximumDate={new Date()}
            style={{ width: 500, alignSelf: 'center', marginTop: 10 }}
            locale={i18n.language}
          />
          <View className="flex flex-row w-full justify-end items-end mt-5">
            <Pressable onPress={closeDateModal}>
              <Text className='font-poppins-bold text-[15px] text-primary-400'>{t('profile.modals.cancel')}</Text>
            </Pressable>
            <Pressable disabled={validateDate(tempDate)} onPress={saveDate}>
              <Text className={`font-poppins-bold text-[15px] ${!validateDate(tempDate) ? 'text-primary-400' : 'text-neutral-300'}  ml-5`}>{t('profile.modals.ok')}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  )
}

export default Profil
