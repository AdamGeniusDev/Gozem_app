// components/OfflineScreen.tsx - VERSION SIMPLE
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { useState } from 'react';

interface OfflineScreenProps {
  onRetry?: () => void;
}

export const OfflineScreen = ({ onRetry }: OfflineScreenProps) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    
    try {
      // Tester la connexion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Connexion rétablie');
        onRetry?.();
        // Forcer un refresh de l'app
        window.location?.reload?.();
      } else {
        console.log('❌ Toujours pas de connexion');
      }
    } catch (error) {
      console.log('❌ Erreur connexion');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Icône */}
        <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center mb-6">
          <Image
            source={images.wifi}
            className="w-20 h-20"
            tintColor="#9ca3af"
            resizeMode="contain"
          />
        </View>

        {/* Titre */}
        <Text className="font-poppins-bold text-[22px] text-gray-900 text-center mb-3">
          Pas de connexion Internet
        </Text>

        {/* Description */}
        <Text className="font-regular text-[15px] text-gray-600 text-center leading-6 mb-8">
          Vérifiez votre connexion Wi-Fi ou vos données mobiles et réessayez
        </Text>

        {/* Bouton réessayer */}
        <Pressable
          onPress={handleRetry}
          disabled={isChecking}
          className={`rounded-full px-8 py-4 ${
            isChecking ? 'bg-primary-300' : 'bg-primary-400'
          }`}
        >
          {isChecking ? (
            <View className="flex-row items-center gap-x-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold text-[16px]">
                Vérification...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-[16px]">
              Réessayer
            </Text>
          )}
        </Pressable>

        {/* Conseils */}
        <View className="mt-12 w-full">
          <Text className="font-medium text-[13px] text-gray-700 mb-3">
            Conseils :
          </Text>
          <View className="gap-y-2">
            <Text className="text-[13px] text-gray-600">
              • Vérifiez que le Wi-Fi est activé
            </Text>
            <Text className="text-[13px] text-gray-600">
              • Vérifiez vos données mobiles
            </Text>
            <Text className="text-[13px] text-gray-600">
              • Essayez de vous rapprocher du routeur
            </Text>
            <Text className="text-[13px] text-gray-600">
              • Redémarrez votre appareil si nécessaire
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};