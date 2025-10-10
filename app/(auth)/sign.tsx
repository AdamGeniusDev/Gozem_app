import { View,Pressable, Image, Text, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator} from 'react-native'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { images, loaders } from '@/constants'
import { router } from 'expo-router'
import CustomButton from '@/components/CustomButton'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import CustomInput from '@/components/CustomInput'
//cette installation n'est pas simple npm i validator ne marche il faudra utiliser  npm i -D @types/validator pour le bon fonctionnement 
import validator from 'validator'
import { useAuth, useSignUp } from '@clerk/clerk-expo'
import useAuthStore from '@/store/auth.store'
import LottieView from 'lottie-react-native'
import { useTranslation } from 'react-i18next'


const Sign = () => {

  const {t} = useTranslation();

  const [email,setEmail] = useState('');

  const insets= useSafeAreaInsets();
  const keyboardOffset = insets.bottom + 5;
   const isEmailInvalid= !validator.isEmail(email);

  const bottomRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(()=>['25%'],[]);

  const openSheet = ()=> {
    Keyboard.dismiss();
    bottomRef.current?.present();
  }
  const closeSheet = () =>{
    bottomRef.current?.dismiss();
  }
const renderBackdrop = useCallback(
  (props:any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="none"      // ne ferme pas en touchant l’arrière-plan
    />
  ),
  []);

  const {isLoaded,signUp} = useSignUp();
  const {isSignedIn} = useAuth();
  const navigatedRef = useRef(false);

  const safeReplace = (href: any) => {
  if (navigatedRef.current) return;
  navigatedRef.current = true;
  router.replace(href);
};


  const {isLoading,sendOtp,error,setIsLoading,setError,setEmail:setEmailStore} = useAuthStore();

  const decide = async()=> {

    if(!isLoaded || !signUp) return;
    const normalized = email.trim().toLowerCase();

    setIsLoading(true);
    setError(undefined);
    try {
      if(isSignedIn){
        setEmailStore(normalized)
        safeReplace('/');
        return
      }
      
      await signUp.create({emailAddress: normalized})
      setEmailStore(normalized)
      openSheet()
    }catch(e:any){
      const msg = e?.message ?? 'Erreur inconnue'
      console.log('info',msg)
      const text = `${msg}`.toLowerCase();

      if(text.includes('already signed in') || text.includes('session_exists')){
        setEmailStore(normalized)
        setError(undefined)
        useAuthStore.getState().setIsAuthenticated(true);
        safeReplace('/')
        return;
      }
      if(text.includes('email address is taken') || text.includes('is taken') || text.includes('already exists')){
        setEmailStore(normalized);
        safeReplace('/(auth)/signIn')
      }
      setError(e?.message ?? 'Erreur inconnue')
    }finally{
      setIsLoading(false)
    }
  }


  const onSend = async()=>{  
    if(!isLoaded || isLoading || !signUp) return;
    const normalized = email.trim().toLowerCase();

    setIsLoading(true);
    setError(undefined);
    try{
      await sendOtp({signUp,email:normalized});
      closeSheet();
      router.push('/(auth)/verification')
    } catch (e:any) {
    setError(e?.errors?.[0]?.message ?? e?.message ?? "Erreur lors de l'envoi du code");
  } finally {
    setIsLoading(false);
  }

  }

   

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex h-[50] flex-row w-full mx-3 ">
        <Pressable onPress={()=>router.back()}>
          <Image source={images.back} className="w-[24]" resizeMode='contain'/>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios'? 'padding': 'padding'}
      keyboardVerticalOffset={keyboardOffset}
      className="flex-1 flex-col justify-between bg-secondary-100 items-center px-5">
        <View className="bg-secondary py-5">
        <Text className="font-poppins-bold text-[20px]">{t('sign.enterMail')}</Text>
        <Text className="font-regular mb-4 mt-[-3] text-[14px] text-neutral-500">{t('sign.enterMailSubtitle')}</Text>
        <CustomInput 
        value={email}
        onChangeText={setEmail}
        image={images.email} 
        placeholder={t('sign.enterMail')}
        autoCorrect={false}
        inputMode='email'
        keyboardType='email-address'
        />
      </View>
      {
      
        isLoading?(<ActivityIndicator color='#fff' size={40} className='w-full mb-3 py-2 mx-5 rounded-full bg-primary-400' />):(<CustomButton titre='Suivant' onPress={decide} disabled={isEmailInvalid}/>)
      }
      </KeyboardAvoidingView>

      <BottomSheetModal
      snapPoints={snapPoints}
      ref={bottomRef}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableHandlePanningGesture={false}
      enableContentPanningGesture={false}
      handleIndicatorStyle={{backgroundColor: 'transparent'}}
      backdropComponent={renderBackdrop}
      handleComponent={()=>(
        <View>
            <Pressable onPress={closeSheet} hitSlop={12}>
           <Image source={images.close} className="h-[40] w-[40] absolute right-3 top-[-50] z-10" resizeMode='contain' />
        </Pressable>
        </View>
      )}
      >
       
        <BottomSheetView className="py-10 px-5 gap-y-3 mt-[-3] mb-3">
        
          <Text className="font-black text-2xl ">{t('sign.newEmail')}</Text>
          <Text className="font-medium text-[14px]">{t('sign.newEmailSubtitle')}</Text>
          
          <Pressable className="bg-neutral-100 flex flex-row items-center h-[50] rounded-full border-neutral-200 border-2" onPress={onSend}>
            <Image source={images.gmail} className="absolute ml-3 h-[20] w-[20] " resizeMode='contain' />
            {isLoading?
            <View className="w-full flex justify-center align-center">
            <LottieView 
            autoPlay 
            source={loaders.loader} 
            loop 
            style={{
              width: 40, 
              height: 40,
              alignSelf: 'center',
            }}
            />
            </View>
            :
            <Text className="font-semibold w-full text-center text-neutral-800">{t('sign.continueEmail')}</Text>}
          </Pressable>
            {error? <Text className="font-medium text-sm text-center text-red-800">{t('sign.Erreur')} : {error}</Text>: null}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  )
}

export default Sign;