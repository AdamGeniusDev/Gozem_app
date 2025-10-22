import { View, Text, Pressable, Image } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '@/components/CustomButton';

const LANGUAGE_KEY = '@app_language';

const Langue = () => {
  const {t, i18n} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [initialLanguage, setInitialLanguage] = useState<string>(''); // Langue de départ
  const [isLoading, setIsLoading] = useState(true);

  const languages = [
    { code: 'fr', name: t('langue.french'), flag: images.francais },
    { code: 'en', name: t('langue.english'), flag: images.anglais }
  ];

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
        setInitialLanguage(savedLanguage); // Sauvegarde la langue initiale
        i18n.changeLanguage(savedLanguage);
      } else {
        // Si aucune langue n'est sauvegardée, utiliser la langue actuelle
        setSelectedLanguage(i18n.language);
        setInitialLanguage(i18n.language);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la langue:', error);
      setSelectedLanguage(i18n.language);
      setInitialLanguage(i18n.language);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    i18n.changeLanguage(langCode); 
  };

  const saveLanguage = async () => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, selectedLanguage);
      i18n.changeLanguage(selectedLanguage);
      router.back();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white justify-center items-center'>
        <Text>{t('langue.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-row gap-x-5 px-5 items-center' style={{height: 60}}>
        <Pressable hitSlop={15} onPress={() => router.back()}>
          <Image source={images.back} className='size-5' resizeMode='contain' />
        </Pressable>
        <Text className='font-semibold text-[15px]'>{t('langue.title')}</Text>
      </View>

      <View className='flex-1 justify-between p-5 bg-neutral-100'>
        <View className='flex-1 bg-neutral-100' style={{gap: 25}}>
          {languages.map((lang) => (
            <Pressable 
              key={lang.code}
              className='flex-row items-center gap-x-4' 
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Image source={lang.flag} style={{height: 40, width: 40}} />
              <View className='flex-row justify-between flex-1 items-center'>
                <Text className='font-regular text-[17px]'>{lang.name}</Text>
                {selectedLanguage !== lang.code ? (
                  <View 
                    style={{height: 20, width: 20, borderWidth: 1}} 
                    className='rounded-full border-neutral-300'
                  />
                ) : (
                  <Image 
                    source={images.checked} 
                    style={{height: 25, width: 25}} 
                    tintColor={'#48681B'}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </View>
        <CustomButton 
          titre={t('langue.submit')}
          disabled={selectedLanguage === initialLanguage} 
          onPress={saveLanguage}
        />
      </View>
    </SafeAreaView>
  )
}

export default Langue