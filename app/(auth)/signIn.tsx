import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { images } from '@/constants'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'
import { isClerkAPIResponseError, useAuth, useSignIn } from '@clerk/clerk-expo'
import useAuthStore from '@/store/auth.store'
import { findUser } from '@/lib/appwrite'
import { useTranslation } from 'react-i18next'

const SignIn = () => {
  const {t} = useTranslation();
  const [password, setPassword] = useState('');
  const [viewPassword, setViewPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const { signIn, isLoaded, setActive } = useSignIn();
  const { userId, getToken } = useAuth();
  const { email } = useAuthStore();

  const submit = async () => {
    if (!isLoaded || submitting) return;
    if (!password) { setError("Entrez votre mot de passe."); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await signIn.create({ identifier: email.trim().toLowerCase(), password });

      if (res.status !== 'complete' || !res.createdSessionId) {
        setError(t('signIn.incorrectIdentifier'));
        return;
      }

      await setActive({ session: res.createdSessionId });

      if (!userId) { return }
      console.log('Deux choses',userId)

      const check = await findUser(getToken, { clerkUserId: userId, email });
      if (!check?.exists || !check?.complete) {
        router.replace('/(auth)/info');
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      let msg = e?.message ?? t('signIn.msg1');

      if (isClerkAPIResponseError?.(e)) {
        const err0 = e.errors?.[0];
        msg = err0?.longMessage || err0?.message || msg;

        const code = String(err0?.code ?? '');
        if (code === 'form_password_incorrect')      msg = t('signIn.msg2');
        if (code === 'identifier_not_found')         msg = t("signIn.msg3");
        if (code === 'form_identifier_invalid')      msg = t("signIn.msg4");
        if (code === 'too_many_attempts')            msg = t("signIn.msg5");
        if (code === 'user_locked')                  msg = t("signIn.msg6");
      }

      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const see = () => setViewPassword(v => !v);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-row w-full mx-5 h-[50]">
        <Pressable onPress={() => router.back()}>
          <Image source={images.back} className="w-[24]" resizeMode="contain" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        className="flex-1 flex-col items-center justify-between bg-secondary-100 px-5"
      >
        <View className="py-5">
          <Text className="font-poppins-bold text-[20px]">{t('signIn.welcomeBack')}</Text>
          <Text className="font-regular text-[14px] text-neutral-500 mb-4">{t('signIn.passText')}
          </Text>

          <CustomInput
            value={password}
            image={images.cadenas}
            secureTextEntry={viewPassword}
            placeholder={t('signIn.placeholderPassword')}
            onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
            onPress={see}
            icon={viewPassword ? images.visible : images.nvisible}
          />

          <Pressable onPress={() => router.push('/(auth)/forgotPassword')}>
            <Text className="font-poppins-bold text-[14px] text-primary-400 mt-3">
              {t('signIn.forgotPassword')}
            </Text>
          </Pressable>

          {!!error && (
            <Text className="text-red-500 font-regular text-[14px] mt-2">
              {error}
            </Text>
          )}
        </View>

        {(!isLoaded || submitting) ? (
          <ActivityIndicator
            className="w-full mb-3 py-2 mx-5 rounded-full bg-primary-400"
            color="white"
            size={30}
          />
        ) : (
          <CustomButton
            titre={t('signIn.signInButton')}
            onPress={submit}
            disabled={!password}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
