import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInputProps,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { images, loaders } from '@/constants';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import CustomButton from '@/components/CustomButton';
import { useSignUp } from '@clerk/clerk-expo';
import useAuthStore from '@/store/auth.store';
import LottieView from 'lottie-react-native';

const CELL_COUNT = 6;
const time_resend = 30;

export default function Verification() {
  const [secondsLeft, setSecondsLeft] = useState(time_resend);
  const [value, setValue] = useState('');
  const [fieldKey,setFieldKey]= useState(0);
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value, setValue });

  const autoComplete = Platform.select<TextInputProps['autoComplete']>({
    android: 'sms-otp',
    default: 'one-time-code',
  });

  const isCodeInvalid = !(value.length === CELL_COUNT);

  const {isLoaded, signUp} = useSignUp();
  const { isLoading, verifyOtp, error, resendOtp, setError } = useAuthStore();


  const format = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
  const resend = async () => {
    if (!isLoaded || isLoading) return;

    setFieldKey(k => k + 1); 
    setValue('');
    setError?.(undefined);

    const ok = await resendOtp({ signUp });
    if(ok){
        startTimer();
    }
  };

  const onVerify = useCallback(async() => {
    if(!isLoaded || isLoading || isCodeInvalid) {
      return;
    }
    setError?.(undefined)
    await verifyOtp({signUp,code:value,activeNow:false});
    Keyboard.dismiss();
  },[isLoaded,isLoading,isCodeInvalid,signUp,value,verifyOtp,setError]);

  useEffect(() => {
  if (secondsLeft === 0) return;
  const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
  return () => clearTimeout(id);
}, [secondsLeft]);

const startTimer = useCallback(() => {
  setSecondsLeft(time_resend); // relance le compte à rebours
}, []);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-row w-full px-3 h-[40] mt-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Image source={images.back} className="w-[24] h-[24]" resizeMode="contain" />
        </Pressable>
      </View>

      <View className="w-full px-6 pt-5 bg-secondary">
        <Text className="font-poppins-bold text-[20px]">Verification de votre email</Text>
        <Text className="font-regular mb-4 mt-[-3] text-[14px] text-neutral-500">Entrez le code envoyer dans votre email pour continuer</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1 bg-secondary justify-between items-center px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <CodeField
          key={fieldKey}
          ref={ref}
          {...props}
          value={value}
          onChangeText={setValue}
          cellCount={CELL_COUNT}
          rootStyle={styles.codeFieldRoot}
          keyboardType="number-pad"
          textContentType="oneTimeCode"   
          autoComplete={autoComplete}
          autoFocus
          renderCell={({ index, symbol, isFocused }) => (
            <Text
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}
              onLayout={getCellOnLayoutHandler(index)}
            >
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          )}
        />
         <Pressable onPress={resend} disabled={secondsLeft > 0}>
                <Text
                    style={{
                    textDecorationLine: 'underline',
                    color: secondsLeft > 0 ? '#9ca3af' : '#169137',
                    fontWeight: '600',
                    opacity: isLoading ? 0.5 : 1,
                    alignSelf: 'center',
                    }}
                >
                    {secondsLeft > 0
                    ? `Renvoyer le code (${format(secondsLeft)})`
                    : 'Renvoyer le code'}
                </Text>
            </Pressable>
        {isLoading && (<LottieView autoPlay source={loaders.loader} style={{width: 40, height:40}}/>)}
        {error && (
            <View>
            <Text className="font-semibold text-red-800 text-center mt-5">Le code est incorrecte</Text>

            </View>
            )}

        <CustomButton titre="Verifier maintenant" onPress={onVerify} disabled={isCodeInvalid || isLoading}/>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  codeFieldRoot: { marginTop: 20, gap: 8 },
  cell: {
    width: 44,
    height: 52,
    lineHeight: 52,
    fontSize: 24,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#00000030',
    textAlign: 'center',
    color: '#000',
    backgroundColor: '#fff',
  },
  focusCell: { borderColor: '#48681B' },
});
