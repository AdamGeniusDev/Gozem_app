import CustomButton from '@/components/CustomButton';
import CustomCheckbox from '@/components/CustomCheckbox';
import CustomInput from '@/components/CustomInput';
import { images } from '@/constants';
import useAuthStore from '@/store/auth.store';
import { router } from 'expo-router';
import  { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Password = () => {
  const {t} = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirmPassword, setSeeConfirmPassword] = useState(false);

  const { isLoading, error} = useAuthStore();

  // Mémoriser la fonction de vérification du mot de passe
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

  // Mémoriser la fonction de comparaison des mots de passe
  const matchPassword = useCallback((a: string, b: string) => {
    return a.trim() === b.trim();
  }, []);

  // Mémoriser la validation du mot de passe
  const validPassword = useMemo(() => {
    return verifierPassword(password);
  }, [password, verifierPassword]);

  // Mémoriser si les mots de passe correspondent
  const passwordsMatch = useMemo(() => {
    return matchPassword(password, confirmPassword);
  }, [password, confirmPassword, matchPassword]);

  // Mémoriser si le formulaire est valide
  const isFormValid = useMemo(() => {
    return (
      validPassword.hasNumber &&
      validPassword.hasLowerCase &&
      validPassword.hasSpecialChar &&
      validPassword.hasUpperCase &&
      validPassword.hasValidLength &&
      password.length > 0 &&
      passwordsMatch
    );
  }, [validPassword, password.length, passwordsMatch]);

  // Mémoriser la fonction de soumission
 const submit = () => {
  if (!isFormValid) return;

  // 1) stocke en mémoire (Zustand, non persisté)
  useAuthStore.getState().setPassword(password);

  // 2) nettoie les states locaux UI
  setPassword('');
  setConfirmPassword('');

  // 3) navigue
  router.push('/(auth)/info');
};
  // Mémoriser les fonctions de toggle
  const toggleSeePassword = useCallback(() => {
    setSeePassword(prev => !prev);
  }, []);

  const toggleSeeConfirmPassword = useCallback(() => {
    setSeeConfirmPassword(prev => !prev);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-[50] elevation-xl" />

      <KeyboardAvoidingView 
        className="flex-1 justify-between bg-secondary-100 p-5 items-center"
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View className="gap-y-2">
          <Text className="font-poppins-bold text-[20px]">{t('password.title')}</Text>
          <Text className="mb-2">{t('password.subtitle')}</Text>

          <CustomInput 
            value={password}
            onChangeText={setPassword}
            image={images.cadenas}
            placeholder={t('password.placeholder')}
            onPress={toggleSeePassword}
            secureTextEntry={!seePassword} 
            icon={seePassword ? images.visible : images.nvisible}
          />
          <CustomInput 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            image={images.cadenas}
            placeholder={t('password.placeholderConfirm')}
            onPress={toggleSeeConfirmPassword}
            secureTextEntry={!seeConfirmPassword} 
            icon={seeConfirmPassword ? images.visible : images.nvisible}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text className="text-red-600 text-[12px] font-medium mt-1 px-2">
              Les mots de passe ne correspondent pas
            </Text>
          )}

          <View className="mt-5">
            <Text className="font-semibold text-[14px] mb-3 text-neutral-600">{t('password.requirementsTitle')}</Text>
            <CustomCheckbox checked={validPassword.hasNumber} label={t('password.reqNumber')}/>
            <CustomCheckbox checked={validPassword.hasLowerCase} label={t('password.reqLower')} />
            <CustomCheckbox checked={validPassword.hasUpperCase} label={t('password.reqUpper')}/>
            <CustomCheckbox checked={validPassword.hasSpecialChar} label={t('password.reqSpecial')}/>
            <CustomCheckbox checked={validPassword.hasValidLength} label={t('password.reqLength')}/>
          </View>
        </View>

        {error ? (
          <Text className='text-red-600 text-[10px]'>
            {t('password.errorGeneric')} {String(error)}
          </Text>
        ) : null}

        {isLoading ? (
          <Pressable className='bg-primary-400 border-2 w-full rounded-full p-3'>
            <ActivityIndicator color='#ffffff'/>
          </Pressable>
        ) : (
          <CustomButton titre={t('password.next')} disabled={!isFormValid} onPress={submit}/>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Password;