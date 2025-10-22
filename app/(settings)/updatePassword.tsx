import CustomButton from '@/components/CustomButton';
import CustomCheckbox from '@/components/CustomCheckbox';
import CustomInput from '@/components/CustomInput';
import { images } from '@/constants';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UpdatePassword = () => {
  const {t} = useTranslation();

  const {user} = useUser();
  const [actualPassword, setActualPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seeActualPassword, setSeeActualPassword] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const verifierPassword = useCallback((pwd: string) => {
    const clearPassword = pwd.trim();
    return {
      hasNumber: /\d/.test(clearPassword),
      hasLowerCase: /[a-z]/.test(clearPassword),
      hasUpperCase: /[A-Z]/.test(clearPassword),
      hasSpecialChar: /[!@#$%^&*()]/.test(clearPassword),
      hasValidLength: clearPassword.length >= 8 && clearPassword.length <= 20,
    };
  }, []);

  const matchPassword = useCallback((a: string, b: string) => {
    return a.trim() === b.trim();
  }, []);

  const validPassword = useMemo(() => {
    return verifierPassword(password);
  }, [password, verifierPassword]);

  const passwordsMatch = useMemo(() => {
    return matchPassword(password, confirmPassword);
  }, [password, confirmPassword, matchPassword]);

  const isFormValid = useMemo(() => {
    return (
      actualPassword.length > 0 &&
      validPassword.hasNumber &&
      validPassword.hasLowerCase &&
      validPassword.hasSpecialChar &&
      validPassword.hasUpperCase &&
      validPassword.hasValidLength &&
      password.length > 0 &&
      passwordsMatch
    );
  }, [actualPassword, validPassword, password.length, passwordsMatch]);

  const submit = useCallback(async () => {
    if (!isFormValid) return;

    setLoading(true);

    try {
      await user?.updatePassword({
        currentPassword: actualPassword,
        newPassword: password,
      });

      Alert.alert(
        t('updatePassword.successTitle'),
        t('updatePassword.successMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              setActualPassword('');
              setPassword('');
              setConfirmPassword('');
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = t('updatePassword.errorGeneric');
      const errorStr = String(error?.errors?.[0]?.message || error?.message || '').toLowerCase();
      
      if (errorStr.includes('incorrect')) {
        errorMessage = t('updatePassword.errorIncorrectPassword');
      } else if (errorStr.includes('pwned')) {
        errorMessage = t('updatePassword.errorCompromisedPassword');
      } 
      
      Alert.alert(t('updatePassword.errorTitle'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isFormValid, user, actualPassword, password, t]);

  const toggleSeeActualPassword = useCallback(() => {
    setSeeActualPassword(prev => !prev);
  }, []);

  const toggleSeePassword = useCallback(() => {
    setSeePassword(prev => !prev);
  }, []);

  const toggleSeeConfirmPassword = useCallback(() => {
    setSeeConfirmPassword(prev => !prev);
  }, []);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-[50] elevation-xl justify-center px-5">
        <Pressable onPress={() => router.back()} hitSlop={15}>
          <Image source={images.back} className="size-6" resizeMode='contain'/>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        className="flex-1 justify-between bg-secondary-100 p-5 items-center"
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View className="gap-y-2">
          <Text className="font-poppins-bold text-[18px]">{t('updatePassword.title')}</Text>
          <Text className="mb-2">{t('updatePassword.subtitle')}</Text>

          <CustomInput
            value={actualPassword}
            onChangeText={setActualPassword}
            image={images.cadenas}
            secureTextEntry={!seeActualPassword}
            icon={seeActualPassword ? images.visible : images.nvisible}
            onPress={toggleSeeActualPassword}
            placeholder={t('updatePassword.actual')}
          />

          <CustomInput 
            value={password}
            onChangeText={setPassword}
            image={images.cadenas}
            placeholder={t('updatePassword.placeholder')}
            onPress={toggleSeePassword}
            secureTextEntry={!seePassword} 
            icon={seePassword ? images.visible : images.nvisible}
          />

          <CustomInput 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            image={images.cadenas}
            placeholder={t('updatePassword.placeholderConfirm')}
            onPress={toggleSeeConfirmPassword}
            secureTextEntry={!seeConfirmPassword} 
            icon={seeConfirmPassword ? images.visible : images.nvisible}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text className="text-red-600 text-[12px] font-medium mt-1 px-2">
              {t('updatePassword.mismatch')}
            </Text>
          )}

          <View className="mt-5">
            <Text className="font-semibold text-[14px] mb-3 text-neutral-600">{t('updatePassword.requirementsTitle')}</Text>
            <CustomCheckbox checked={validPassword.hasNumber} label={t('updatePassword.reqNumber')}/>
            <CustomCheckbox checked={validPassword.hasLowerCase} label={t('updatePassword.reqLower')} />
            <CustomCheckbox checked={validPassword.hasUpperCase} label={t('updatePassword.reqUpper')}/>
            <CustomCheckbox checked={validPassword.hasSpecialChar} label={t('updatePassword.reqSpecial')}/>
            <CustomCheckbox checked={validPassword.hasValidLength} label={t('updatePassword.reqLength')}/>
          </View>
        </View>

        {loading ? (
          <Pressable className='bg-primary-400 w-full rounded-full p-3'>
            <ActivityIndicator color='#ffffff'/>
          </Pressable>
        ) : (
          <CustomButton titre={t('updatePassword.next')} disabled={!isFormValid} onPress={submit}/>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UpdatePassword;