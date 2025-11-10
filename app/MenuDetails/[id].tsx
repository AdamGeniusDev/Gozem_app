import { images } from '@/constants';
import { getMenu } from '@/lib/appwrite';
import useAppwrite from '@/lib/useAppwrite';
import { UseCartStore } from '@/store/cart.store';
import { CustomizationType, Menu, Supplement } from '@/types/type';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MenuDetails = () => {
  const { id } = useLocalSearchParams();
  const { fromSearchGlobal,fromSearchLocal, isRestaurantOpen , editMode,customizationKey} = useLocalSearchParams<{ 
    fromSearchGlobal?: string | string[];
    fromSearchLocal?: string | string[];
    isRestaurantOpen?: string | string[];
    editMode?: string | string[];
    customizationKey?: string | string[];
  }>();


  const restaurantIsOpen = isRestaurantOpen === undefined || 
                          isRestaurantOpen === null || 
                          isRestaurantOpen === 'true';

  const { data: menu, loading } = useAppwrite<Menu>({
    fn: () => getMenu(id as string),
  });

  const insets = useSafeAreaInsets();

 
  const addItem = UseCartStore((state) => state.addItem);
  const updateItem = UseCartStore((state) => state.updateItem);
  const items = UseCartStore((state) => state.items);

  const existingItem = useMemo(() => {
  if (editMode === 'true' && customizationKey) {
    return items.find((i) => 
      i.$id === id && 
      JSON.stringify(i.customizations || []) === customizationKey
    );
  }
  
  return null;
}, [items, id, editMode, customizationKey]);


  const [count, setCount] = useState(1);
  const [selectedSupplements, setSelectedSupplements] = useState<CustomizationType[]>([]);
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');

  // Initialiser les states avec l'item existant au focus
  useFocusEffect(
    useCallback(() => {
      if (existingItem) {
        setCount(existingItem.quantity || 1);
        setSelectedSupplements(existingItem.customizations || []);
        setSelectedAccompagnement(
          existingItem.customizations?.find((c) => c.accompagnement)?.accompagnement?.[0] || null
        );
        setInstructions(existingItem.instructions || '');
      } else {
        // Réinitialiser si pas d'item existant
        setCount(1);
        setSelectedSupplements([]);
        setSelectedAccompagnement(null);
        setInstructions('');
      }
    }, [existingItem])
  );

  // Réinitialiser tout au blur (quand on quitte la page)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setCount(1);
        setSelectedSupplements([]);
        setSelectedAccompagnement(null);
        setInstructions('');
      };
    }, [])
  );

  // Données du menu
  const accompagnement = useMemo(
    () => (Array.isArray(menu?.accompagnement) ? menu!.accompagnement : []),
    [menu]
  );
  const supplements = useMemo(
    () => (Array.isArray(menu?.supplements) ? (menu!.supplements as Supplement[]) : []),
    [menu]
  );

  // Calcul du prix
  const supplementPrice = useMemo(
    () => selectedSupplements.reduce((sum, s) => sum + s.price * s.quantity, 0),
    [selectedSupplements]
  );

  const price = useMemo(() => {
    if (!menu?.normalPrice) return 0;
    const basePrice = menu.normalPrice === menu.reductionPrice ? menu.normalPrice : menu.reductionPrice;
    return basePrice * count + supplementPrice;
  }, [menu?.normalPrice, menu?.reductionPrice, count, supplementPrice]);

  const isButtonDisabled = useMemo(() => {

    if (!restaurantIsOpen) return true;
    
    
    
    return false;
  }, [restaurantIsOpen]);

  const toggleSupplement = useCallback((supplement: Supplement) => {
    if (!restaurantIsOpen) return;
    
    setSelectedSupplements((prev) => {
      const existing = prev.find((s) => s.$id === supplement.$id);

      if (existing) {
        return prev.map((s) =>
          s.$id === supplement.$id ? { ...s, quantity: s.quantity + 1 } : s
        );
      } else {
        return [
          ...prev,
          {
            $id: supplement.$id,
            name: supplement.supplementName,
            price: supplement.supplementPrice,
            quantity: 1,
          },
        ];
      }
    });
  }, [restaurantIsOpen]);

  // Remove supplement
  const removeSupplement = useCallback((supplementId: string) => {
    if (!restaurantIsOpen) return;
    
    setSelectedSupplements((prev) => {
      const existing = prev.find((s) => s.$id === supplementId);

      if (existing && existing.quantity > 1) {
        return prev.map((s) =>
          s.$id === supplementId ? { ...s, quantity: s.quantity - 1 } : s
        );
      } else {
        return prev.filter((s) => s.$id !== supplementId);
      }
    });
  }, [restaurantIsOpen]);



const handleAddToCart = useCallback(() => {

  if (!restaurantIsOpen) {
    Alert.alert(
      'Restaurant fermé',
      'Ce restaurant est actuellement fermé. Vous ne pouvez pas ajouter d\'articles au panier.',
      [{ text: 'OK' }]
    );
    return;
  }

  if (accompagnement.length > 0 && !selectedAccompagnement) {
    Alert.alert(
      'Accompagnement requis',
      'Veuillez sélectionner un accompagnement avant de continuer',
      [{ text: 'OK' }]
    );
    return;
  }

  if (!menu) return;

  
  const customizations: CustomizationType[] = [];

  
  selectedSupplements.forEach(supp => {
    
    const existingSupp = customizations.find(c => c.$id === supp.$id);
    if (!existingSupp) {
      customizations.push({ ...supp });
    }
  });

  
  if (selectedAccompagnement) {
    
    const hasAccompagnement = customizations.some(c => c.accompagnement);
    if (!hasAccompagnement) {
      customizations.push({
        $id: 'accompagnement',
        name: selectedAccompagnement,
        price: 0,
        quantity: 1,
        accompagnement: [selectedAccompagnement],
      });
    }
  }

  if (editMode === 'true' && existingItem) {
    
    updateItem(menu.$id, existingItem.customizations ?? [], {
      quantity: count,
      customizations: customizations,
      instructions: instructions,
    });
  } 
  else {
    
    addItem({
      $id: menu.$id,
      restaurantId: menu.restaurantId,
      menuName: menu.menuName,
      normalPrice: menu.normalPrice,
      reductionPrice: menu.reductionPrice,
      description: menu.description,
      customizations: customizations.length > 0 ? customizations : undefined,
      quantity: count,
      instructions: instructions,
    });
  }

  if (fromSearchGlobal === 'yes' || fromSearchLocal === 'yes') {
    router.push(`/RestaurantDetails/${menu.restaurantId}`);
  } else {
    router.back();
  }
}, [
  restaurantIsOpen,
  accompagnement.length,
  selectedAccompagnement,
  menu,
  existingItem,
  selectedSupplements,
  count,
  instructions,
  fromSearchGlobal,
  fromSearchLocal,
  editMode,
  updateItem,
  addItem,
]);

  const incrementCount = useCallback(() => {
    if (!restaurantIsOpen) return;
    setCount((c) => c + 1);
  }, [restaurantIsOpen]);

  const decrementCount = useCallback(() => {
    if (!restaurantIsOpen) return;
    setCount((c) => Math.max(1, c - 1));
  }, [restaurantIsOpen]);

  const selectAccompagnement = useCallback((item: string) => {
    if (!restaurantIsOpen) return;
    setSelectedAccompagnement(item);
  }, [restaurantIsOpen]);

  // Render accompagnement
  const renderAccompagnement = useCallback(
    ({ item }: { item: string }) => {
      const isSelected = selectedAccompagnement === item;

      return (
        <Pressable 
          onPress={() => selectAccompagnement(item)} 
          className='mb-3'
          disabled={!restaurantIsOpen}
        >
          <View
            className={`flex-row items-center gap-x-2 ${
              isSelected ? 'bg-primary-50' : ''
            } ${!restaurantIsOpen ? 'opacity-50' : ''} px-2 py-2 rounded-lg`}
          >
            <Image
              source={isSelected ? images.checked : images.cocher}
              className='size-6'
              resizeMode='contain'
              tintColor={isSelected ? '#48681B' : '#737373'}
            />
            <Text
              className={`text-[16px] ${
                isSelected ? 'font-semibold text-primary-600' : 'text-neutral-700'
              }`}
            >
              {item}
            </Text>
          </View>
        </Pressable>
      );
    },
    [selectedAccompagnement, selectAccompagnement, restaurantIsOpen]
  );

  // Render supplement
  const renderSupplement = useCallback(
    ({ item }: { item: Supplement }) => {
      const selected = selectedSupplements.find((s) => s.$id === item.$id);
      const quantity = selected?.quantity || 0;

      return (
        <View
          className={`mb-3 flex-row items-center gap-x-2 px-3 py-2 rounded-lg ${
            quantity > 0 ? 'bg-primary-50' : ''
          } ${!restaurantIsOpen ? 'opacity-50' : ''}`}
        >
          {quantity > 0 ? (
            <View className='flex-row gap-x-2 items-center'>
              <Pressable 
                onPress={() => removeSupplement(item.$id)} 
                hitSlop={15}
                disabled={!restaurantIsOpen}
              >
                <Image
                  source={images.moins}
                  className='size-6'
                  resizeMode='contain'
                  tintColor={'#48681B'}
                />
              </Pressable>
              <Text className='font-bold text-[16px] pt-2 text-primary-600 min-w-[20px] text-center'>
                {quantity}
              </Text>
              <Pressable 
                onPress={() => toggleSupplement(item)} 
                hitSlop={15}
                disabled={!restaurantIsOpen}
              >
                <Image
                  source={images.dest}
                  className='size-6'
                  resizeMode='contain'
                  tintColor={'#48681B'}
                />
              </Pressable>
            </View>
          ) : (
            <Pressable 
              onPress={() => toggleSupplement(item)}
              disabled={!restaurantIsOpen}
            >
              <Image
                source={images.dest}
                className='size-6'
                resizeMode='contain'
                tintColor='#737373'
              />
            </Pressable>
          )}

          <View className='flex-row justify-between flex-1 px-2 items-center'>
            <View className='flex-1'>
              <Text className={`text-[14px] text-neutral-900`}>{item.supplementName}</Text>
            </View>

            <View className='justify-center items-end'>
              <Text
                className={`text-[15px] font-semibold ${
                  quantity > 0 ? 'text-primary-600' : 'text-neutral-700'
                }`}
              >
                {quantity > 0 ? item.supplementPrice * quantity : item.supplementPrice} F
              </Text>
              {quantity > 1 && (
                <Text className='text-[11px] text-neutral-500 mt-0.5'>
                  P.U: {item.supplementPrice} F
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [selectedSupplements, toggleSupplement, removeSupplement, restaurantIsOpen]
  );

  // Loading
  if (loading || !menu) {
    return (
      <View className='flex-1 bg-white items-center justify-center'>
        <ActivityIndicator size='large' color='#48681B' />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className='flex-1'
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    >
      {/* Bouton retour */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          width: 45,
          height: 45,
          borderRadius: 50,
          elevation: 5,
          marginTop: insets.top + 10,
          zIndex: 50,
          left: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <Image
          source={images.back}
          style={{ width: '60%', height: '60%' }}
          resizeMode='contain'
        />
      </Pressable>

      {/* Bouton voir le marchand */}
      {fromSearchGlobal === 'yes' && (
        <Pressable
          className='flex-row py-3 px-3 gap-x-3 items-center'
          style={{
            position: 'absolute',
            borderRadius: 5,
            elevation: 5,
            marginTop: insets.top + 10,
            zIndex: 50,
            right: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
          }}
          hitSlop={20}
          onPress={() => router.push(`/RestaurantDetails/${menu.restaurantId}`)}
        >
          <Image source={images.boutique} className='size-4' resizeMode='contain' />
          <Text className='font-semibold text-[14px] text-black'> Voir le marchand</Text>
        </Pressable>
      )}

      {/* Bandeau restaurant fermé */}
      {!restaurantIsOpen && (
        <View 
          className='absolute left-0 right-0 bg-red-500 py-2 px-4 items-center justify-center z-40'
          style={{ marginTop: insets.top + 65 }}
        >
          <Text className='text-white font-semibold text-[14px] text-center'>
            🔒 Restaurant fermé - Commande impossible
          </Text>
        </View>
      )}

      <ScrollView
        className='bg-white'
        contentContainerStyle={{ paddingBottom: 90, paddingTop: !restaurantIsOpen ? 40 : 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image du menu */}
        <View style={{ height: 300, width: '100%' }} className='items-center justify-center'>
          <Image
            source={{ uri: menu.menuImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode='cover'
          />
          
          {/* Overlay si restaurant fermé */}
          {!restaurantIsOpen && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className='text-white font-poppins-bold text-[18px]'>Restaurant Fermé</Text>
            </View>
          )}
          
          {menu.normalPrice !== menu.reductionPrice && (
            <View className='bg-primary-400 absolute items-center justify-center' style={{width: 60, height: 60, borderRadius: 100, bottom: 10, left: 10, elevation: 5}}>
              <Image source={images.treduction} className='size-7' tintColor={'#ffffff'} />
              <Text className='font-semibold text-white' style={{fontSize: 8}}>Promo</Text>
            </View>
          )}
        </View>

        {/* Informations du menu */}
        <View
          className='px-5 py-4'
          style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
        >
          <Text className='font-poppins-bold text-[20px]'>{menu.menuName}</Text>
          <Text className='text-[14px] text-neutral-500 mt-1'>{menu.description}</Text>
        </View>

        {/* Prix */}
        <View className='px-5 py-5' style={{ height: 90 }}>
          <View className='flex-row items-center gap-x-3'>
            <View
              className='rounded-xl bg-neutral-200 gap-x-3 flex-row items-center justify-center px-2 py-3'
              style={{ width: 110 }}
            >
              {menu.normalPrice !== menu.reductionPrice && (
                <Image source={images.treduction} className='size-5' tintColor={'#48681B'} />
              )}
              <Text className='font-poppins-bold text-[16px] text-neutral-600'>
                {menu.normalPrice === menu.reductionPrice ? menu.normalPrice : menu.reductionPrice} F
              </Text>
            </View>
            
            {/* Prix barré si promotion */}
            {menu.normalPrice !== menu.reductionPrice && (
              <View className='flex-row items-center gap-x-2'>
                <View style={{ position: 'relative' }}>
                  <Text className='text-[14px] text-neutral-400 font-medium'>
                    {menu.normalPrice} F
                  </Text>
                  <View 
                    style={{ 
                      position: 'absolute',
                      top: '20%',
                      left: -2,
                      right: -2,
                      height: 1.5,
                      backgroundColor: '#EF4444',
                      transform: [{ rotate: '-8deg' }]
                    }} 
                  />
                </View>
                <View className='bg-red-500 rounded-xl px-2 py-0.5'>
                  <Text className='text-white text-[10px] font-bold'>
                    -{Math.round(((menu.normalPrice - menu.reductionPrice) / menu.normalPrice) * 100)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Accompagnement */}
        {accompagnement.length > 0 && (
          <View>
            <View className='bg-neutral-100 px-5 justify-center' style={{ height: 80 }}>
              <View className='flex-row items-center gap-x-2'>
                <Text className='font-semibold text-[16px]'>Accompagnement 💥</Text>
                <View className='bg-red-500 rounded-full px-2 py-0.5'>
                  <Text className='text-white text-[10px] font-bold'>REQUIS</Text>
                </View>
              </View>
              <Text className='text-[14px] text-neutral-500'>
                Choisissez votre accompagnement
              </Text>
            </View>

            <View className='px-5 pt-5'>
              <FlatList
                data={accompagnement}
                keyExtractor={(item, i) => item + i}
                renderItem={renderAccompagnement}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        {/* Suppléments */}
        {supplements.length > 0 && (
          <View>
            <View className='bg-neutral-100 px-5 justify-center' style={{ height: 80 }}>
              <Text className='font-semibold text-[16px]'>Suppléments 💥</Text>
              <Text className='text-[14px] text-neutral-500'>
                Voulez-vous ajouter quelque chose
              </Text>
            </View>

            <View className='px-5 pt-5'>
              <FlatList
                data={supplements}
                keyExtractor={(item) => item.$id}
                renderItem={renderSupplement}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        {/* Instructions */}
        <View className='px-3 mt-4'>
          <TextInput
            placeholder='Ajouter des instructions supplémentaires aux marchands...'
            className='bg-neutral-100 px-3 py-2 rounded-lg border-neutral-200 border-1 font-regular'
            style={{ height: 120, textAlignVertical: 'top', lineHeight: 20, borderWidth: 1 }}
            multiline
            scrollEnabled
            maxLength={200}
            value={instructions}
            onChangeText={setInstructions}
            editable={restaurantIsOpen}
          />
        </View>

        {/* Compteur de quantité */}
        <View className='items-center justify-center mt-5'>
          <View className='flex-row gap-x-3 items-center justify-center'>
            <Pressable
              className='items-center justify-center'
              style={{ width: 30, height: 30 }}
              onPress={decrementCount}
              disabled={count <= 1 || !restaurantIsOpen}
            >
              <Image
                source={images.moins}
                className='w-full h-full'
                resizeMode='contain'
                tintColor={count <= 1 || !restaurantIsOpen ? '#D1D5DB' : '#48681B'}
              />
            </Pressable>

            <Text className='font-poppins-bold justify-center pt-2' style={{ fontSize: 28 }}>
              {count}
            </Text>

            <Pressable
              className='items-center justify-center'
              style={{ width: 30, height: 30 }}
              onPress={incrementCount}
              disabled={!restaurantIsOpen}
            >
              <Image
                source={images.dest}
                className='w-full h-full'
                style={{ width: 30, height: 30 }}
                resizeMode='contain'
                tintColor={!restaurantIsOpen ? '#D1D5DB' : '#48681B'}
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bouton ajouter au panier */}
      <Pressable
        className={`absolute rounded-full py-4 items-center justify-center ${
          isButtonDisabled ? 'bg-neutral-200' : 'bg-primary-400'
        }`}
        style={{ bottom: 35, right: 15, left: 15, elevation: 5 }}
        onPress={handleAddToCart}
        disabled={isButtonDisabled}
      >
       <Text className='font-semibold text-white text-[16px]'>
        {!restaurantIsOpen 
          ? '🔒 Restaurant fermé' 
          : editMode === 'true'
            ? `Mettre à jour ▪ ${price}F`
            : `Ajouter au panier ▪ ${price}F`
        }
      </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default MenuDetails;