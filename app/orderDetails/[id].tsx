import { getOrder, updateOrder } from '@/lib/appwrite';
import useAppwrite from '@/lib/useAppwrite';
import { OrderWithItemsApp } from '@/types/type';
import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams } from 'expo-router';
import { useState} from 'react';
import { View, Text, ActivityIndicator, Pressable, Animated } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const OrderDetails = () => {
  const { id } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [loadingFinish, setLoadingFinish] = useState(false);
  
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));

  const { data: order, loading, refreshing, refetch } = useAppwrite<OrderWithItemsApp>({
    fn: () => getOrder(id as string, undefined, getToken) as Promise<OrderWithItemsApp>
  });

 
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

     fadeAnim.setValue(0);
      slideAnim.setValue(-20);

    // Animation d'apparition
    Animated.sequence([

      Animated.parallel([
        Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim,{
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      ]),
      
      Animated.delay(2500), // Reste visible 2.5s
      Animated.parallel([
        Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim,{
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
      ]),
      
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const acceptOrder = async () => {
    setLoadingAccept(true);
    try {
      await updateOrder(id as string, 'accepted');
      await refetch();
      showToast('✓ Commande acceptée avec succès !', 'success');
    } catch (e) {
      showToast('Erreur lors de l\'acceptation', 'error');
      console.error(e);
    } finally {
      setLoadingAccept(false);
    }
  };

  const rejectOrder = async () => {
    setLoadingReject(true);
    try {
      await updateOrder(id as string, 'rejected');
      await refetch();
      showToast('Commande rejetée', 'success');
    } catch (e) {
      showToast('Erreur lors du rejet', 'error');
      console.error(e);
    } finally {
      setLoadingReject(false);
    }
  };

  const finishOrder = async () => {
    setLoadingFinish(true);
    try {
      await updateOrder(id as string, 'completed');
      await refetch();
      showToast('✓ Commande marquée comme terminée !', 'success');
    } catch (e) {
      showToast('Erreur lors de la finalisation', 'error');
      console.error(e);
    } finally {
      setLoadingFinish(false);
    }
  };

  if (loading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' color='#48681B' />
        <Text className='text-gray-500 pt-5'>Chargement des détails...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Text className='text-gray-500'>Commande introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
     
      {toastVisible && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            position: 'absolute',
            top: 60,
            left: 20,
            right: 20,
            zIndex: 1000,
          }}
          className={`p-4 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <Text className='text-white font-semibold text-center text-[15px]'>
            {toastMessage}
          </Text>
        </Animated.View>
      )}

      <ScrollView className='flex-1 p-5'>
        <Text className='font-poppins-bold' style={{fontSize: 22}}>
          🎉✨ Vous avez reçu une nouvelle commande !
        </Text>
        
        <Text className='font-poppins-bold text-[18px] mt-4 text-primary-300'>
          Détails de la commande
        </Text>
        
        <View className='flex-row gap-x-3 mt-2'>
          <Text className='font-semibold text-[15px] text-neutral-400'>Nombre de menu :</Text>
          <Text className='font-poppins-bold text-[15px] text-neutral-600'>
            {order.totalItems}
          </Text>
        </View>
        
        <View className='flex-row gap-x-3'>
          <Text className='font-semibold text-[15px] text-neutral-400'>Prix total :</Text>
          <Text className='font-poppins-bold text-[15px] text-neutral-600'>
            {order.subtotalPrice} FCFA
          </Text>
        </View>
        
        <Text className='font-semibold text-[16px] mt-4 text-primary-400'>
          Détails {order.totalItems > 1 ? 'des menus' : 'du menu'}
        </Text>
        
        {order.items?.map((item) => (
          <View 
            key={item.$id} 
            className='mt-3 p-5 border-t border-gray-200 rounded-lg'
          >
            <View className='flex-row gap-x-3'>
              <Text className='font-semibold text-[15px] text-neutral-400'>Nom du menu :</Text>
              <Text className='font-poppins-bold text-[15px] text-neutral-600'>
                {item.menuName}
              </Text>
            </View>
            
            <View className='flex-row gap-x-3'>
              <Text className='font-semibold text-[15px] text-neutral-400'>Quantité :</Text>
              <Text className='font-poppins-bold text-[15px] text-neutral-600'>
                {item.quantity}
              </Text>
            </View>
            
            {item.customizations && item.customizations.length > 0 && (
              <View className='mt-2'>
                {item.customizations.map((custom, index) => (
                  <View key={index}>
                    {custom.accompagnement && Array.isArray(custom.accompagnement) && (
                      <Text className='text-gray-700'>
                        • Accompagnement: {custom.accompagnement.join(', ')}
                      </Text>
                    )}
                    {custom.quantity && custom.name && (
                      <Text className='text-gray-700'>
                        • Supplément: {custom.quantity}x {custom.name} à {custom.price} FCFA/unité
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* ✅ Affichage conditionnel selon le statut */}
      {order.status === 'accepted' ? (
        <View className='p-5 pt-3 border-t border-gray-200'>
          <Pressable 
            className='bg-primary-400 p-4 rounded-lg items-center justify-center' 
            onPress={finishOrder} 
            disabled={loadingFinish || refreshing}
          >
            {loadingFinish ? (
              <ActivityIndicator size='small' color='#FFFFFF' />
            ) : (
              <Text className='font-semibold text-center text-[16px] text-white'>
                Marquer comme terminée
              </Text>
            )}
          </Pressable>
        </View>
      ) : order.status === 'rejected' || order.status === 'completed' ? (
        <View className='p-4 mx-5 mb-5 bg-gray-50 border-2 rounded-lg border-gray-300'>
          <Text className='text-gray-600 font-semibold text-center text-[15px]'>
            {order.status === 'completed' ? '✓ Commande terminée' : '✗ Commande rejetée'}
          </Text>
        </View>
      ) : (
        <View className='flex-row gap-x-3 p-5 pt-3 border-t border-gray-200'>
          <Pressable 
            className='flex-1 bg-white p-4 rounded-lg items-center justify-center border-2 border-red-500' 
            onPress={rejectOrder} 
            disabled={loadingAccept || loadingReject || refreshing}
          >
            {loadingReject ? (
              <ActivityIndicator size='small' color='#EF4444' />
            ) : (
              <Text className='text-red-500 font-semibold text-[16px]'>Rejeter</Text>
            )}
          </Pressable>
          
          <Pressable 
            className='flex-1 bg-primary-400 p-4 rounded-lg items-center justify-center' 
            onPress={acceptOrder} 
            disabled={loadingAccept || loadingReject || refreshing}
          >
            {loadingAccept ? (
              <ActivityIndicator size='small' color='#FFFFFF' />
            ) : (
              <Text className='text-white font-semibold text-[16px]'>Accepter</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderDetails;