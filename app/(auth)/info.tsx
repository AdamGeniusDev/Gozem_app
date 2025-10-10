import { View,Pressable, Image, KeyboardAvoidingView, Platform, Text,  FlatList, Keyboard, Alert } from 'react-native'
import React, {  useCallback, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router } from 'expo-router'
import CustomInput from '@/components/CustomInput'
import  { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import DatePicker from 'react-native-date-picker'
import CustomButton from '@/components/CustomButton'
import {Asset, launchImageLibrary} from 'react-native-image-picker'
import { useAuth, useClerk, useSignUp } from '@clerk/clerk-expo'
import useAuthStore from '@/store/auth.store'
import { useTranslation } from 'react-i18next'


const Info = () => {

    const {t} = useTranslation();
    
    const [form,setForm] = useState({name:'',firstname: ''});
    const {name,firstname} = form;
    const GENRE = ['male','female'] as const;
    type Genre=(typeof GENRE)[number] | '';
    const snapPoints = ['30%'];
    const genreRef=useRef<BottomSheetModal>(null);
    const [genre,setGenre] = useState<Genre>('');
    const dateRef=useRef<BottomSheetModal>(null)
    const noon = (d: Date) => { const x = new Date(d); x.setHours(12,0,0,0); return x; };
    const [validDate,setValidDate] = useState<Date | null>(null)
    const [tempDate,setTempDate]= useState(noon(new Date(2000,0,1)))
    const [image,setImage] = useState<Asset | null>(null);
    const selectionPhoto = async()=>{
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
            includeBase64: false,
        })
        if(result.didCancel) return;
        if(result.errorCode){
            Alert.alert(t('info.error.title'),result.errorMessage ?? result.errorCode);
            return;
        }
        if(result.assets){
            setImage(result.assets[0] ?? null);
        };

    }
    const sameDate = (a:Date,b:Date)=>{
        return a.getFullYear()=== b.getFullYear() &&
               a.getMonth() === b.getMonth() &&
               a.getDate() === b.getDate();
    }
    const disabledDate= (dat?: Date)=>{
      const current = noon(new Date());
      const minDate = noon(new Date(1970,0,1))
      if(!dat) return true;
        return noon(dat)< minDate || noon(dat)> current || sameDate(dat,current);    
    }

    const validateDate = ()=>{
        setValidDate(tempDate);
        dateRef.current?.dismiss()
    }

     const afficherDate= (d?: Date | null) =>{
        return d?.toLocaleDateString('fr-FR',{day: '2-digit', month:'long', year: 'numeric'})
     }

    const Component = ({ label, selected, onPress }: { label: (typeof GENRE)[number]; selected: boolean; onPress: () => void }) =>(
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 h-[65]"
      hitSlop={10}
    >
    <Image source={label === 'male' ? images.homme: images.femme} className='h-[20] w-[20] absolute left-3' style={{tintColor: '#B0B3B2'}}/>
      <Text className="text-[16px] font-regular px-6">{label === 'male' ? t('info.genderSheet.male') : t('info.genderSheet.female')}</Text>
      <Image 
      source={!selected? images.cocher : images.checked} 
      className='h-[24] w-[24]' 
        style={{tintColor: selected? '#169137' : '#B0B3B2'}}
      />
    </Pressable>
    );
    const closeGenre = ()=>{
        genreRef.current?.dismiss()
    }
    const closeDate=()=>{
        setTempDate(new Date(2000,0,1))
        dateRef.current?.dismiss();
    }
    const openGenre= ()=>{
        Keyboard.dismiss();
        genreRef.current?.present()
    }
    const openDate = ()=>{
        Keyboard.dismiss();
        setTempDate(noon(validDate ?? tempDate))
        dateRef.current?.present()
    }
    const validSubmit = () => form.name.trim().length > 2 && form.firstname.trim().length > 0 && !!genre && !!validDate;


    const {getToken} = useAuth();
    const {setActive} = useClerk();
    const {isLoaded,signUp} = useSignUp();
    const {finalizeCreation,isLoading,error,getInfo,reset,activateSessionAndPassword} = useAuthStore();

    const submit = async()=>{
        const can = form.name.trim().length>0 && form.firstname.trim().length>0 && !!genre && !!validDate;
        console.log('[INFO] submit()', {
        canSubmit: can,
        name: form.name,
        firstname: form.firstname,
        genre,
        dateISO: validDate?.toISOString?.(),
        hasImage: !!image?.uri
        });
        if (!can) return;

        if(!isLoaded) return null;

        const {userId: clerkUid}= await activateSessionAndPassword({
        setActive,
        finalizeSignUp: async (password) => {
          await signUp.update({password: password});
          const done = await signUp?.reload?.();

          if (done?.status !== 'complete' || !done?.createdSessionId) {
            throw new Error('Inscription non terminée (Champ manquant ou contrainte mdp).');
          }

          return {
            sessionId: done.createdSessionId,
            userId: done.createdUserId as string
          };
        }

      });

        getInfo({name:form.name,firstname:form.firstname,gender: genre,date: validDate,avatar:image?.uri?? null})
        if(!clerkUid) return;
        const docId = await finalizeCreation({getToken,clerkUserId: clerkUid});
        if(!docId) return;
        reset() 
        router.replace('/')
    }



    const renderBackdrop= useCallback((props:any)=>(
        <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={'none'}
        />
    ),[]);
  return (
    <SafeAreaView className="flex-1 bg-white">
        <View className="flex flex-row w-full mx-3 h-[50]">
                <Pressable onPress={()=>router.back()}>
                  <Image source={images.back} className="w-[24]" resizeMode='contain'/>
                </Pressable>
        </View>
        <KeyboardAvoidingView
        className="flex-1 bg-secondary-100 justify-between items-center p-5"
        behavior={Platform.OS === 'ios'? 'padding':'height'}
        >
            <View className="gap-y-3">
                <Text className="font-poppins-bold text-[20px]">{t('info.title')}</Text>
                 <Text className="font-regular mb-4 mt-[-3] text-[14px] text-neutral-500">{t('info.subtitle')}   
                </Text>
                <CustomInput
                placeholder={t('info.placeholders.name')}
                image={images.identite} 
                value={name}
                onChangeText={(value)=>setForm({...form,name:value})}
                 />
                 <CustomInput
                placeholder={t('info.placeholders.firstname')}
                image={images.identite} 
                value={firstname}
                onChangeText={(value)=>setForm({...form,firstname:value})}
                 />

                 <Pressable onPress={openGenre}>
                 <CustomInput
                 editable={false}
                 placeholder={t('info.placeholders.gender')}
                 image={images.genre} 
                 icon={images.droite}
                 // display translated label while keeping genre key in state
                 value={genre ? (genre === 'male' ? t('info.genderSheet.male') : t('info.genderSheet.female')) : ''}
                 />
                 </Pressable>

                 <Pressable onPress={openDate}>
                 <CustomInput
                 editable={false}
                 placeholder={t('info.placeholders.birthdate')}
                 image={images.genre} 
                 icon={images.droite}
                 value={afficherDate(validDate)}
                 />
                 </Pressable>

                 <Pressable className="flex gap-4 p-4 flex-row bg-secondary-200 border-2 border-neutral-300 border-dashed h-[80] rounded-lg items-center" onPress={selectionPhoto}>
                    <Image source={image?.uri ? {uri:image.uri} : images.utilisateur} className='h-[50] w-[50]' style ={{
                        width: image? 50: 50,
                        height: image? 50:50,
                        borderRadius: 50,
                    }} />
                    <View className="flex flex-col gap-1.5 h-full justify-center">
                        <Text className='font-medium text-neutral-400 text-[14px]'>{t('info.avatar.add')}</Text>
                        <Text className='font-poppins-bold text-primary-300 text-[14px]'>{t('info.avatar.label')}</Text>
                    </View>
                    <Image source={images.droite} className='h-[12] w-[12] absolute right-3' style={{tintColor: '#B0B3B2'}}/>
                 </Pressable>
             
            </View>
            {error? <Text className="text-red-600 text-[10px]">{t('info.error.generic')}{error}</Text>: null}
            {
                isLoading? (
            <CustomButton titre={t('info.button.loading')} disabled={true}/>
                ):
            <CustomButton  titre={t('info.button.submit')} disabled={!validSubmit()} onPress={submit}/>
            }

            <BottomSheetModal
            ref={genreRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            enableBlurKeyboardOnGesture={false}
            enableHandlePanningGesture={false}
            handleIndicatorStyle={{backgroundColor: 'transparent'}}
            handleComponent={()=>(

                <View>
                    <Pressable onPress={closeGenre} hitSlop={15}>
                        <Image source={images.close} className="w-[40] h-[40] absolute right-3 top-[-50]"/>
                    </Pressable>
                </View>
            )}
            >
                <BottomSheetView className="py-5 gap-y-3">
                    <Text className="font-poppins-bold text-[20px] px-5">{t('info.genderSheet.title')}</Text>
                        <FlatList
                        data={GENRE}
                        keyExtractor={(item)=>item}
                        renderItem={({item})=>{
                            return(
                                <Component 
                                label={item}
                                selected={genre=== item}
                                onPress={()=>{
                                    setGenre(item);
                                    closeGenre();
                                }}
                                />
                            )
                        }
                        }
                        className='border-t border-neutral-200'
                         />
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
            handleIndicatorStyle={{backgroundColor: 'transparent'}}
             handleComponent={()=>(

                <View>
                    <Pressable onPress={closeDate} hitSlop={15}>
                        <Image source={images.close} className="w-[40] h-[40] absolute right-3 top-[-50]"/>
                    </Pressable>
                </View>
            )}
            >
                <BottomSheetView className="p-5">
                    <Text className="font-poppins-bold text-[20px]">{t('info.dateSheet.title')}</Text>
                    <DatePicker
                        date={tempDate}
                        onDateChange={setTempDate}
                        mode='date'
                        minimumDate={new Date(1970,0,1)}
                        maximumDate={new Date()}
                        style={{
                            width: 500,
                            alignSelf:'center',
                            marginTop: 10,
                        }}
                         />
                         <View className="flex flex-row w-full justify-end items-end mt-5">
                            <Pressable onPress={closeDate}>
                                <Text className='font-poppins-bold text-[15px] text-primary-400'>{t('info.dateSheet.cancel')}</Text>
                            </Pressable>
                            <Pressable disabled={disabledDate(tempDate)} onPress={validateDate} >
                                <Text className={`font-poppins-bold text-[15px] ${!disabledDate(tempDate)? 'text-primary-400': 'text-neutral-300'}  ml-5`}>{t('info.dateSheet.ok')}</Text>
                            </Pressable>
                         </View>
                </BottomSheetView>
            </BottomSheetModal>
        </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Info
