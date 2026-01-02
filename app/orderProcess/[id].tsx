import { images, reasons } from '@/constants'
import { getOrder, updateOrder, updateOrderNotificationStatus } from '@/lib/appwrite'
import { sendCompleteNotification } from '@/lib/orderNotification'
import useAppwrite from '@/lib/useAppwrite'
import { useRealtimeOrderStatus } from '@/lib/useRealtimeOrder'
import { getTimeFromDate } from '@/lib/utils'
import { useUserStore } from '@/store/user.store'
import { OrderWithItemsApp } from '@/types/type'
import { useAuth } from '@clerk/clerk-expo'
import BottomSheet, { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { View, Text, BackHandler, Pressable, Image, ImageSourcePropType, useWindowDimensions, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export type ViewInformationProps = {
  title: string
  description: string
  image: ImageSourcePropType
  view: React.ReactNode
}

type OrderStatus = 'pending' | 'accepted' | 'completed' | 'delivering' | 'delivered' | 'rejected' | 'canceled'

const ReasonItem = ({ label, selected, onPress, index }: { 
  label: string
  selected: boolean
  onPress: () => void
  index: number
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center justify-between w-full py-3 h-[65] ${
      index < (reasons.length - 1) ? 'border-b border-neutral-200' : ''
    }`}
    hitSlop={10}
  >
    <Text className="text-[13px] text-neutral-900 font-regular">{label}</Text>
    <Image 
      source={!selected ? images.cocher : images.checked} 
      className='h-[24] w-[24]' 
      style={{ tintColor: selected ? '#169137' : '#B0B3B2' }}
    />
  </Pressable>
)

const SupportButton = ({ tintColor = '#4b5563' }: { tintColor?: string }) => (
  <View className='justify-center items-center w-full gap-y-2 mt-4'>
    <Pressable 
      className='bg-gray-200 rounded-full items-center justify-center' 
      style={{ width: 50, height: 50, overflow: 'hidden' }}
    >
      <Image 
        source={images.aide} 
        style={{ width: '70%', height: '70%' }} 
        resizeMode='contain' 
        tintColor={tintColor} 
      />
    </Pressable>
    <Text className='font-regular text-[12px] text-neutral-600'>
      Chatter avec le support
    </Text>
  </View>
)

const OrderProcess = () => {
  const width = useWindowDimensions().width
  const dotWidth = (width - 45) / 5
  const modalReason = useRef<BottomSheetModal>(null)
  const { id } = useLocalSearchParams()
  const { fromFinal } = useLocalSearchParams<{ fromFinal?: string }>()
  const { getToken } = useAuth()
  const { data: order, loading } = useAppwrite<OrderWithItemsApp>({
    fn: () => getOrder(id as string, undefined, getToken) as Promise<OrderWithItemsApp>
  })
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  
  const champion = useUserStore((state) => state.user)
  const championAvatar = useUserStore((state) => state.avatar)
  const loadUser = useUserStore((state) => state.loadUser)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending')
  const [isValidating, setIsValidating] = useState(false)
  
  const championLoaded = useRef(false)

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior={'none'}
    />
  ), [])
  
  const estimatedArrivalTime = useMemo(() => {
    if (!order?.$createdAt) return '00:00'
    
    try {
      const orderCreationDate = new Date(order.$createdAt)
      orderCreationDate.setMinutes(orderCreationDate.getMinutes() + 15)
      return getTimeFromDate(orderCreationDate)
    } catch (error) {
      console.error('Invalid date format:', error)
      return '00:00'
    }
  }, [order?.$createdAt])

  const activeIndex = useMemo(() => {
    const statusIndexMap: Record<OrderStatus, number> = {
      'pending': 0,
      'accepted': 1,
      'completed': 2,
      'delivering': 3,
      'delivered': 4,
      'rejected': 0,
      'canceled': 4,
    }
    return statusIndexMap[orderStatus]
  }, [orderStatus])

  const championFind = useMemo(() => {
    return orderStatus === 'delivering' && !!order?.championId
  }, [orderStatus, order?.championId])

  const ChampionAvatarUrl = useMemo((): ImageSourcePropType => {
    if (championAvatar?.uri) return { uri: championAvatar.uri }
    return images.utilisateur
  }, [championAvatar?.uri])
  
  const handleValidateDelivery = useCallback(async () => {
    try {
      setIsValidating(true)
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      router.push({
        pathname: '/(restaurants)/pourboire' as any,
        params: { 
          orderId: id as string,
          championId: champion?.$id,
          championName: champion?.name,
          championAvatar: champion?.avatarId
        }
      })
    } catch (error) {
      console.error('Erreur validation livraison:', error)
      setError('Impossible de valider la livraison. Veuillez réessayer.')
    } finally {
      setIsValidating(false)
    }
  }, [id, champion])

  useEffect(() => {
    if (!loading && orderStatus === 'delivering' && order?.championId && !championLoaded.current) {
      championLoaded.current = true
      loadUser(getToken, order.championId)
    }
  }, [loading, orderStatus, order?.championId, loadUser, getToken])

  useEffect(() => {
    const sendNotification = async () => {
      if (
        championFind && 
        orderStatus === 'delivering' && 
        champion?.token && 
        order?.deliveryAddress &&
        order?.livreurNotified === false
      ) {
        try {
          console.log('📤 Envoi de la notification au champion...')
          
          await sendCompleteNotification(
            champion.$id,
            'Nouvelle livraison assignée',
            `Vous avez une nouvelle livraison à effectuer à ${order.deliveryAddress}`,
            `/delivery/${order.$id}`,
            {
              type: 'new_delivery',
            }
          )
          
          await updateOrderNotificationStatus(order.$id, true)
          
          console.log('✅ Notification envoyée et marquée dans la DB')
        } catch (error) {
          console.error('❌ Erreur envoi notification:', error)
        }
      }
    }

    sendNotification()
  }, [championFind, orderStatus, champion?.token, order?.deliveryAddress, champion?.$id, order?.$id, order?.livreurNotified])

  useEffect(() => {
    if (order?.status) {
      setOrderStatus(order.status as OrderStatus)
    }
  }, [order?.status])

  useEffect(() => {
    championLoaded.current = false
  }, [id])

  useRealtimeOrderStatus(id as string, (actualStatut) => {
    console.log('📡 Statut temps réel:', actualStatut)
    setOrderStatus(actualStatut as OrderStatus)
  })

  const canceledOrder = async () => {
    await updateOrder(id as string, 'canceled')
    modalReason.current?.dismiss()
    router.replace({pathname:'/(restaurants)/commandes',params: {initialIndex: '2'}})
  }

  // Composant OrderDetails réutilisable
  const OrderDetails = useCallback(({ statusLabel }: { statusLabel?: string }) => {
    if (loading || !order) {
      return (
        <View className='flex-1 justify-center items-center py-10'>
          <ActivityIndicator size="large" color="#48681B" />
          <Text className='mt-3 text-neutral-500'>Chargement des détails...</Text>
        </View>
      )
    }

    const livraisonPrice = (order?.totalPrice - order?.subtotalPrice) || 0
    
    return (
      <View className='flex-1'>
        <View className='flex-row gap-x-4 items-center gap-y-2'>
          <Image source={images.plat} style={{ width: 18, height: 18 }} resizeMode='contain' tintColor={'#48681B'} />
          <Text className='font-poppins-bold text-[15px] text-primary-400'>Food</Text>
        </View>

        {statusLabel && (
          <Text className='font-poppins-bold text-red-500 text-[15px]'>{statusLabel}</Text>
        )}
        
        {!statusLabel && (
          <Text className='font-regular text-[15px]'>Commande</Text>
        )}

        <View className='mt-3 border-t border-gray-200 pt-3 px-3'>
          {order?.items?.map((item, index) => {
            const basePrice = item.price
            const supplements = item.customizations?.filter((c: any) => !c.accompagnement) || []
            const supplementsPrice = supplements?.reduce((sum: number, c: any) => sum + (c.price * c.quantity), 0)
            const itemTotalPrice = (basePrice + supplementsPrice) * item.quantity

            return (
              <View key={index} className='flex-row gap-x-5 mb-3 px-2'>
                <Text className='font-semibold text-[16px] text-neutral-600'>{item.quantity}x</Text>
                <View className='flex-1 flex-row justify-between'>
                  <View className='flex-1'>
                    <Text className='font-medium text-neutral-600 text-[13px]'>{item.menuName}</Text>

                    {item.customizations && item.customizations.length > 0 && (
                      <View className='mt-2'>
                        {item.customizations.map((custom, idx) => (
                          <View key={idx}>
                            {custom.accompagnement && Array.isArray(custom.accompagnement) && (
                              <View className='mb-1'>
                                <Text className='text-gray-700 text-[13px]'>Accompagnement</Text>
                                <Text className='text-[13px]'>
                                  • {custom.accompagnement.join(', ')}
                                </Text>
                              </View>
                            )}
                            {custom.quantity && custom.name && (
                              <View className='mb-1'>
                                <Text className='text-gray-700 text-[12px]'>Supplément</Text>
                                <Text className='text-[12px]'>
                                  • {custom.quantity}x {custom.name}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text className='font-poppins-bold text-gray-700 text-[14px]'>
                    {itemTotalPrice} F
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        <View className='flex-row border-t border-gray-200 pt-3 justify-between'>
          <Text className='font-medium text-[14px]'>Frais de livraison</Text>
          <Text className='font-semibold text-[14px]'>{livraisonPrice} F</Text>
        </View>

        <View className='flex-row border-t border-b border-gray-200 mt-3 pt-3 justify-between pb-3'>
          <Text className='font-poppins-bold text-[16px]'>Total à payer</Text>
          <Text className='font-poppins-bold text-[16px]'>{order?.totalPrice} F</Text>
        </View>

        <SupportButton />
      </View>
    )
  }, [order, loading])

  const firstView = useCallback(() => <OrderDetails />, [OrderDetails])
  const secondView = firstView
  const thirdView = firstView

  const fourthView = useCallback(() => {
    if (!championFind) {
      return (
        <View className='flex-1 items-center justify-center gap-y-3'>
          <ActivityIndicator size="large" color="#48681B" />
          <Text className='text-regular text-[15px]'>En attente de votre champion...</Text>
        </View>
      )
    }

    return (
      <View className='flex-1 items-center'>
        <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: '#f3f4f6' }} className='mb-4 self-center'>
          <Image source={ChampionAvatarUrl} resizeMode='cover' style={{ width: '100%', height: '100%' }} />
        </View>
        
        <Text className='font-poppins-bold text-[16px]'>{champion?.name || 'Champion'}</Text>
        <Text className='font-regular text-[14px] text-neutral-700 mb-3'>En route pour votre livraison</Text>
        
        <Pressable className='rounded-full bg-primary-400 py-3 px-6'>
          <Text className='text-white font-medium text-[16px]'>Contacter votre champion</Text>
        </Pressable>

        <SupportButton />
      </View>
    )
  }, [championFind, champion, ChampionAvatarUrl])

  const fifthView = useCallback(() => {
    return (
      <View className='flex-1 items-center gap-y-2'>
        <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: '#f3f4f6' }} className='mb-4 self-center'>
          <Image source={ChampionAvatarUrl} resizeMode='cover' style={{ width: '100%', height: '100%' }} />
        </View>
        
        <Text className='font-poppins-bold text-[18px] mb-1'>{champion?.name || 'Champion'}</Text>
        <Text className='font-medium text-[14px] text-neutral-700 mb-4'>✨🎉 Votre champion est arrivé</Text>
        
        <Pressable 
          className={`rounded-full px-6 py-3 ${isValidating ? 'bg-neutral-400' : 'bg-primary-400'}`}
          onPress={handleValidateDelivery}
          disabled={isValidating}
        >
          {isValidating ? (
            <View className='flex-row items-center gap-x-2'>
              <ActivityIndicator size="small" color="white" />
              <Text className='text-white font-semibold'>Validation en cours...</Text>
            </View>
          ) : (
            <Text className='text-white font-semibold text-[15px]'>Valider la réception</Text>
          )}
        </Pressable>

        {error && (
          <Text className='text-red-500 text-[12px] mt-2 text-center px-4'>
            {error}
          </Text>
        )}

        <Text className='text-neutral-500 text-[12px] mt-2 text-center px-4'>
          Confirmez avoir reçu votre commande
        </Text>

        <SupportButton />
      </View>
    )
  }, [champion, ChampionAvatarUrl, isValidating, error, handleValidateDelivery])

  const rejectedView = useCallback(() => {
    if (loading || !order) {
      return (
        <View className='flex-1 justify-center items-center py-10'>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text className='mt-3 text-neutral-500'>Chargement des détails...</Text>
        </View>
      )
    }

    return (
      <View className='flex-1'>
        <View className='bg-red-50 p-4 rounded-lg border border-red-200 mb-4'>
          <View className='flex-row items-center gap-x-3 mb-2'>
            <View className='bg-red-500 rounded-full p-2'>
              <Text className='text-white font-poppins-bold text-[16px]'>✕</Text>
            </View>
            <Text className='font-poppins-bold text-[16px] text-red-600 flex-1'>
              Commande rejetée
            </Text>
          </View>
          <Text className='text-red-700 text-[13px] leading-5'>
            Votre commande a été rejetée par le marchand. Vous ne serez pas débité. Veuillez réessayer avec un autre restaurant.
          </Text>
        </View>

        <SupportButton tintColor='#dc2626' />
      </View>
    )
  }, [loading, order])

  const canceledView = useCallback(() => (
    <OrderDetails statusLabel="Commande annulée" />
  ), [OrderDetails])

  const ViewInformation: ViewInformationProps[] = useMemo(() => [
    {
      title: "En attente d'acceptation...",
      description: "Votre commande est en attente d'acceptation par le marchand.",
      image: images.dorder,
      view: orderStatus === 'rejected' ? rejectedView() : firstView()
    },
    {
      title: "En préparation...",
      description: "Votre commande est en cours de préparation par le marchand.",
      image: images.dcook,
      view: secondView()
    },
    {
      title: "Prête pour la livraison",
      description: "Votre commande est prête à être livrée. Un champion est en route pour la récupérer et vous la livrer.",
      image: images.dready,
      view: thirdView()
    },
    {
      title: "En cours de livraison",
      description: "Votre commande est en cours de livraison par votre champion.",
      image: images.ddelivering,
      view: fourthView()
    },
    {
      title: "Votre livreur est arrivé",
      description: "Votre livreur est arrivé et attend votre confirmation pour valider la commande.",
      image: images.ddelivered,
      view: fifthView()
    }
  ], [orderStatus, firstView, secondView, thirdView, fourthView, fifthView, rejectedView])

  const description = useMemo(() => {
    const statusMap: Record<OrderStatus, string> = {
      'pending': ViewInformation[0].description,
      'accepted': ViewInformation[1].description,
      'completed': ViewInformation[2].description,
      'delivering': ViewInformation[3].description,
      'delivered': ViewInformation[4].description,
      'rejected': "Votre commande a été rejetée par le marchand.",
      'canceled': "Vous avez annulé votre commande"
    }
    return statusMap[orderStatus]
  }, [orderStatus, ViewInformation])

  const title = useMemo(() => {
    const statusMap: Record<OrderStatus, string> = {
      'pending': ViewInformation[0].title,
      'accepted': ViewInformation[1].title,
      'completed': ViewInformation[2].title,
      'delivering': ViewInformation[3].title,
      'delivered': ViewInformation[4].title,
      'rejected': "Commande rejetée",
      'canceled': "Commande annulée"
    }
    return statusMap[orderStatus]
  }, [orderStatus, ViewInformation])

  const image = useMemo(() => {
    const statusMap: Record<OrderStatus, ImageSourcePropType> = {
      'pending': ViewInformation[0].image,
      'accepted': ViewInformation[1].image,
      'completed': ViewInformation[2].image,
      'delivering': ViewInformation[3].image,
      'delivered': ViewInformation[4].image,
      'rejected': images.drejected,
      'canceled': images.dcanceled,
    }
    return statusMap[orderStatus]
  }, [orderStatus, ViewInformation])

  const view = useMemo(() => {
    const statusMap: Record<OrderStatus, React.ReactNode> = {
      'pending': ViewInformation[0].view,
      'accepted': ViewInformation[1].view,
      'completed': ViewInformation[2].view,
      'delivering': ViewInformation[3].view,
      'delivered': ViewInformation[4].view,
      'rejected': ViewInformation[0].view,
      'canceled': canceledView(),
    }
    return statusMap[orderStatus]
  }, [orderStatus, ViewInformation, canceledView])

  const handleBackPress = useCallback(() => {
    if (fromFinal === 'yes') {
      router.replace('/(restaurants)/commandes')
    } else {
      router.back()
    }
  }, [fromFinal])

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBackPress()
          return true
        }
      )

      return () => subscription.remove()
    }, [handleBackPress])
  )

  if (loading && !order) {
    return (
      <SafeAreaView className='flex-1 bg-primary-300' edges={['top', 'left', 'right']}>
        <View className='flex-row justify-between pt-5 pb-3 px-5 items-center'>
          <View className='flex-row gap-x-5 items-center'>
            <Pressable onPress={handleBackPress} hitSlop={15}>
              <Image
                source={images.back}
                className='w-5 h-5'
                tintColor='white'
                resizeMode='contain'
              />
            </Pressable>
            <Text className='text-white font-regular text-[15px]'>
              Suivi de la livraison
            </Text>
          </View>
        </View>

        <View className='flex-1 bg-gray-100 justify-center items-center'>
          <ActivityIndicator size="large" color="#48681B" />
          <Text className='mt-3 text-neutral-500'>Chargement de votre commande...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-300' edges={['top', 'left', 'right']}>
      <View className='flex-row justify-between pt-5 pb-3 px-5 items-center'>
        <View className='flex-row gap-x-5 items-center'>
          <Pressable onPress={handleBackPress}>
            <Image 
              source={images.back} 
              className='w-5 h-5'
              tintColor='white' 
              resizeMode='contain' 
            />
          </Pressable>
          <Text className='text-white font-regular text-[15px]'>
            Suivi de la livraison
          </Text>
        </View>
        
        {orderStatus === 'pending' && (
          <Pressable 
            className='bg-white rounded-full justify-center items-center px-4 py-2' 
            onPress={() => modalReason.current?.present()}
          >
            <Text className='text-primary-300 font-semibold text-[15px]'>
              Annuler
            </Text>
          </Pressable>
        )}
      </View>

      <View className='flex-1 bg-gray-50 pt-3'>
        <Text className='font-regular pl-5 text-[12px] text-neutral-500'>
          Heure d'arrivée estimée
        </Text>
        
        <View className='flex-1 mt-2 px-5'>
          <View className='flex-row gap-x-4 mr-4 items-center mb-2'>
            <Text className='font-poppins-bold text-[24px]'>{estimatedArrivalTime}</Text>
            
            <Text className='font-regular text-neutral-500 text-[12px] flex-1'>
              {description}
            </Text>
          </View>

          <View className='flex-row justify-center mb-4 gap-x-2 px-3'>
            {ViewInformation.map((_, index) => {
              const isCompleted = index < activeIndex
              const isCurrent = index === activeIndex
              const isNext = index === activeIndex + 1
              const isRejected = orderStatus === 'rejected' && index === 0
              
              return (
                <View
                  key={index}
                  className={`h-1 rounded-full ${
                    isRejected 
                      ? 'bg-red-500'
                      : isCompleted || isCurrent
                      ? 'bg-primary-300' 
                      : isNext
                      ? 'bg-primary-100' 
                      : 'bg-neutral-200'
                  }`} 
                  style={{ width: dotWidth }}
                />
              )
            })}
          </View>

          <Text className={`font-regular text-[14px] ${orderStatus === 'rejected' ? 'text-red-600' : 'text-neutral-900'}`}>
            {title}
          </Text>

          <View className='flex-1 mt-5 items-center'>
            <View style={{ height: '50%' }}>
              <Image source={image} className='h-full' resizeMode='contain' />
            </View>
          </View>
          
          <BottomSheet
            index={0}
            snapPoints={['50%', '60%']}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            enableContentPanningGesture={true}
            handleIndicatorStyle={{ marginTop: 5, width: 70, backgroundColor: '#EBEDEC' }}
            backgroundStyle={{
              backgroundColor: 'white',
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -4,  
              },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,  
            }}
          >
            <BottomSheetScrollView className='px-5 py-2' style={{ borderRadius: 30 }}>
              {view}
            </BottomSheetScrollView>
          </BottomSheet>

          <BottomSheetModal
            ref={modalReason}
            snapPoints={['90%']}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            enableBlurKeyboardOnGesture={false}
            enableHandlePanningGesture={false}
            enableContentPanningGesture={false}
            handleIndicatorStyle={{ backgroundColor: 'transparent' }}
            backgroundStyle={{
              backgroundColor: 'white',
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -4,  
              },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,  
            }}
          >
            <BottomSheetView className='flex-1 py-3 px-4' style={{ borderRadius: 30 }}>
              <Text className='font-poppins-bold text-[18px] text-center'>
                Pourquoi souhaitez-vous annuler la commande ?
              </Text>
              
              <View className='py-3'>
                {reasons.map((item, index) => (
                  <ReasonItem 
                    key={index}
                    label={item.main}
                    selected={reason === item.main}
                    onPress={() => setReason(item.main)}
                    index={index}
                  />
                ))}
              </View>

              <Text className='py-3 font-regular text-neutral-600 text-[14px] px-4 text-center'>
                Le marchand prendra en charge votre commande sous peu, voulez-vous malgré tout annuler ?
              </Text>

              {cancelError && (
                <Text className='text-red-500 text-[13px] mb-3 text-center px-4'>
                  {cancelError}
                </Text>
              )}

              <Pressable 
                className={`w-full items-center border-2 py-3 rounded-full ${
                  !reason || isCanceling ? 'bg-gray-100 border-gray-300' : 'bg-white border-primary-400'
                }`}
                onPress={canceledOrder}
                disabled={!reason || isCanceling}
              >
                {isCanceling ? (
                  <View className='flex-row items-center gap-x-2'>
                    <ActivityIndicator size="small" color="#9ca3af" />
                    <Text className='font-medium text-gray-400'>
                      Annulation en cours...
                    </Text>
                  </View>
                ) : (
                  <Text className={`font-medium ${!reason ? 'text-gray-400' : 'text-primary-300'}`}>
                    Annuler la commande
                  </Text>
                )}
              </Pressable>

              <Pressable 
                className='w-full bg-primary-300 items-center py-4 rounded-full mt-3'
                onPress={() => modalReason.current?.dismiss()}
              >
                <Text className='font-medium text-white'>Patienter...</Text>
              </Pressable>
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default OrderProcess