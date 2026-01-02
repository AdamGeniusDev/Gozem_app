import { images } from '@/constants';
import { getOrder, updateOrder, updateOrderPaymentStatus } from '@/lib/appwrite'; // ✅ Import
import useAppwrite from '@/lib/useAppwrite';
import { OrderWithItemsApp } from '@/types/type';
import { useAuth } from '@clerk/clerk-expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Delivery = () => {
  const { id } = useLocalSearchParams();
  const [accepting, setAccepting] = useState(false);
  const [validating, setValidating] = useState(false);
  const { getToken, userId } = useAuth(); // ✅ Ajoute userId
  
  const { data: order, loading, refetch } = useAppwrite<OrderWithItemsApp>({
    fn: () => getOrder(id as string, undefined, getToken) as Promise<OrderWithItemsApp>
  });

  useEffect(() => {
    if (!id || order?.status !== 'completed') return;

    const interval = setInterval(() => {
      refetch();
    }, 15000);

    return () => clearInterval(interval);
  }, [id, order?.status, refetch]);

  // Fonction  pour gérer le paiement par portefeuille
  const handleAcceptDelivery = async () => {
  if (accepting || order?.status !== 'completed') return;

  try {
    setAccepting(true);

    // 1. Mettre à jour le statut de la commande à "delivering"
    await updateOrder(id as string, 'delivering', true);

    // 2. Si paiement par portefeuille, débiter immédiatement
    if (order.method === 'portefeuille' && order.paymentStatus === 'unpaid') {
      console.log('💳 Paiement par portefeuille détecté, débit en cours...');
      
      try {
        // ✅ Appel simplifié - juste orderId et status
        await updateOrderPaymentStatus(id as string, 'paid');
        
        console.log('✅ Portefeuille débité avec succès');
        
        Alert.alert(
          '✅ Paiement effectué',
          `Le montant de ${order.totalPrice} F a été débité du portefeuille du client.`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('❌ Erreur débit portefeuille:', error);
        
        // Rollback du statut de la commande
        await updateOrder(id as string, 'completed', false);
        
        Alert.alert(
          '❌ Erreur de paiement',
          'Le solde du client est insuffisant. La livraison ne peut pas être acceptée.',
          [{ text: 'OK' }]
        );
        
        setAccepting(false);
        return;
      }
    }
    
    await refetch();
    
  } catch (error) {
    console.error('Error accepting delivery:', error);
    Alert.alert('Erreur', 'Impossible d\'accepter la livraison');
  } finally {
    setAccepting(false);
  }
};


  //  Fonction  pour gérer le paiement en espèces
 const handleValidateDelivery = async () => {
  if (validating || order?.status !== 'delivering') return;

  try {
    setValidating(true);

    // 1. Mettre à jour le statut à "delivered"
    await updateOrder(id as string, 'delivered');

    // 2. Si paiement en espèces, marquer comme payé maintenant
    if (order.method === 'espece' && order.paymentStatus === 'unpaid') {
      console.log('💵 Paiement en espèces, marquage comme payé...');
      
      try {
        // ✅ Appel simplifié
        await updateOrderPaymentStatus(id as string, 'paid');
        
        console.log('✅ Commande marquée comme payée (espèces)');
        
        Alert.alert(
          '✅ Livraison validée',
          'N\'oubliez pas de récupérer le paiement en espèces auprès du client.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('❌ Erreur mise à jour statut paiement:', error);
      }
    } else {
      Alert.alert(
        '✅ Livraison validée',
        'La commande a été livrée avec succès.',
        [{ text: 'OK' }]
      );
    }
    
    await refetch();
    
  } catch (error) {
    console.error('Error validating delivery:', error);
    Alert.alert('Erreur', 'Impossible de valider la livraison');
  } finally {
    setValidating(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center'>
        <ActivityIndicator size="large" color="#48681B" />
        <Text className='font-poppins-regular text-neutral-600 mt-4'>
          Chargement de la commande...
        </Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center px-4'>
        <Text className='font-poppins-bold text-[18px] text-center'>
          Commande introuvable
        </Text>
        <Pressable 
          className='mt-4 bg-primary-400 rounded-full px-6 py-3'
          onPress={() => router.back()}
        >
          <Text className='text-white font-poppins-semibold'>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isCompleted = order.status === 'completed';
  const isDelivering = order.status === 'delivering';
  const isDelivered = order.status === 'delivered';

  if (!isCompleted && !isDelivering && !isDelivered) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center px-4'>
        <Image source={images.dready} style={{ width: 200, height: 200 }} resizeMode='contain' />
        <Text className='font-poppins-bold text-[18px] text-center mt-4'>
          Cette commande n'est pas encore prête
        </Text>
        <Text className='font-poppins-regular text-neutral-600 text-center mt-2'>
          Statut actuel: {order.status}
        </Text>
        <Pressable 
          className='mt-4 bg-primary-400 rounded-full px-6 py-3'
          onPress={() => router.back()}
        >
          <Text className='text-white font-poppins-semibold'>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white px-4 py-3'>
      <View className='flex-1 justify-between'>
        <View>
          <View className='flex-row items-center gap-x-3 mb-4'>
            <View className='bg-primary-100 rounded-full p-3'>
              <Image source={images.plat} style={{ width: 24, height: 24 }} tintColor='#48681B' />
            </View>
            <View className='flex-1'>
              <Text className='font-poppins-bold text-[20px]'>
                Commande #{order.$id.slice(-6).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ✅ Afficher le mode de paiement */}
          <View className='bg-gray-50 p-4 rounded-lg mb-4'>
            <View className='flex-row items-center justify-between'>
              <View>
                <Text className='font-poppins-bold text-[14px] text-neutral-700 mb-1'>
                  💳 Mode de paiement
                </Text>
                <Text className='font-poppins-regular text-neutral-600 text-[13px] capitalize'>
                  {order.method === 'portefeuille' ? 'Portefeuille' : 'Espèces'}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                order.paymentStatus === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <Text className={`text-[11px] font-poppins-semibold ${
                  order.paymentStatus === 'paid' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {order.paymentStatus === 'paid' ? '✓ Payé' : '⏳ En attente'}
                </Text>
              </View>
            </View>
          </View>

          {isCompleted && (
            <View className='bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4'>
              <Text className='font-poppins-bold text-[16px] text-yellow-700 mb-2'>
                🍽️ Commande prête à être récupérée
              </Text>
              <Text className='font-poppins-regular text-yellow-600 text-[13px]'>
                Rendez-vous au restaurant pour récupérer la commande, puis acceptez la livraison.
              </Text>
              
              {/* ✅ Info spécifique au mode de paiement */}
              {order.method === 'portefeuille' && (
                <View className='mt-2 pt-2 border-t border-yellow-300'>
                  <Text className='font-poppins-semibold text-yellow-700 text-[12px]'>
                    ℹ️ Le portefeuille sera débité automatiquement à l'acceptation
                  </Text>
                </View>
              )}
            </View>
          )}

          {isDelivering && (
            <View className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
              <Text className='font-poppins-bold text-[16px] text-blue-700 mb-2'>
                🚴 En cours de livraison
              </Text>
              <Text className='font-poppins-regular text-blue-600 text-[13px]'>
                Une fois arrivé chez le client et après remise de la commande, validez la livraison.
              </Text>
              
              {/* ✅ Rappel pour paiement espèces */}
              {order.method === 'espece' && order.paymentStatus === 'unpaid' && (
                <View className='mt-2 pt-2 border-t border-blue-300'>
                  <Text className='font-poppins-semibold text-blue-700 text-[12px]'>
                    💵 N'oubliez pas de récupérer {order.totalPrice} F en espèces
                  </Text>
                </View>
              )}
            </View>
          )}

          {isDelivered && (
            <View className='bg-green-50 p-4 rounded-lg border border-green-200 mb-4'>
              <Text className='font-poppins-bold text-[16px] text-green-700 mb-2'>
                ✅ Livraison effectuée
              </Text>
              <Text className='font-poppins-regular text-green-600 text-[13px]'>
                Cette commande a été livrée avec succès. Merci pour votre service !
              </Text>
            </View>
          )}

          <View className='bg-gray-50 p-4 rounded-lg mb-4'>
            <Text className='font-poppins-bold text-[14px] text-neutral-700 mb-1'>
              📍 Adresse de livraison
            </Text>
            <Text className='font-poppins-regular text-neutral-600 text-[13px]'>
              {order.deliveryAddress}
            </Text>
          </View>

          <View className='bg-gray-50 p-4 rounded-lg'>
            <Text className='font-poppins-bold text-[14px] text-neutral-700 mb-1'>
              💰 Montant de la commande
            </Text>
            <Text className='font-poppins-bold text-primary-400 text-[18px]'>
              {order.totalPrice.toLocaleString('fr-FR')} F
            </Text>
          </View>
        </View>

        <View className='gap-y-3'>
          {isCompleted && (
            <Pressable 
              className={`rounded-full px-6 py-4 items-center ${
                accepting ? 'bg-neutral-300' : 'bg-primary-400'
              }`}
              onPress={handleAcceptDelivery} 
              disabled={accepting}
            >
              {accepting ? (
                <View className='flex-row items-center gap-x-2'>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className='font-poppins-bold text-white text-[16px]'>
                    {order.method === 'portefeuille' ? 'Débit en cours...' : 'Acceptation en cours...'}
                  </Text>
                </View>
              ) : (
                <Text className='font-poppins-bold text-white text-[16px]'>
                  ✓ Accepter la livraison
                </Text>
              )}
            </Pressable>
          )}

          {isDelivering && (
            <Pressable 
              className={`rounded-full px-6 py-4 items-center ${
                validating ? 'bg-neutral-300' : 'bg-green-500'
              }`}
              onPress={handleValidateDelivery} 
              disabled={validating}
            >
              {validating ? (
                <View className='flex-row items-center gap-x-2'>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className='font-poppins-bold text-white text-[16px]'>
                    Validation en cours...
                  </Text>
                </View>
              ) : (
                <Text className='font-poppins-bold text-white text-[16px]'>
                  🎉 Valider la livraison
                </Text>
              )}
            </Pressable>
          )}

          {isDelivered && (
            <Pressable 
              className='rounded-full px-6 py-4 items-center bg-neutral-200'
              onPress={() => router.back()}
            >
              <Text className='font-poppins-bold text-neutral-600 text-[16px]'>
                Retour
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Delivery;