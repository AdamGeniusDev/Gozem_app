import  { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { useSignIn, isClerkAPIResponseError, useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';

import useAuthStore from '@/store/auth.store';
import { findUser } from '@/lib/appwrite';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { images } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const {t} = useTranslation();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { userId, getToken } = useAuth();
  const { email: storeEmail } = useAuthStore();

  const [email, setEmail] = useState(storeEmail ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!isLoaded) return;
    setSubmitting(true); setError(null);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setSent(true);
    } catch (e: any) {
      const msg = isClerkAPIResponseError(e) ? (e.errors?.[0]?.longMessage ?? e.message) : e.message;
      setError(msg);
    } finally { setSubmitting(false); }
  };

  const resetPassword = async () => {
    if (!isLoaded) return;
    setSubmitting(true); setError(null);
    try {
      const res = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword,
      });

      if (res.status !== 'complete' || !res.createdSessionId) {
        throw new Error('Échec de la réinitialisation.');
      }

      await setActive({ session: res.createdSessionId });

      const check = await findUser(getToken, { clerkUserId: userId ?? null, email });
      if (!check.exists || !check.complete) router.replace('/(auth)/info');
      else router.replace('/');
    } catch (e: any) {
      const msg = isClerkAPIResponseError(e) ? (e.errors?.[0]?.longMessage ?? e.message) : e.message;
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView className='flex-1'>
       <View className="flex flex-row w-full mx-3 h-[50]">
                      <Pressable onPress={()=>router.back()}>
                        <Image source={images.back} className="w-[24]" resizeMode='contain'/>
                      </Pressable>
        </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} className='flex-1 items-center gap-y-3 px-5 py-6 bg-white'>
      <Text className='font-poppins-bold text-[20px] mb-2'>{t('forgotPassword.title')}</Text>
      {error ? <Text className='text-red-500 mb-2'>{error}</Text> : null}

      {!sent ? (
        <>
          <CustomInput image={images.email} placeholder={t('forgotPassword.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <CustomButton titre={submitting ? t('forgotPassword.sendingCode') : t('forgotPassword.sendCode')} onPress={sendCode} disabled={submitting || !email} />
        </>
      ) : (
        <>
          <CustomInput image={images.sms} placeholder={t('forgotPassword.codePlaceholder')} value={code} onChangeText={setCode} />
          <CustomInput image={images.cadenas}placeholder={t('forgotPassword.newPasswordPlaceholder')}value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <CustomButton titre={submitting ? t('forgotPassword.validating') : t('forgotPassword.validate')} onPress={resetPassword} disabled={submitting || !code || !newPassword} />
        </>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
