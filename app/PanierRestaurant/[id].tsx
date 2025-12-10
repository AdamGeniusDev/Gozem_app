import { images } from '@/constants';
import { UseCartStore } from '@/store/cart.store';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PanierRestaurant = () => {
  const { id } = useLocalSearchParams();
  const { fromRestaurant } = useLocalSearchParams<{fromRestaurant?: string | string[]}>();

  const items = UseCartStore(state => state.items);
  const clearCart = UseCartStore(state => state.clearCart);
  const totalPrice = UseCartStore(state => state.getTotalPrice(id as string));
  const increaseQty = UseCartStore(state => state.increaseQty);
  const decreaseQty = UseCartStore(state => state.decreaseQty);
  
  const modalUpdateItem = useRef<BottomSheetModal | null>(null);
  const modalDeletePanier = useRef<BottomSheetModal | null>(null);
  
  // ✅ CORRECTION: Stocker l'ID ET les customizations pour identifier l'item exact
  const [selectedItemKey, setSelectedItemKey] = useState<{
    menuId: string;
    customizations: string;
  } | null>(null);
  
  const [modalQuantity, setModalQuantity] = useState(1);

  const restaurantsItems = items.filter((i) => i.restaurantId === id as string);
  
  // ✅ CORRECTION: Trouver l'item exact avec ses customizations
  const selectedItem = selectedItemKey
    ? items.find((c) => 
        c.$id === selectedItemKey.menuId && 
        JSON.stringify(c.customizations || []) === selectedItemKey.customizations
      )
    : null;

  useEffect(() => {
    if (selectedItemKey && selectedItem) {
      setModalQuantity(selectedItem.quantity);
      modalUpdateItem.current?.present();
    }
  }, [selectedItemKey, selectedItem]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const viderPanier = () => {
    modalDeletePanier.current?.present();
  };

  const confirmerViderPanier = () => {
    clearCart(id as string);
    modalDeletePanier.current?.dismiss();
    router.back();
  };

  const garderPanier = () => {
    modalDeletePanier.current?.dismiss();
    router.back();
  };

  const handleBackPress = () => {
    if (fromRestaurant === 'yes') {
      router.back();
    } else {
      router.push({
        pathname: `/RestaurantDetails/${id}` as any,
        params: {
          fromPanier: 'yes'
        }
      });
    }
  };

  const handleModalIncrease = () => {
    setModalQuantity(prev => prev + 1);
  };

  const handleModalDecrease = () => {
    setModalQuantity(prev => Math.max(0, prev - 1));
  };

  const handleUpdateQuantity = () => {
    if (!selectedItem) return;

    const originalQuantity = selectedItem.quantity;
    const difference = modalQuantity - originalQuantity;

    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        increaseQty(selectedItem.$id, selectedItem.customizations);
      }
    } else if (difference < 0) {
      for (let i = 0; i < Math.abs(difference); i++) {
        decreaseQty(selectedItem.$id, selectedItem.customizations);
      }
    }

    modalUpdateItem.current?.dismiss();
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='px-5'>
        <View className='bg-white flex-row gap-x-5 items-center' style={{ marginTop: 15 }}>
          <Pressable onPress={handleBackPress} hitSlop={15}>
            <Image source={images.back} className='size-6' resizeMode='contain' />
          </Pressable>
          <View className='flex-1 justify-between flex-row items-center'>
            <Text className='font-semibold text-[16px]'>Mon panier</Text>
            <Pressable 
              className='bg-neutral-200 px-3' 
              style={{ borderRadius: 15, paddingVertical: 10 }} 
              onPress={viderPanier}
            >
              <Text className='font-semibold text-[14px] text-neutral-700'>Vider mon panier</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className='flex-1 px-5' style={{ marginTop: 25 }}>
        <Text className='font-poppins-bold text-[22px]'>Articles</Text>
        
        <FlatList
          data={restaurantsItems}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingBottom: 220
          }}
          keyExtractor={(item, index) => `${item.$id}-${index}-${JSON.stringify(item.customizations)}`}
          renderItem={({ item }) => {
            const hasAccompagnement = item.customizations?.some((c: any) => c.accompagnement);
            const supplements = item.customizations?.filter((c: any) => !c.accompagnement) || [];
            const supplementsPrice = item.customizations?.reduce(
              (sum: number, c: any) => sum + (c.price * c.quantity),
              0
            ) || 0;
            const itemTotalPrice = (item.normalPrice + supplementsPrice) * item.quantity;

            return (
              <Pressable 
                className='flex-row gap-x-5 items-center border-neutral-200' 
                style={{ borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15 }}
                onPress={() => {
                  
                  router.push({
                    pathname: `/MenuDetails/${item.$id}` as any,
                    params: {
                      editMode: 'true',
                      customizationKey: JSON.stringify(item.customizations || []),
                      fromRestaurant: 'yes'
                    }
                  });
                }}
              >
                <View className='px-3'>
                  <Text className='text-primary-400 font-poppins-bold text-[16px]'>
                    {item.quantity} x
                  </Text>
                </View>

                <View className='flex-1 flex-row'>
                  <View style={{ width: '70%', rowGap: 5 }}>
                    <Text className='font-medium text-[15px] text-black'>{item.menuName}</Text>
                    <Text numberOfLines={1} className='font-regular text-neutral-600 text-[14px]'>
                      {item.description}
                    </Text>

                    {hasAccompagnement && (
                      <View style={{ marginTop: 5 }}>
                        <Text className='font-semibold text-neutral-600 text-[13px]'>Accompagnement</Text>
                        {item.customizations
                          ?.filter((c: any) => c.accompagnement)
                          .map((c: any, idx: number) => (
                            <Text
                              key={idx}
                              className='text-neutral-600 text-[12px] ml-2'
                              style={{ marginTop: 2 }}
                            >
                              • {c.accompagnement}
                            </Text>
                          ))
                        }
                      </View>
                    )}

                    {supplements.length > 0 && (
                      <View style={{ marginTop: 5 }}>
                        <Text className='font-semibold text-neutral-600 text-[13px]'>Supplement</Text>
                        {supplements.map((supp: any, idx: number) => (
                          <Text
                            key={idx}
                            className='text-neutral-600 text-[12px] ml-2'
                            style={{ marginTop: 2 }}
                          >
                            • {supp.quantity}x {supp.name} - {supp.price * supp.quantity} F
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>

                  <View className='items-center gap-y-2' style={{ width: '30%' }}>
                    <Text className='font-semibold text-[15px]'>{itemTotalPrice} F</Text>
                    <View className='flex-row gap-x-2'>
                      {/* ✅ CORRECTION: Passer l'item complet pour identification */}
                      <Pressable 
                        onPress={() => setSelectedItemKey({
                          menuId: item.$id,
                          customizations: JSON.stringify(item.customizations || [])
                        })}
                      >
                        <Image source={images.moins} className='size-6' resizeMode='contain' tintColor={'#48681B'} />
                      </Pressable>
                      <Text className='font-bold text-[16px] text-primary-600 min-w-[20px] text-center'>
                        {item.quantity}
                      </Text>
                      <Pressable 
                        onPress={() => setSelectedItemKey({
                          menuId: item.$id,
                          customizations: JSON.stringify(item.customizations || [])
                        })}
                      >
                        <Image source={images.dest} className='size-6' resizeMode='contain' tintColor={'#48681B'} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={() => (
            <Pressable
              className='rounded-full gap-x-3 mt-4 flex-row border-primary-400 px-3 py-2'
              style={{ borderWidth: 2, width: '55%' }}
              onPress={handleBackPress}
            >
              <Image source={images.plus} className='size-6' tintColor={'#48681B'} />
              <Text className='text-primary-400 text-[12px]'>Ajouter des articles</Text>
            </Pressable>
          )}
        />
      </View>

      <View 
        className='bg-white absolute px-5 gap-y-2' 
        style={{ height: 200, paddingBottom: 20, bottom: 0, left: 0, right: 0 }}
      >
        <View 
          className='flex-row bg-neutral-100 items-center gap-x-3 rounded-lg px-3' 
          style={{ height: 50 }}
        >
          <Image source={images.panier} className='size-5' tintColor={'#d4d4d4'} />
          <View className='flex-1 flex-row justify-between items-center'>
            <Text className='font-medium text-[15px]'>Sous-Total</Text>
            <Text className='font-medium text-[15px]'>{totalPrice} F</Text>
          </View>
        </View>

        <View 
          className='rounded-lg px-3 flex-row bg-neutral-100 justify-between flex-1 items-center' 
          style={{ height: 50 }}
        >
          <Text className='font-poppins-bold text-primary-400 text-[18px]'>Total</Text>
          <Text className='font-poppins-bold text-primary-400 text-[18px]'>{totalPrice} F</Text>
        </View>

        <Pressable className='rounded-full bg-primary-400 py-4 mb-5 mt-2' onPress={() => router.push(`/FinalPanier/${id}`)}>
          <Text className='font-semibold text-[15px] text-center text-white'>
            Finaliser la commande
          </Text>
        </Pressable>
      </View>

      {/* Modal de mise à jour de quantité */}
      <BottomSheetModal
        ref={modalUpdateItem}
        snapPoints={['38%']}
        handleIndicatorStyle={{ display: 'none' }}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        onDismiss={() => {
          setSelectedItemKey(null);
          setModalQuantity(1);
        }}
      >
        <BottomSheetView className='bg-white'>
          <View 
            className='justify-center flex-1 pb-5 border-neutral-300 items-center gap-y-4 py-3' 
            style={{ borderBottomWidth: 1 }}
          >
            <View className='items-center justify-center px-5 flex-1'>
              <Text className='font-poppins-bold text-[18px]' numberOfLines={1}>
                {selectedItem?.menuName}
              </Text>
              <Text className='font-medium text-neutral-600 text-[15px] text-center'>
                {selectedItem?.description}
              </Text>
            </View>
          </View>

          <View className='flex-row gap-x-4 mt-5 items-center justify-center'>
            <Pressable onPress={handleModalDecrease}>
              <Image source={images.moins} style={{width: 35, height: 35}} resizeMode='contain' tintColor={'#48681B'} />
            </Pressable>
            <Text style={{fontSize: 30}} className='font-poppins-bold text-primary-600 min-w-[20px] text-center pt-2'>
              {modalQuantity}
            </Text>
            <Pressable onPress={handleModalIncrease}>
              <Image source={images.dest} style={{width: 35, height: 35}} resizeMode='contain' tintColor={'#48681B'} />
            </Pressable>
          </View>

          {modalQuantity > 0 && (
            <Text className='font-regular text-[12px] text-center mt-2'>
              Accompagnement et supplements inclus
            </Text>
          )}
          
          <View className='px-5 mt-3'>
            <Pressable className='py-3 bg-primary-400 items-center rounded-full' onPress={handleUpdateQuantity}>
              <Text className='font-semibold text-[16px] text-white'>
                {modalQuantity > 0 ? 'Mettre à jour' : 'Retirer du panier'}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Modal de confirmation de sortie */}
      <BottomSheetModal
        ref={modalDeletePanier}
        snapPoints={['35%']}
        handleIndicatorStyle={{ display: 'none' }}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView className='bg-white' style={{flex: 1}}>
          <View 
            className='justify-center flex-1 pb-5 items-center gap-y-4 py-3'
          >
            <View className='items-center justify-center px-5 flex-1'>
              <Text className='font-poppins-bold text-[18px]'>Vider votre Panier?</Text>
              <Text className='font-medium text-neutral-600 text-[15px] text-center'>
                Voulez-vous vraiment vider votre panier? Tous les articles ajoutés seront supprimés
              </Text>
            </View>
          </View>
          
          <View className='gap-y-3 px-5 mt-5'>
            <Pressable 
              className='bg-white rounded-full border-primary-400 items-center py-3' 
              style={{borderWidth: 1}} 
              onPress={confirmerViderPanier}
            >
              <Text className='font-semibold text-[16px] text-primary-300'>Vider le Panier</Text>
            </Pressable>
            <Pressable className='bg-primary-300 rounded-full items-center py-3' onPress={garderPanier}>
              <Text className='text-white font-semibold text-[16px]'>Garder le Panier</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default PanierRestaurant;