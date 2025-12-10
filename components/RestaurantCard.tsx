import { View, Text, Image, Pressable } from 'react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Coords, Restaurant } from '@/types/type'
import { CalculateDelaiFromDistance, CalculateDistance, CalculatePriceFromDistance } from '@/lib/map'
import { images } from '@/constants'
import useLocationStore from '@/store/location.store'
import { useUserStore } from '@/store/user.store'
import { useFavorisStore } from '@/store/favoris.store'
import { isRestaurantOpen, getTimeFromDate } from '@/lib/utils'
import { router } from 'expo-router'
import RestaurantCardSkeleton from './RestaurantCardSkeleton'

type Props = {
  item: Restaurant;
  onFavoriChange?: (action: 'added' | 'removeRequest', item?: Restaurant) => void;
  best?: boolean;
  preloadedCoords?: Coords | null; 
}

const RestaurantCard = ({ item, onFavoriChange, best, preloadedCoords }: Props) => {
    const { convertAddress } = useLocationStore();
    const user = useUserStore(state => state.user);
    
    const isFavoriInStore = useFavorisStore(
        useCallback((state) => state.isFavori(item.$id), [item.$id])
    );
    const addFavori = useFavorisStore(state => state.addFavori);
    
    const [coords, setCoords] = useState<Coords | null>(preloadedCoords || null);
    const [distance, setDistance] = useState<number>(0);
    const [loadingFavori, setLoadingFavori] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!preloadedCoords); // Ne charge que si pas de coords préchargées

    const restaurantStatus = useMemo(() => {
        const openTime = getTimeFromDate(item.openTime);
        const closeTime = getTimeFromDate(item.closeTime);
        const currentTime = getTimeFromDate(new Date());

        const isOpen = isRestaurantOpen(currentTime, openTime, closeTime);

        return {
            isOpen,
            openTime,
            closeTime,
            message: isOpen ? '' : 'Le restaurant est actuellement fermé'
        };
    }, [item.openTime, item.closeTime]);

    const toggleFavoris = useCallback(async () => {
        if (!user) {
            alert("Vous devez être connecté pour ajouter un favori");
            return;
        }

        if (loadingFavori) return;

        setLoadingFavori(true);

        try {
            if (isFavoriInStore) {
                onFavoriChange?.('removeRequest', item);
            } else {
                await addFavori(user.$id, item.$id);
                onFavoriChange?.('added', item);
            }
        } catch (error) {
            console.error('Erreur toggle favori:', error);
            alert('Une erreur est survenue');
        } finally {
            setLoadingFavori(false);
        }
    }, [user, item, loadingFavori, isFavoriInStore, addFavori, onFavoriChange]);

    const specialityText = useMemo(() => {
        const specialities = Array.isArray(item.specialities) ? item.specialities : [];
        const displayedSpecialities = specialities.slice(0, 4).map(spec => spec.specialityName);
        return displayedSpecialities.join(' • ') + (specialities.length > 4 ? ' ...' : '');
    }, [item.specialities]);

    // Calculer la distance immédiatement si les coords sont préchargées
    useEffect(() => {
        if (preloadedCoords) {
            const dist = CalculateDistance({ 
                lat: preloadedCoords.latitude, 
                lon: preloadedCoords.longitude 
            });
            setDistance(dist ?? 0);
            setIsLoadingData(false);
        }
    }, [preloadedCoords]);

    useEffect(() => {
        // Ne pas fetch si les coordonnées sont déjà préchargées
        if (preloadedCoords) return;

        let isMounted = true;

        const fetchCoords = async () => {
            try {
                setIsLoadingData(true);
                
                const c = await convertAddress({ address: item.address });

                if (isMounted) {
                    setCoords(c);
                    const dist = CalculateDistance({ lat: c.latitude, lon: c.longitude });
                    setDistance(dist ?? 0);
                    setIsLoadingData(false);
                }
            } catch (e) {
                console.log("Erreur convert Address", e);
                if (isMounted) {
                    setIsLoadingData(false);
                }
            }
        };

        fetchCoords();

        return () => {
            isMounted = false;
        };
    }, [item.address, convertAddress, preloadedCoords]);

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

    // Afficher le skeleton pendant le chargement
    if (isLoadingData) {
        return <RestaurantCardSkeleton />;
    }

    return (
        <Pressable
            pointerEvents="box-none"
            style={{ height: 250, overflow: 'hidden', elevation: 4 }}
            className='bg-white rounded-lg'
            onPress={() => router.push(`/RestaurantDetails/${item.$id}`)}
        >
            <Pressable
                onPress={toggleFavoris}
                hitSlop={15}
                className='absolute bg-white rounded-full items-center justify-center'
                style={{ height: 45, width: 45, zIndex: 200, top: 5, right: 5 }}
                disabled={loadingFavori}
            >
                {!isFavoriInStore ? (
                    <Image source={images.favori} style={{ width: '50%', height: '50%' }} resizeMode='contain' />
                ) : (
                    <Image source={images.coeurp} style={{ width: '50%', height: '50%', tintColor: '#ef4444' }} resizeMode='contain' />
                )}
            </Pressable>

            <View style={{ height: '60%', position: 'relative', width: '100%' }}>
                <Image
                    source={{ uri: item.restaurantBanner }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode='cover'
                    defaultSource={images.placeholder}
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

            <View className='px-3 py-2 bg-white w-full' style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
                {!overlayContent.show ? (
                    <View
                        className='absolute rounded-lg w-[80px] h-[45px] items-center justify-center bg-white right-3'
                        style={{ zIndex: 100, backgroundColor: 'white', elevation: 3, top: -20 }}
                    >
                        <Text className='font-bold text-neutral-800 text-center text-[14px]'>
                            {deliveryInfo.delai}
                        </Text>
                        <Text className='font-regular text-neutral-600 text-[12px]' style={{ marginTop: -5 }}>
                            mins
                        </Text>
                    </View>
                ) : (
                    <View
                        className='absolute rounded-lg w-[80px] h-[50px] items-center justify-center bg-white right-3 px-2'
                        style={{ zIndex: 100, backgroundColor: 'white', elevation: 3, top: -20 }}
                    >
                        <Text className='font-regular text-neutral-500 text-center text-[12px]' numberOfLines={2}>
                            {deliveryInfo.isHorsPortee ? deliveryInfo.delai : 'Fermé'}
                        </Text>
                    </View>
                )}

                <Text className='font-poppins-bold'>{item.restaurantName}</Text>

                <View className='flex-row gap-2 items-center'>
                    {!!item.numberOpinion && (
                        <View className='flex-row items-center justify-center'>
                            <Image
                                source={images.etoile}
                                className='w-4 h-4'
                                resizeMode='contain'
                                tintColor={'#404040'}
                                style={{ marginTop: -5 }}
                            />
                            <Text className='font-poppins-bold text-neutral-700'> {item.rating}</Text>
                            <Text className='font-poppins-bold text-neutral-700'> ({item.numberOpinion})</Text>
                        </View>
                    )}
                    
                    <Text className='font-regular text-[13px] text-neutral-500' style={{ paddingBottom: 3 }}>
                        • Livraison : <Text className='font-poppins-bold text-black text-[15px]'>{deliveryInfo.price} F</Text>
                    </Text>
                </View>
                
                {!!specialityText && (
                    <View className='flex-row gap-x-2 items-center'>
                        {best && <Text className='font-poppins-bold text-primary-300 text-[15px]'>Best</Text>}
                        <Text
                            numberOfLines={1}
                            ellipsizeMode='tail'
                            className='self-start bg-neutral-100 px-2 py-[2px] rounded-full text-neutral-500 font-regular text-[12px]'
                        >
                            {specialityText}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    )
}

export default RestaurantCard