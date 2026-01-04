// app/(restaurants)/pourboire.tsx
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { images } from '@/constants';
import { soldOperation } from '@/lib/appwrite';
import { useAuth } from '@clerk/clerk-expo';
import { useUserStore } from '@/store/user.store';

const TIP_OPTIONS = [
  { label: '50 F', value: 50 },
  { label: '100 F', value: 100 },
  { label: '200 F', value: 200 },
  { label: '500 F', value: 500 },
];

const Pourboire = () => {
  const { orderId, championId, championName, championAvatar } = useLocalSearchParams<{
    orderId: string;
    championId: string;
    championName?: string;
    championAvatar?: string;
  }>();

  const { userId, getToken } = useAuth();
  const currentUser = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger l'utilisateur au montage si nécessaire
  useEffect(() => {
    if (userId && !currentUser) {
      loadUser(getToken, userId);
    }
  }, [userId, currentUser]);

  const finalTipAmount = useMemo(() => {
    if (customTip) {
      const amount = parseInt(customTip);
      return isNaN(amount) ? 0 : amount;
    }
    return selectedTip || 0;
  }, [selectedTip, customTip]);

  const handleTipSelect = (value: number) => {
    setSelectedTip(value);
    setCustomTip('');
    setError(null);
  };

  const handleCustomTipChange = (text: string) => {
    // Permettre uniquement les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomTip(numericText);
    setSelectedTip(null);
    setError(null);
  };

  const handleGiveTip = async () => {
    if (finalTipAmount <= 0) {
      setError('Veuillez sélectionner un montant');
      return;
    }

    // Utilisez currentUser.$id au lieu de userId
    if (!currentUser?.$id || !championId) {
      setError('Informations manquantes');
      console.log('❌ Données manquantes:', { 
        currentUserId: currentUser?.$id, 
        championId 
      });
      return;
    }

    // Vérifier le solde avant de débiter
    if (currentUser.sold < finalTipAmount) {
      setError('Solde insuffisant');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('💰 Début transaction pourboire:', {
        userId: currentUser.$id,
        championId,
        amount: finalTipAmount
      });

      // 1. Débiter l'utilisateur - Utilisez currentUser.$id
      await soldOperation(currentUser.$id, 'subtract', finalTipAmount);
      console.log(`✅ ${finalTipAmount}F débités de l'utilisateur`);

      // 2. Créditer le champion
      await soldOperation(championId, 'add', finalTipAmount);
      console.log(`✅ ${finalTipAmount}F crédités au champion`);

      // 3. Recharger les données de l'utilisateur pour mettre à jour le solde
      if (userId) {
        await loadUser(getToken, userId);
      }

      // 4. Rediriger vers une page de confirmation
      router.replace({
        pathname: '/(restaurants)/commandes',
        params: { initialIndex: '2' }
      });

    } catch (error: any) {
      console.error('❌ Erreur pourboire:', error);
      setError(error.message || 'Impossible de donner le pourboire');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    router.replace({
      pathname: '/(restaurants)/commandes',
      params: { initialIndex: '2' }
    });
  };

  // Afficher un loader si l'utilisateur n'est pas encore chargé
  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#48681B" />
        <Text className="mt-3 text-gray-600">Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-5 py-4 border-b border-gray-200">
          <Text className="font-poppins-bold text-[20px] text-center">
            Donner un pourboire
          </Text>
        </View>

        <View className="flex-1 px-5 py-6">
          {/* Affichage du solde actuel */}
          <View className="bg-primary-50 rounded-xl p-3 mb-4">
            <Text className="text-center text-gray-700 text-[13px]">
              Votre solde actuel : <Text className="font-poppins-bold text-primary-400">{currentUser.sold} F</Text>
            </Text>
          </View>

          {/* Avatar Champion */}
          <View className="items-center mb-6">
            <View
              style={{ width: 100, height: 100, borderRadius: 50 }}
              className="bg-gray-100 overflow-hidden mb-3"
            >
              {championAvatar ? (
                <Image
                  source={{ uri: championAvatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={images.utilisateur}
                  className="w-full h-full"
                  tintColor="#9ca3af"
                  resizeMode="contain"
                />
              )}
            </View>
            
            <Text className="font-poppins-bold text-[18px] mb-1">
              {championName || 'Votre Champion'}
            </Text>
            <Text className="text-gray-600 text-[14px] text-center">
              a livré votre commande avec succès 🎉
            </Text>
          </View>

          {/* Message encouragement */}
          <View className="bg-primary-50 rounded-2xl p-4 mb-6">
            <Text className="text-center text-gray-700 text-[14px] leading-5">
              Votre champion a fait de son mieux pour vous livrer rapidement.
              Montrez votre appréciation avec un pourboire ! 💚
            </Text>
          </View>

          {/* Options de pourboire */}
          <Text className="font-semibold text-[15px] mb-3">
            Montant du pourboire
          </Text>
          
          <View className="flex-row flex-wrap gap-3 mb-4">
            {TIP_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleTipSelect(option.value)}
                className={`flex-1 min-w-[45%] py-4 rounded-xl border-2 items-center ${
                  selectedTip === option.value
                    ? 'bg-primary-400 border-primary-400'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`font-semibold text-[16px] ${
                    selectedTip === option.value
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Montant personnalisé */}
          <View className="mb-6">
            <Text className="font-semibold text-[15px] mb-3">
              Ou montant personnalisé
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <TextInput
                value={customTip}
                onChangeText={handleCustomTipChange}
                placeholder="0"
                keyboardType="numeric"
                maxLength={6}
                className="flex-1 text-[18px] font-semibold"
              />
              <Text className="text-gray-600 text-[16px] ml-2">F</Text>
            </View>
          </View>

          {/* Récapitulatif */}
          {finalTipAmount > 0 && (
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700 text-[15px]">
                  Montant du pourboire
                </Text>
                <Text className="font-poppins-bold text-[20px] text-primary-400">
                  {finalTipAmount} F
                </Text>
              </View>
              {finalTipAmount > currentUser.sold && (
                <Text className="text-red-600 text-[12px] mt-2">
                  ⚠️ Solde insuffisant
                </Text>
              )}
            </View>
          )}

          {/* Erreur */}
          {error && (
            <View className="bg-red-50 rounded-xl p-3 mb-4">
              <Text className="text-red-600 text-[13px] text-center">
                {error}
              </Text>
            </View>
          )}

          {/* Boutons */}
          <View className="gap-3 mt-auto">
            <Pressable
              onPress={handleGiveTip}
              disabled={isProcessing || finalTipAmount <= 0 || finalTipAmount > currentUser.sold}
              className={`rounded-full py-4 items-center ${
                isProcessing || finalTipAmount <= 0 || finalTipAmount > currentUser.sold
                  ? 'bg-gray-300'
                  : 'bg-primary-400'
              }`}
            >
              {isProcessing ? (
                <View className="flex-row items-center gap-x-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold text-[16px]">
                    Traitement...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-[16px]">
                  Donner {finalTipAmount > 0 ? `${finalTipAmount} F` : 'un pourboire'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleSkip}
              disabled={isProcessing}
              className="py-4 items-center"
            >
              <Text className="text-gray-600 font-medium text-[15px]">
                Passer cette étape
              </Text>
            </Pressable>
          </View>

          {/* Note en bas */}
          <Text className="text-gray-500 text-[12px] text-center mt-4">
            Le pourboire sera déduit de votre solde et crédité directement
            au champion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Pourboire;