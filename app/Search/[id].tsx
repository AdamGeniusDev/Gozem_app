import { images } from '@/constants';
import { getMenuSearched, getRestaurantInformations } from '@/lib/appwrite';
import { getTimeFromDate, isRestaurantOpen } from '@/lib/utils';
import { Menu, Restaurant } from '@/types/type';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, TextInput, View, FlatList, Text, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_SEARCH_LENGTH = 3;

const SearchInRestaurant = () => {
  const { id } = useLocalSearchParams();
  const params = useLocalSearchParams<{ query?: string }>();
  
  const [query, setQuery] = useState(params.query || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastSearchQueryRef = useRef('');

  // Calculer le statut du restaurant
  const restaurantIsOpen = (() => {
    if (!restaurant?.openTime || !restaurant?.closeTime) return false;
    
    const openTime = getTimeFromDate(restaurant.openTime);
    const closeTime = getTimeFromDate(restaurant.closeTime);
    const currentTime = getTimeFromDate(new Date());
    
    return isRestaurantOpen(currentTime, openTime, closeTime);
  })();

  // Charger les infos du restaurant une seule fois
  useEffect(() => {
    let isMounted = true;

    const loadRestaurant = async () => {
      try {
        setRestaurantLoading(true);
        const restaurantData = await getRestaurantInformations(id as string);
        
        if (isMounted) {
          setRestaurant(restaurantData);
        }
      } catch (err) {
        console.error('Erreur chargement restaurant:', err);
        if (isMounted) {
          setError('Erreur lors du chargement du restaurant');
        }
      } finally {
        if (isMounted) {
          setRestaurantLoading(false);
        }
      }
    };

    loadRestaurant();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Effet initial pour params.query
  useEffect(() => {
    if (params.query && params.query.length >= MIN_SEARCH_LENGTH) {
      setDebouncedQuery(params.query.trim());
    }
  }, []); // Run only once on mount

  // Debounce effect optimisé
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const trimmedQuery = query.trim();

    // Si moins de 3 caractères, reset
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setDebouncedQuery('');
      setMenus([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Debounce de 1000ms (pas de loading pendant le debounce)
    debounceTimeout.current = setTimeout(() => {
      // Éviter de relancer si la query n'a pas changé
      if (trimmedQuery !== lastSearchQueryRef.current) {
        setDebouncedQuery(trimmedQuery);
      }
    }, 1000);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  // Effect de recherche optimisé
  useEffect(() => {
    // Ne rien faire si pas de query ou query trop courte
    if (!debouncedQuery || debouncedQuery.length < MIN_SEARCH_LENGTH) {
      setMenus([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Éviter les recherches en double
    if (debouncedQuery === lastSearchQueryRef.current) {
      return;
    }

    const search = async () => {
      // Éviter les recherches si le composant est démonté
      if (!isMountedRef.current) return;

      setLoading(true);
      setError(null);
      lastSearchQueryRef.current = debouncedQuery;

      try {
        const results = await getMenuSearched(id as string, debouncedQuery);
        
        // Vérifier si le composant est toujours monté
        if (!isMountedRef.current) return;
        
        if (results) {
          setMenus(results);
        } else {
          setMenus([]);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        console.error('Erreur recherche:', err);
        setError('Une erreur est survenue lors de la recherche');
        setMenus([]);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    search();
  }, [debouncedQuery, id]);

  // Cleanup pour éviter les fuites mémoire
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Cleanup au démontage
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Réinitialiser les états
        setQuery('');
        setDebouncedQuery('');
        setMenus([]);
        setLoading(false);
        setError(null);
        lastSearchQueryRef.current = '';
        
        // Nettoyer le timeout
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [])
  );

  // Loading global du restaurant
  if (restaurantLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#48681B' />
          <Text className='text-neutral-500 mt-4 text-[14px]'>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Erreur chargement restaurant
  if (error && !restaurant) {
    return (
      <SafeAreaView className='flex-1 bg-white'>
        <View className='flex-1 items-center justify-center px-5'>
          <Text className='text-red-500 text-center text-[15px] font-semibold'>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showMinLengthWarning = query.trim().length > 0 && query.trim().length < MIN_SEARCH_LENGTH;
  const showInitialState = !loading && menus.length === 0 && !debouncedQuery && !showMinLengthWarning;

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {/* Barre de recherche */}
      <View className='px-5 py-2'>
        <View className='bg-neutral-100 py-2 px-3 rounded-lg flex-row gap-x-3 items-center' style={{elevation:5}}>
          <Pressable onPress={() => router.back()}>
            <Image source={images.back} className='size-5' resizeMode='contain' />
          </Pressable>
          
          <TextInput
            className='flex-1 font-regular text-[14px]'
            placeholder={`Rechercher dans ${restaurant?.restaurantName || 'ce restaurant'}`}
            value={query}
            onChangeText={setQuery}
            returnKeyType='search'
            placeholderTextColor='#A0A0A0'
            autoFocus
          />

          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Image source={images.croix} className='size-7' resizeMode='contain' />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.$id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 15 }}
        renderItem={({ item }) => (
          <Pressable
            className='flex-row gap-x-3 py-4 px-5 border-b border-neutral-200'
            onPress={() => {
              Keyboard.dismiss();
              router.push({
                pathname: `/MenuDetails/${item.$id}`,
                params: {
                  isRestaurantOpen: restaurantIsOpen ? 'true' : 'false',
                  restaurantName: restaurant?.restaurantName || '',
                  fromSearch: 'yes'
                }
              });
            }}
          >
            <View className='flex-1'>
              <Text className='font-semibold text-[16px]' numberOfLines={1}>
                {item.menuName}
              </Text>
              <Text className='font-regular text-[14px] text-neutral-600 mt-1' numberOfLines={2}>
                {item.description}
              </Text>
              <Text className='font-poppins-bold text-[16px] text-primary-400 mt-2'>
                {item.normalPrice} F
              </Text>
            </View>

            <View className='rounded-lg overflow-hidden' style={{ width: 80, height: 80 }}>
              <Image source={{ uri: item.menuImage }} className='w-full h-full' resizeMode='cover' />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className='flex-1 items-center px-5' style={{paddingTop: 50}}>
            {loading ? (
              <>
                <ActivityIndicator size='large' color='#48681B' />
                <Text className='mt-4 text-neutral-500 font-medium'>Recherche en cours...</Text>
              </>
            ) : error ? (
              <>
                <View className='bg-neutral-200 items-center justify-center' style={{width: 80, height: 80, borderRadius: 100}}>
                  <Image source={images.search} style={{width: '80%', height: '80%'}} resizeMode='contain' tintColor='#ef4444' />
                </View>
                <Text className='font-semibold text-[16px] mt-2 text-red-600 text-center'>
                  Erreur
                </Text>
                <Text className='font-regular text-[14px] mt-1 text-neutral-600 text-center'>
                  {error}
                </Text>
              </>
            ) : showMinLengthWarning ? (
              <>
                <View className='bg-neutral-200 items-center justify-center' style={{width: 80, height: 80, borderRadius: 100}}>
                  <Image source={images.search} resizeMode='contain' tintColor='#404040' style={{width: '60%', height: '60%'}} />
                </View>
                <Text className='font-medium text-[14px] mt-2 text-neutral-700 text-center'>
                  Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour rechercher
                </Text>
              </>
            ) : debouncedQuery && !loading ? (
              <>
                <View className='bg-neutral-200 items-center justify-center' style={{width: 80, height: 80, borderRadius: 100}}>
                  <Image source={images.search} style={{width: '80%', height: '80%'}} resizeMode='contain' tintColor='#404040' />
                </View>
                <Text className='font-medium mt-2 text-[14px] text-neutral-700 text-center'>
                  Aucun résultat pour "{query}"
                </Text>
              </>
            ) : showInitialState ? (
              <>
                <View className='bg-neutral-200 items-center justify-center' style={{width: 80, height: 80, borderRadius: 100}}>
                  <Image source={images.search} resizeMode='contain' tintColor='#404040' style={{width: '60%', height: '60%'}} />
                </View>
                <Text className='font-medium text-[14px] mt-2 text-neutral-700 text-center'>
                  Recherchez des plats...
                </Text>
              </>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SearchInRestaurant;