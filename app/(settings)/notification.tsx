import { View, Text, Image, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import CustomButton from '@/components/CustomButton'
import useNotificationStore from '@/store/notification.store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const notification_key = '@notification_settings';
const push_key = '@push_notifications';
const email_key = '@email_notifications';
const sms_key = '@sms_notifications';

const Notification = () => {
  const [allEnabled, setAllEnabled] = useState(true);
  const [active, setActive] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Garder les valeurs initiales pour comparaison
  const [initialValues, setInitialValues] = useState({
    allEnabled: true,
    active: true,
    emailEnabled: true,
    smsEnabled: true
  });

  const {
    initialize,
    permissionsStatus,
  } = useNotificationStore();

  // Charger les paramètres au démarrage
  useEffect(() => {
    (async () => {
      await initialize();

      // Charger les paramètres sauvegardés
      try {
        const savedAll = await AsyncStorage.getItem(notification_key);
        const savedPush = await AsyncStorage.getItem(push_key);
        const savedEmail = await AsyncStorage.getItem(email_key);
        const savedSms = await AsyncStorage.getItem(sms_key);

        const loadedAll = savedAll !== null ? savedAll === 'enabled' : true;
        const loadedPush = savedPush !== null ? savedPush === 'enabled' : true;
        const loadedEmail = savedEmail !== null ? savedEmail === 'enabled' : true;
        const loadedSms = savedSms !== null ? savedSms === 'enabled' : true;

        setAllEnabled(loadedAll);
        setActive(loadedPush);
        setEmailEnabled(loadedEmail);
        setSmsEnabled(loadedSms);

        // Sauvegarder les valeurs initiales
        setInitialValues({
          allEnabled: loadedAll,
          active: loadedPush,
          emailEnabled: loadedEmail,
          smsEnabled: loadedSms
        });
      } catch (error) {
        console.log('Erreur lors du chargement des paramètres', error);
      }

      // Vérifier les permissions de notification
      if (permissionsStatus !== 'granted') {
        setActive(false);
      }

      setIsLoading(false);
    })();
  }, [permissionsStatus]);

  // Détecter les changements en comparant avec les valeurs initiales
  useEffect(() => {
    if (!isLoading) {
      const changed = 
        allEnabled !== initialValues.allEnabled ||
        active !== initialValues.active ||
        emailEnabled !== initialValues.emailEnabled ||
        smsEnabled !== initialValues.smsEnabled;
      
      setHasChanges(changed);
    }
  }, [allEnabled, active, emailEnabled, smsEnabled, isLoading, initialValues]);

  const params = [
    { title: 'Push', icone: images.cloche, active: active, onPress: () => setActive(!active) },
    { title: 'Email', icone: images.email, active: emailEnabled, onPress: () => setEmailEnabled(!emailEnabled) },
    { title: 'SMS', icone: images.sms, active: smsEnabled, onPress: () => setSmsEnabled(!smsEnabled) }
  ];

  // Sauvegarder les paramètres
  const savedNotificationSettings = async () => {
    try {
      // Si allEnabled est false, désactiver tous les switches lors de la soumission
      const finalActive = allEnabled ? active : false;
      const finalEmail = allEnabled ? emailEnabled : false;
      const finalSms = allEnabled ? smsEnabled : false;

      await AsyncStorage.setItem(notification_key, allEnabled ? 'enabled' : 'disabled');
      await AsyncStorage.setItem(push_key, finalActive ? 'enabled' : 'disabled');
      await AsyncStorage.setItem(email_key, finalEmail ? 'enabled' : 'disabled');
      await AsyncStorage.setItem(sms_key, finalSms ? 'enabled' : 'disabled');
      
      // Mettre à jour les états locaux
      setActive(finalActive);
      setEmailEnabled(finalEmail);
      setSmsEnabled(finalSms);

      // Mettre à jour les valeurs initiales
      setInitialValues({
        allEnabled,
        active: finalActive,
        emailEnabled: finalEmail,
        smsEnabled: finalSms
      });

      setHasChanges(false);
      router.back(); // Optionnel : retourner à l'écran précédent
    } catch (error) {
      console.log('Erreur lors de la sauvegarde des paramètres de notification', error);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-row gap-x-4 px-5 h-[60px] items-end pb-4'>
        <Pressable hitSlop={15} onPress={() => router.back()}>
          <Image source={images.back} className='size-6' resizeMode='contain' />
        </Pressable>
        <Text className='font-semibold text-[15px]'>Parametres des notifications</Text>
      </View>

      <View className='bg-neutral-100 flex-1 p-5 flex-col justify-between'>
        {allEnabled ? (
          <View>
            <View className=' flex-row p-3 items-center gap-x-5 mt-3 rounded-xl' style={{ height: 100, backgroundColor: '#f2efea' }}>
              <Image source={images.notif} style={{ height: 40, width: 40, tintColor: allEnabled ? '#169137' : '#B0B3B2' }} />
              <View className='flex-row justify-between items-center flex-1'>
                <View className='gap-y-2' style={{ width: '80%' }}>
                  <Text className='font-semibold text-[16px]'>
                    Tout Desactiver
                  </Text>
                  <Text className='font-regular text-[13px] text-neutral-600'>Desactiver toutes les notifications</Text>
                </View>
                <Switch
                  trackColor={{ false: '#d4d4d4', true: '#169137' }}
                  thumbColor={'#ffffff'}
                  value={allEnabled}
                  onValueChange={setAllEnabled}
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>
            <View style={{ paddingVertical: 30 }}>
              <View className='flex-row items-center justify-between'>
                <View className='gap-y-2 mb-5' style={{ width: '75%' }}>
                  <Text className='font-semibold text-[16px]'>
                    Marketing : promo & offres
                  </Text>
                  <Text className='font-regular text-[13px] text-neutral-600'>
                    Recevoir les notifications pour les codes promo et les offres
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#e5e5e5', true: '#169137' }}
                  thumbColor={'#ffffff'}
                  value={allEnabled}
                  onValueChange={setAllEnabled}
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>

              {
                params.map((item, i) => (
                  <View key={i} className='flex-row gap-x-4 items-center' style={{ height: 60 }}>
                    <View className='items-center pb-5'>
                      <Image source={item.icone} className='size-6' tintColor={item.active ? '#169137' : '#B0B3B2'} />
                    </View>
                    <View className='flex-row  justify-between items-center border-neutral-200 flex-1 pb-5' style={{ borderBottomWidth: i < (params.length - 1) ? 1 : 0 }}>

                      <Text className='font-medium text-[15px]'>{item.title}</Text>

                      <Switch
                        trackColor={{ false: '#e5e5e5', true: '#169137' }}
                        thumbColor={'#ffffff'}
                        value={item.active}
                        onValueChange={item.onPress}
                        style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                      />

                    </View>

                  </View>
                ))
              }
            </View>
          </View>
        ) : (
          <View className='flex-1'>
            <View className=' flex-row p-3 items-center gap-x-5 mt-3 rounded-xl bg-neutral-200' style={{ height: 80 }}>
              <Image source={images.notif} style={{ height: 40, width: 40, tintColor: allEnabled ? '#169137' : '#B0B3B2' }} />
              <View className='flex-row justify-between items-center flex-1'>
                <View className='gap-y-2' style={{ width: '80%' }}>
                  <Text className='font-semibold text-[16px]'>
                    Activer tout
                  </Text>
                  <Text className='font-regular text-[13px] text-neutral-600'>Activer toutes les notifications</Text>
                </View>
                <Switch
                  trackColor={{ false: '#d4d4d4', true: '#169137' }}
                  thumbColor={'#ffffff'}
                  value={allEnabled}
                  onValueChange={setAllEnabled}
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>
            <View className='flex-1 items-center justify-center gap-y-3' style={{ marginTop: -20 }}>
              <Image source={images.disabled} style={{ height: 100, width: 100 }} />
              <Text className='font-poppins-bold text-[18px] text-center'>Vous avez desactive toutes les notifications</Text>
            </View>
          </View>
        )}
        <CustomButton 
          titre='Enregistrer les modifications' 
          disabled={!hasChanges}
          onPress={savedNotificationSettings}
        />
      </View>
    </SafeAreaView>
  )
}

export default Notification