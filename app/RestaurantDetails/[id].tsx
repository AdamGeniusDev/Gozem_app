import { View, Text, Pressable, Image, ActivityIndicator, useWindowDimensions, SectionList, FlatList, BackHandler } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import { useUserStore } from '@/store/user.store';
import { useFavorisStore } from '@/store/favoris.store';
import { getMenuLowPrice, getMenuSpecialities, getRestaurantInformations } from '@/lib/appwrite';
import useAppwrite from '@/lib/useAppwrite';
import { Coords, Menu, Restaurant } from '@/types/type';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import CustomButton from '@/components/CustomButton';
import useLocationStore from '@/store/location.store';
import { CalculateDelaiFromDistance, CalculateDistance, CalculatePriceFromDistance } from '@/lib/map';
import { getTimeFromDate, isRestaurantOpen } from '@/lib/utils';
import { UseCartStore } from '@/store/cart.store';

const RestaurantDetails = () => {
    const { id } = useLocalSearchParams();
    const [modalAddedVisible, setModalAddedVisible] = useState(false);
    const [modalDeleteVisible, setModalDeleteVisible] = useState(false);
    const [addedItem, setAddedItem] = useState<Restaurant | null>(null);
    const [pendingRemoveItem, setPendingRemoveItem] = useState<Restaurant | null>(null);
    const [loadingFavori, setLoadingFavori] = useState(false);
    const [distance, setDistance] = useState<number>(0);
    const [showFixedHeader, setShowFixedHeader] = useState(false);
    const { convertAddress } = useLocationStore();
    const [coords, setCoords] = useState<Coords | null>(null);
    const [menusBySpeciality, setMenusBySpeciality] = useState<any[]>([]);
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const clearCart = UseCartStore(state=>state.clearCart);
     const { width } = useWindowDimensions();
    const sectionListRef = useRef<SectionList>(null);
    
    const user = useUserStore(state => state.user);
    const items = UseCartStore(state => state.items);
    const totalItems = UseCartStore(state => state.getTotalItems(id as string));
    const totalPrice = UseCartStore(state => state.getTotalPrice(id as string))
    const hasItems = items.some((i) => i.restaurantId === id);

    const modalPendingRemoveItem = useRef<BottomSheetModal>(null);
    const modalIsOpen = useRef<BottomSheetModal>(null);

    const { isFavori, addFavori, removeFavori } = useFavorisStore();
    const favoris = isFavori(id as string);

    const { data: restaurant, loading: restaurantLoading } = useAppwrite<Restaurant>({
        fn: () => getRestaurantInformations(id as string),
    });
    
    const { data: menuLowPrice, loading: menuLowPriceLoading } = useAppwrite<Menu>({
        fn: () => getMenuLowPrice(id as string),
    });

    const filteredSpecialities = useMemo(() => {
        if (!restaurant?.specialities) return [];
        
        return restaurant.specialities.filter((speciality) => 
            menusBySpeciality.some((section) => section.id === speciality.$id)
        );
    }, [restaurant?.specialities, menusBySpeciality]);



     useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (hasItems) {
                    modalDeletePanier.current?.present();
                    return true; // Empêche le comportement par défaut
                }
                return false; // Permet le comportement par défaut (retour arrière)
            };
    
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [hasItems])
    );

    //nettoie les modales du demontage
    useFocusEffect(
    useCallback(() => {
        return () => {
            modalDeletePanier.current?.dismiss();
            modalPendingRemoveItem.current?.dismiss();
            modalIsOpen.current?.dismiss();
            setModalAddedVisible(false);
            setModalDeleteVisible(false);
        };
    }, [])
    );
    
    
      const confirmerViderPanier = () => {
        clearCart(id as string);
        modalDeletePanier.current?.dismiss();
        router.back();
      };
    
      const garderPanier = () => {
        modalDeletePanier.current?.dismiss();
        router.back();
      };const modalDeletePanier = useRef<BottomSheetModal | null>(null);

      const handleBackPress = useCallback(() => {
        if (hasItems) {
            modalDeletePanier.current?.present();
        } else {
            router.back();
        }
    }, [hasItems]);


    // Effet global qui charge tout en parallèle
    useEffect(() => {
        let isMounted = true;

        const loadAllData = async () => {
            if (!restaurant) return;

            try {
                setIsGlobalLoading(true);

                // Charger tout en parallèle
                const [coordsResult, menusResult] = await Promise.allSettled([
                    // 1. Charger les coordonnées et la distance
                    (async () => {
                        if (!restaurant.address) return null;
                        const c = await convertAddress({ address: restaurant.address });
                        if (c && isMounted) {
                            const dist = CalculateDistance({ lat: c.latitude, lon: c.longitude });
                            return { coords: c, distance: dist ?? 0 };
                        }
                        return null;
                    })(),

                    // 2. Charger les menus par spécialité
                    (async () => {
                        if (!restaurant.specialities || restaurant.specialities.length === 0) return [];

                        const sectionsData = await Promise.all(
                            restaurant.specialities.map(async (spec) => {
                                try {
                                    const menus = await getMenuSpecialities(restaurant.$id, spec.$id);
                                    return {
                                        title: spec.specialityName,
                                        id: spec.$id,
                                        data: menus as Menu[]
                                    };
                                } catch (error) {
                                    console.log(`Erreur pour la spécialité ${spec.specialityName}:`, error);
                                    return null;
                                }
                            })
                        );

                        return sectionsData.filter(
                            (section) => section !== null && section.data && section.data.length > 0
                        );
                    })()
                ]);

                // Mettre à jour les states si le composant est toujours monté
                if (isMounted) {
                    if (coordsResult.status === 'fulfilled' && coordsResult.value) {
                        setCoords(coordsResult.value.coords);
                        setDistance(coordsResult.value.distance);
                    }

                    if (menusResult.status === 'fulfilled' && menusResult.value) {
                        setMenusBySpeciality(menusResult.value);
                    }
                }
            } catch (error) {
                console.error('Erreur chargement données:', error);
            } finally {
                if (isMounted) {
                    setIsGlobalLoading(false);
                }
            }
        };

        // Attendre que le restaurant soit chargé
        if (!restaurantLoading && restaurant) {
            loadAllData();
        }

        return () => {
            isMounted = false;
        };
    }, [restaurant, restaurantLoading, convertAddress]);

    const sections = useMemo(() => menusBySpeciality, [menusBySpeciality]);

    const scrollToSection = useCallback((sectionId: string) => {
        const index = sections.findIndex((sec) => sec.id === sectionId);

        if (index !== -1 && sectionListRef.current) {
            sectionListRef.current.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewPosition: 0,
            });
        }
    }, [sections]);

    useFocusEffect(
        useCallback(() => {
            setShowFixedHeader(false);
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            return () => {
                modalDeletePanier.current?.dismiss();
                modalPendingRemoveItem.current?.dismiss();
                setModalAddedVisible(false);
                setModalDeleteVisible(false);
            };
        }, [])
        );


    const restaurantStatus = useMemo(() => {
        if (!restaurant?.openTime || !restaurant?.closeTime) {
            return {
                isOpen: false,
                openTime: '',
                closeTime: '',
                message: 'Horaires non disponibles'
            };
        }

        const openTime = getTimeFromDate(restaurant.openTime);
        const closeTime = getTimeFromDate(restaurant.closeTime);
        const currentTime = getTimeFromDate(new Date());
        const isOpen = isRestaurantOpen(currentTime, openTime, closeTime);

        return {
            isOpen,
            openTime,
            closeTime,
            message: isOpen ? '' : 'Le restaurant est actuellement fermé'
        };
    }, [restaurant?.openTime, restaurant?.closeTime]);

    const deliveryInfo = useMemo(() => {
        const price = CalculatePriceFromDistance({ distance });
        const delai = CalculateDelaiFromDistance({ distance });
        const isHorsPortee = delai.toLowerCase().includes('hors de portée') ||
                            delai.toLowerCase().includes('hors de portee');

        return { price, delai, isHorsPortee };
    }, [distance]);

    const overlayContent = useMemo(() => {
        if (deliveryInfo.isHorsPortee) {
            return {
                show: true,
                message: 'Marchand hors de votre zone de livraison'
            };
        }
        if (!restaurantStatus.isOpen) {
            return {
                show: true,
                message: `Fermé • Ouvre à ${restaurantStatus.openTime}`
            };
        }
        return { show: false, message: '' };
    }, [deliveryInfo.isHorsPortee, restaurantStatus]);

    const handleScroll = useCallback((event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.y;
        setShowFixedHeader(scrollPosition > 50);
    }, []);

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

    const handleIsOpen = useCallback((menu: Menu) => {
  if (!restaurantStatus.isOpen) {
    modalIsOpen.current?.present(); 
  } else {
    router.push({
      pathname: `/MenuDetails/${menu.$id}` as any,
      params: {
        isRestaurantOpen: restaurantStatus.isOpen ? 'true' : 'false',
        restaurantName: restaurant?.restaurantName || ''
      }
    });
  }
}, [restaurantStatus.isOpen, restaurant?.restaurantName]);

    const toggleFavoris = useCallback(async () => {
        if (!user) {
            alert("Vous devez être connecté pour ajouter un favori");
            return;
        }

        if (loadingFavori || !restaurant) return;

        setLoadingFavori(true);

        try {
            if (favoris) {
                modalPendingRemoveItem.current?.present();
                setPendingRemoveItem(restaurant);
            } else {
                await addFavori(user.$id, id as string);
                
                setModalAddedVisible(true);
                setAddedItem(restaurant);
                
                setTimeout(() => {
                    setModalAddedVisible(false);
                    setAddedItem(null);
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur toggle favori:', error);
            alert('Une erreur est survenue');
        } finally {
            setLoadingFavori(false);
        }
    }, [user, restaurant, id, favoris, loadingFavori, addFavori]);

    const confirmRemovedFavori = useCallback(async () => {
        if (!pendingRemoveItem || !user) return;

        try {
            await removeFavori(user.$id, pendingRemoveItem.$id);

            modalPendingRemoveItem.current?.dismiss();
            setModalDeleteVisible(true);
            
            setTimeout(() => {
                setModalDeleteVisible(false);
                setPendingRemoveItem(null);
            }, 2000);
        } catch (error) {
            console.error('Erreur suppression favori:', error);
            alert('Une erreur est survenue');
        }
    }, [pendingRemoveItem, user, removeFavori]);

    // Afficher le loader global
    if (restaurantLoading || menuLowPriceLoading || isGlobalLoading) {
        return (
            <SafeAreaView className='flex-1 bg-white'>
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator size='large' color='#48681B' />
                    
                </View>
            </SafeAreaView>
        );
    }

    if (!restaurant) {
        return (
            <SafeAreaView className='flex-1 bg-white'>
                <View className='flex-1 items-center justify-center'>
                    <Text className='font-regular text-[16px] text-neutral-500'>Restaurant introuvable</Text>
                </View>
            </SafeAreaView>
        );
    }

    const columnWidth = (width - 30) / 4;

    const ListHeaderComponent = () => (
        <View>
            <View style={{ height: 250 }}>
                <View style={{ height: 200, overflow: 'hidden' }}>
                    <Image 
                        source={{ uri: restaurant.restaurantBanner }} 
                        resizeMode='cover' 
                        className='w-full h-full'
                    />

                    {overlayContent.show && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 16
                            }}
                        >
                            <Text className='text-white font-poppins-bold text-[16px] text-center'>
                                {overlayContent.message}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={{ 
                    position: 'absolute', 
                    width: 100, 
                    height: 100, 
                    borderRadius: 50, 
                    overflow: 'hidden', 
                    bottom: 0, 
                    left: 25,
                    backgroundColor: 'white'
                }}>
                    <Image 
                        source={{ uri: restaurant.restaurantLogo }} 
                        className='w-full h-full' 
                        resizeMode='contain' 
                    />
                </View>
            </View>

            <View className='px-5 py-2'>
                <View className='flex-row justify-between items-center'>
                    <Text numberOfLines={1} style={{ width: '80%' }} className='font-poppins-bold text-[22px]'>
                        {restaurant.restaurantName}
                    </Text>

                    <Pressable 
                        className='bg-neutral-100 items-center justify-center' 
                        style={{ height: 30, width: 30, borderRadius: 15 }}
                    >
                        <Image 
                            source={images.droite} 
                            resizeMode='contain' 
                            style={{ height: '50%', width: '50%' }} 
                        />
                    </Pressable>
                </View>

                <View className='flex-row w-full mt-5'>
                    <View 
                        className='items-center border-r border-neutral-300' 
                        style={{ width: columnWidth }}
                    >
                        <View className='flex-row gap-x-2 items-center'>
                            <Image 
                                source={images.etoile} 
                                style={{ width: 15, height: 15 }} 
                                tintColor={'#737373'}
                            />
                            <View style={{ height: 20 }}>
                                <Text className='font-poppins-bold text-[16px]'>
                                    {restaurant.rating}
                                </Text>
                            </View>  
                        </View>
                        <Text 
                            className='font-regular text-[13px] text-neutral-500' 
                            style={{ paddingTop: 5 }}
                        >
                            {restaurant.numberOpinion} avis
                        </Text>
                    </View>

                    <View 
                        className='items-center border-r border-neutral-300' 
                        style={{ width: columnWidth }}
                    >
                        <View style={{ height: 20 }}>
                            <Text className='font-poppins-bold text-[16px]'>
                                {menuLowPrice?.normalPrice || 'N/A'}
                            </Text>
                        </View>
                        <Text 
                            className='font-regular text-[13px] text-neutral-500' 
                            style={{ paddingTop: 5 }}
                        >
                            Achat min
                        </Text>
                    </View>

                    <View 
                        className='items-center border-r border-neutral-300' 
                        style={{ width: columnWidth }}
                    >
                        <View style={{ height: 20 }}>
                            <Text className='font-poppins-bold text-[16px]'>
                                {deliveryInfo.price} F
                            </Text>
                        </View>
                        <Text 
                            className='font-regular text-[13px] text-neutral-500' 
                            style={{ paddingTop: 5 }}
                        >
                            Livraison
                        </Text>
                    </View>

                    <View 
                        className='items-center' 
                        style={{ width: columnWidth }}
                    >
                        <View style={{ height: 20 }}>
                            <Text className='font-poppins-bold text-[16px]'>
                                {deliveryInfo.delai}
                            </Text>
                        </View>
                        <Text 
                            className='font-regular text-[13px] text-neutral-500' 
                            style={{ paddingTop: 5 }}
                        >
                            mins
                        </Text>
                    </View>
                </View>
            </View>

            <View style={{ backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10 }}>
                <Pressable 
                    className='flex-row gap-x-3 items-center px-3 bg-neutral-100 rounded-lg' 
                    style={{ height: 45 }} 
                    onPress={() => router.push(`/Search/${id as string}`)}
                >
                    <Image source={images.search} className='size-6' resizeMode='contain' tintColor={'#737373'} />
                    <Text numberOfLines={1} className='text-neutral-500 flex-1'>
                        Rechercher dans {restaurant.restaurantName}
                    </Text>
                </Pressable>
            </View>

            {filteredSpecialities.length > 0 && (
                <FlatList
                    data={filteredSpecialities}
                    horizontal
                    contentContainerStyle={{ columnGap: 10, paddingHorizontal: 15, paddingVertical: 10 }}
                    keyExtractor={(item) => item.$id}  
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => scrollToSection(item.$id)} className='rounded-full py-2 px-3 border-primary-300' style={{backgroundColor: 'transparent', borderWidth: 2}}>
                            <Text className='font-regular text-primary-400'>{item.specialityName}</Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );

    const renderSectionHeader = ({ section }: any) => (
        <View style={{ backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 20 }}>
            <Text className='font-poppins-bold text-[20px]'>{section.title}</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Menu }) => (
        <Pressable 
            className='px-5 py-4 gap-x-3 border-b border-neutral-200 flex-row justify-between items-center'
            onPress={()=>handleIsOpen(item)}
        >
            <View className='flex-1'>
                <Text className='font-semibold text-[16px]'>{item.menuName}</Text>
                <Text className='font-regular text-[15px] text-neutral-600' numberOfLines={2}>
                    {item.description}
                </Text>
                <Text className='font-poppins-bold text-[18px] mt-1'>{item.reductionPrice} F</Text>
            </View>
            <View className='px-4 py-2 rounded-lg'>
                <Image 
                    source={{ uri: item.menuImage }} 
                    className='rounded-lg' 
                    style={{ width: 80, height: 80 }} 
                    resizeMode='cover' 
                />
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {showFixedHeader && (
                <View 
                    style={{
                        position: 'absolute',
                        top: 30,
                        left: 0,
                        right: 0,
                        height: 50,
                        backgroundColor: 'white',
                        zIndex: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                    }}
                    className='flex-row items-center px-5 gap-x-3'
                >
                    <Pressable hitSlop={15} onPress={handleBackPress}>
                        <Image source={images.back} className='size-6' resizeMode='contain' />
                    </Pressable>

                    <View className='flex-row justify-between items-center flex-1'>
                        <Text className='text-[16px] font-semibold' numberOfLines={1}>
                            {restaurant.restaurantName}
                        </Text>

                        <View className='flex-row gap-x-3 items-center'>
                            <Pressable onPress={() => router.push(`/Search/${id as string}`)}>
                                <Image source={images.search} className='size-7' resizeMode='contain' />
                            </Pressable>
                            <Pressable
                                onPress={toggleFavoris}
                                hitSlop={15}
                                disabled={loadingFavori}
                            >
                                {loadingFavori ? (
                                    <ActivityIndicator size="small" color="#48681B" />
                                ) : !favoris ? (
                                    <Image 
                                        source={images.favori} 
                                        style={{ width: 25, height: 25 }} 
                                        resizeMode='contain' 
                                    />
                                ) : (
                                    <Image 
                                        source={images.coeurp} 
                                        style={{ width: 25, height: 25, tintColor: '#ef4444' }} 
                                        resizeMode='contain' 
                                    />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}

            <View className='absolute bg-white flex-row justify-between items-center mb-3 px-5' style={{ zIndex: 9, top: 30, left: 0, right: 0, height: 50 }}>
                <Pressable hitSlop={15} onPress={handleBackPress}>
                    <Image source={images.back} className='size-6' resizeMode='contain' />
                </Pressable>
                
                <View className='items-center'>
                    <Text className='text-primary-300 text-[13px] font-semibold'>
                        Livraison à
                    </Text>
                    <Text className='text-[15px] font-semibold'>
                        Localisation actuelle
                    </Text>
                </View>
                
                <Pressable
                    onPress={toggleFavoris}
                    hitSlop={15}
                    disabled={loadingFavori}
                >
                    {loadingFavori ? (
                        <ActivityIndicator size="small" color="#48681B" />
                    ) : !favoris ? (
                        <Image 
                            source={images.favori} 
                            style={{ width: 25, height: 25 }} 
                            resizeMode='contain' 
                        />
                    ) : (
                        <Image 
                            source={images.coeurp} 
                            style={{ width: 25, height: 25, tintColor: '#ef4444' }} 
                            resizeMode='contain' 
                        />
                    )}
                </Pressable>
            </View>

            <SectionList
                ref={sectionListRef}
                sections={sections}
                keyExtractor={(item) => item.$id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                ListHeaderComponent={ListHeaderComponent}
                stickySectionHeadersEnabled={true}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 50, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className='py-10 items-center'>
                        <Text className='font-regular text-neutral-500'>
                            Aucun menu disponible
                        </Text>
                    </View>
                }
            />

            {modalAddedVisible && (
                <View 
                    className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-primary-300 px-4 py-2 rounded-lg'
                    style={{ zIndex: 999, height: 60 }}
                >
                    <Text className='text-white font-medium text-[14px]'>
                        {addedItem?.restaurantName} a été ajouté à vos favoris
                    </Text>
                </View>
            )}

            {modalDeleteVisible && (
                <View 
                    className='absolute items-center justify-center bottom-10 right-3 left-3 self-center bg-red-500 px-4 py-2 rounded-lg'
                    style={{ zIndex: 999, height: 60 }}
                >
                    <Text className='text-white font-medium text-[14px]'>
                        {pendingRemoveItem?.restaurantName} a été supprimé de vos favoris
                    </Text>
                </View>
            )}

            <BottomSheetModal
                ref={modalPendingRemoveItem}
                snapPoints={['45%']}
                handleIndicatorStyle={{ display: 'none' }}
                enablePanDownToClose={false}
                enableDynamicSizing={false}
                backdropComponent={renderBackdrop}
            >
                <BottomSheetView className='p-4 bg-white'>
                    <View className='items-center gap-y-4'>
                        <View 
                            className='rounded-full' 
                            style={{ 
                                overflow: 'hidden', 
                                height: 75, 
                                width: 75, 
                                borderWidth: 2, 
                                borderColor: '#e5e5e5' 
                            }}
                        >
                            <Image
                                source={{ uri: pendingRemoveItem?.restaurantLogo }}
                                className='w-full h-full'
                                resizeMode='cover'
                            />
                        </View>

                        <Text className='font-poppins-bold text-[18px] text-center'>
                            Retirer {pendingRemoveItem?.restaurantName} des favoris
                        </Text>

                        <Text className='font-regular text-[13px] text-center text-neutral-500'>
                            Voulez-vous vraiment retirer ce marchand ?
                        </Text>

                        <View className='w-full mt-2 gap-y-2'>
                            <CustomButton
                                titre='Oui' 
                                onPress={confirmRemovedFavori} 
                                bg='bg-primary-300' 
                                className='font-poppins-bold'
                            />
                            <CustomButton
                                titre='Non'
                                onPress={() => modalPendingRemoveItem.current?.dismiss()}
                                className='bg-white border-2 border-primary-400'
                                textColor='text-neutral-600 font-poppins-bold'
                            />
                        </View>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>

             <BottomSheetModal
                    ref={modalDeletePanier}
                    snapPoints={['55%']}
                    handleIndicatorStyle={{ display: 'none' }}
                    enablePanDownToClose={false}
                    enableDynamicSizing={false}
                    backdropComponent={renderBackdrop}
                  >
                    <BottomSheetView className='bg-white' style={{flex: 1}}>
                      <View 
                        className='justify-center flex-1 pb-5 items-center gap-y-4 py-2'
                      >
                        <View style={{width: 100,height:100,borderRadius: 120,overflow:'hidden'}}>
                            <Image source={{uri: restaurant.restaurantLogo}} resizeMode='cover' style={{width:'100%',height: '100%'}}/>
                        </View>
                        <View className='items-center justify-center px-4 flex-1'>
                          <Text className='font-poppins-bold text-[18px] text-center'>Quitter la page du marchand "{restaurant.restaurantName}"</Text>
                          <Text className='font-regular text-center text-neutral-800 text-[14px]'>
                            Vous avez des produits du marchand {restaurant.restaurantName} dans votre panier,voulez-vous vider votre panier? Si non vous pouvez retrouver votre panier en retournant chez ce marchand
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

                  
             <BottomSheetModal
                    ref={modalIsOpen}
                    snapPoints={['35%']}
                    handleIndicatorStyle={{ display: 'none' }}
                    enablePanDownToClose={false}
                    enableDynamicSizing={false}
                    backdropComponent={renderBackdrop}
                  >
                    <BottomSheetView className='bg-white' style={{flex: 1}}>
                      <View 
                        className='justify-center  flex-1 pb-5 items-center gap-y-4 py-2'     
                      >
                        <View className='flex-1 items-center border-neutral-200 py-3 w-full' style={{borderBottomWidth:1}}>
                        <View style={{width: 80,height:80,borderRadius: 120,overflow:'hidden'}}>
                            <Image source={{uri: restaurant.restaurantLogo}} resizeMode='cover' style={{width:'100%',height: '100%'}}/>
                        </View>
                        </View>
                        <View className='items-center justify-center px-4 flex-1 pt-3'>
                          <Text className='font-poppins-bold text-[18px] text-center'>{overlayContent.message}</Text>
                        </View>
                      </View>
                      
                      <View className='gap-y-3 px-5'>
                        <Pressable className='bg-primary-300 rounded-full items-center py-3' onPress={() => modalIsOpen.current?.dismiss()}>
                          <Text className='text-white font-semibold text-[16px]'>Fermer</Text>
                        </Pressable>
                      </View>
                    </BottomSheetView>
                  </BottomSheetModal>

            {hasItems && (
                <Pressable className='bg-primary-300 pr-3 rounded-full items-center flex-row' style={{position: 'absolute', bottom: 30, left: 15, right: 15, height: 50, paddingLeft: 4, elevation: 5}} onPress={() => router.push({pathname:`/PanierRestaurant/${id}` as any,
                  params: {fromRestaurant: 'yes'}
                })}>
                    <View className='bg-primary-400 items-center justify-center' style={{width: 43, height: 43, borderRadius: 50}}>
                        <Text className='font-poppins-bold text-white text-[16px]'>{totalItems}</Text>
                    </View>

                    <View className='flex-1 items-center'>
                        <Text className='text-center text-white font-semibold text-[16px]'>
                            Voir le panier  ▪  {totalPrice} F
                        </Text>
                    </View>
                </Pressable>
            )}
        </SafeAreaView>
    );
};

export default RestaurantDetails;