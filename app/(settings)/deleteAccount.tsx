import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import Slider from 'react-native-slide-to-unlock'
import { router } from 'expo-router'
import { useState } from 'react'
import { deleteUserAccount } from '@/lib/appwrite'
import { useAuth, useUser } from '@clerk/clerk-expo'

const DeleteAccount = () => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sliderCompleted, setSliderCompleted] = useState(false); 
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  const deleteAccount = async () => {
    setSliderCompleted(true); 
    setLoading(true);
    try {
      await deleteUserAccount(getToken, userId);
      await user?.delete();
      router.replace('/')
    } catch (e) {
      console.log('Erreur suppression de compte', e);
      setSliderCompleted(false); 
    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top', 'left', 'right']}>
      <View className='bg-white flex-row gap-x-5 py-5 px-5'>
        <Pressable onPress={() => router.back()}>
          <Image source={images.back} style={{ height: 20, width: 20 }} resizeMode='contain' />
        </Pressable>
        <Text className='font-semibold text-[16px]'>Suppression de compte</Text>
      </View>

      <View className='bg-neutral-100 px-5 flex-col flex-1 pt-5'>
        <View>
          <Text className='font-semibold text-[14px]'>
            Une fois votre compte supprimé, vous perdrez toutes vos données :
          </Text>
          <Text className='font-semibold text-[14px] mt-2'>1. Historique des transactions :</Text>
          <Text className='font-regular text-[13px] text-neutral-600 mb-5'>
            Toutes les informations concernant vos transactions passées, votre répertoire d'adresses, les méthodes de paiement, etc.
          </Text>

          <Text className='font-semibold text-[14px]'>2. Compte Gozem Money (si applicable)</Text>
          <Text className='font-regular text-[13px] text-neutral-600 mb-5'>
            Veuillez utiliser ou retirer le solde positif de votre portefeuille avant la suppression de votre compte.
          </Text>

          <Text className='font-semibold text-[14px]'>3. Points de fidélité et avantages liés</Text>
          <Text className='font-regular text-[13px] text-neutral-600 mb-5'>
            Votre statut Gowin, points accumulés, ainsi que les avantages liés à votre niveau actuel seront perdus.
          </Text>

          <Text className='font-semibold text-[14px] mb-3'>
            Oui, je souhaite supprimer mon compte et consens à perdre toutes les informations liées.
          </Text>
        </View>

        {/* --- Zone de validation --- */}
        <View className='flex-1 flex-col justify-between pb-5'>
          {/* --- Case à cocher --- */}
          <View className='border-neutral-200 flex-row gap-x-3 items-center pt-5' style={{ borderTopWidth: 1 }}>
            <Pressable
              className={`border-neutral-300 rounded-full ${confirmed ? 'bg-red-500' : ''}`}
              style={{ width: 25, height: 25, borderWidth: 2 }}
              hitSlop={20}
              onPress={() => setConfirmed(prev => !prev)}
            >
              <Image
                source={images.checked}
                style={{ width: '100%', height: '100%' }}
                tintColor={confirmed ? '#ef4444' : '#B0B3B2'}
              />
            </Pressable>

            <Text className='font-medium text-[13px] text-neutral-500 flex-1'>
              Oui, je souhaite supprimer mon compte et consens à perdre toutes les informations liées.
            </Text>
          </View>

          <View className='mt-8'>
            {sliderCompleted ? (
              // Afficher un slider "verrouillé" visuellement
              <View
                style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 50,
                  overflow: 'hidden',
                  height: 60,
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    borderRadius: 50,
                    width: 50,
                    height: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    position: 'absolute',
                    right: 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size={'large'} color={'red'} />
                  ) : (
                    <Image
                      source={images.del}
                      style={{ width: '50%', height: '50%' }}
                      resizeMode='contain'
                      tintColor={'#dc2626'}
                    />
                  )}
                </View>
                <Text
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: '500',
                    flex: 1,
                  }}
                >
                  Suppression en cours...
                </Text>
              </View>
            ) : (
              <View
                style={{
                  opacity: confirmed ? 1 : 0.5,
                }}
                pointerEvents={confirmed ? 'auto' : 'none'}
              >
                <Slider
                  onEndReached={deleteAccount}
                  onSlideStart={() => {}}
                  onSlideEnd={() => {}}
                  containerStyle={{
                    backgroundColor: confirmed ? '#dc2626' : '#e5e5e5',
                    borderRadius: 50,
                    overflow: 'hidden',
                    height: 60,
                    justifyContent: 'center',
                    paddingHorizontal: 8,
                  }}
                  sliderElement={
                    <View
                      style={{
                        borderRadius: 50,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        zIndex: 10,
                      }}
                    >
                      <Image
                        source={images.del}
                        style={{ width: '50%', height: '50%' }}
                        resizeMode='contain'
                        tintColor={confirmed ? '#dc2626' : '#B0B3B2'}
                      />
                    </View>
                  }
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: confirmed ? 'white' : '#a3a3a3',
                      fontWeight: '500',
                    }}
                  >
                    Glissez pour confirmer la suppression
                  </Text>
                </Slider>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DeleteAccount