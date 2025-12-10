import CustomButton from '@/components/CustomButton'
import RestaurantCard from '@/components/RestaurantCard'
import RestaurantCardSkeleton from '@/components/RestaurantCardSkeleton'
import { images } from '@/constants'
import { getMenuAndRestaurants } from '@/lib/appwrite'
import { useFavorisStore } from '@/store/favoris.store'
import { useUserStore } from '@/store/user.store'
import { Menu, Restaurant } from '@/types/type'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

const MIN_SEARCH_LENGTH = 3

const SearchRestaurant = () => {
  const params = useLocalSearchParams<{query?: string}>()

  const [query, setQuery] = useState(params.query || '')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [index, setIndex] = useState(0)
  const layout = useWindowDimensions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { loadFavoris, removeFavori } = useFavorisStore()
  const user = useUserStore(state => state.user)
  const [modalAddedVisible, setModalAddedVisible] = useState(false)
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false)
  const [addedItem, setAddedItem] = useState<Restaurant | null>(null)
  const modalPendingRemoveItem = useRef<BottomSheetModal>(null)
  const [pendingRemoveItem, setPendingRemoveItem] = useState<Restaurant | null>(null)
  
  // Refs pour éviter les re-fetches inutiles
  const isMountedRef = useRef(true)
  const lastSearchQueryRef = useRef('')

  // Charger les favoris une seule fois au focus
  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        loadFavoris(user.$id)
      }
    }, [user?.$id]) // Removed loadFavoris from deps to avoid unnecessary refetches
  )

  // Effet initial pour params.query
  useEffect(() => {
    if (params.query && params.query.length >= MIN_SEARCH_LENGTH) {
      setDebouncedQuery(params.query.trim())
    }
  }, []) // Run only once on mount

  // Debounce effect optimisé
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    const trimmedQuery = query.trim()

    // Si moins de 3 caractères, reset
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setDebouncedQuery('')
      setRestaurants([])
      setMenus([])
      setError(null)
      setLoading(false)
      return
    }

    // Debounce de 800ms
    debounceTimeout.current = setTimeout(() => {
      // Éviter de relancer si la query n'a pas changé
      if (trimmedQuery !== lastSearchQueryRef.current) {
        setDebouncedQuery(trimmedQuery)
      }
    }, 800)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  // Effect de recherche optimisé
  useEffect(() => {
    // Ne rien faire si pas de query ou query trop courte
    if (!debouncedQuery || debouncedQuery.length < MIN_SEARCH_LENGTH) {
      setRestaurants([])
      setMenus([])
      setLoading(false)
      setError(null)
      return
    }

    // Éviter les recherches en double
    if (debouncedQuery === lastSearchQueryRef.current) {
      return
    }

    const search = async () => {
      // Éviter les recherches si le composant est démonté
      if (!isMountedRef.current) return

      setLoading(true)
      setError(null)
      lastSearchQueryRef.current = debouncedQuery

      try {
        const results = await getMenuAndRestaurants(debouncedQuery)
        
        // Vérifier si le composant est toujours monté
        if (!isMountedRef.current) return
        
        if (results) {
          setRestaurants(results.restaurants || [])
          setMenus(results.menus || [])
        } else {
          setRestaurants([])
          setMenus([])
        }
      } catch (err) {
        if (!isMountedRef.current) return
        
        console.error('Erreur recherche:', err)
        setError('Une erreur est survenue lors de la recherche')
        setRestaurants([])
        setMenus([])
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    search()
  }, [debouncedQuery])

  // Cleanup pour éviter les fuites mémoire
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  const handleChangeFavori = useCallback((action: 'added' | 'removeRequest', item?: Restaurant) => {
    if (action === 'added' && item) {
      setModalAddedVisible(true)
      setAddedItem(item)
      setTimeout(() => {
        setModalAddedVisible(false)
        setAddedItem(null)
      }, 2000)
    } else if (action === 'removeRequest' && item) {
      modalPendingRemoveItem.current?.present()
      setPendingRemoveItem(item)
    }
  }, [])

  const confirmRemovedFavori = useCallback(async () => {
    if (!pendingRemoveItem || !user) return

    try {
      await removeFavori(user.$id, pendingRemoveItem.$id)

      modalPendingRemoveItem.current?.dismiss()
      setModalDeleteVisible(true)
      setTimeout(() => {
        setModalDeleteVisible(false)
        setPendingRemoveItem(null)
      }, 2000)
    } catch (error) {
      console.error('Erreur suppression favori:', error)
    }
  }, [pendingRemoveItem, user, removeFavori])
      
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
  )

  // Component pour afficher les résultats vides
  const EmptyResults = useCallback(({ type }: { type: 'restaurants' | 'menus' }) => {
    if (loading) {
      return (
        <View className="items-center justify-center" style={{ paddingTop: 80 }}>
          <ActivityIndicator size="large" color="#169137" />
          <Text className="font-regular text-[14px] mt-4 text-neutral-600">
            Recherche en cours...
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={{ paddingTop: 80 }}>
          <Text className="font-semibold text-[18px] mt-2 text-red-600 text-center" style={{ paddingHorizontal: 30 }}>
            Erreur
          </Text>
          <Text className="font-regular text-[14px] mt-2 text-neutral-600 text-center" style={{ paddingHorizontal: 30 }}>
            {error}
          </Text>
        </View>
      )
    }

    if (debouncedQuery && !loading) {
      return (
        <View style={{ paddingTop: 80 }}>
          <Text className="font-semibold text-[18px] mt-2 text-black text-center" style={{ paddingHorizontal: 30 }}>
            Oups, rien trouvé !
          </Text>
          <Text className="font-regular text-[14px] mt-2 text-neutral-600 text-center" style={{ paddingHorizontal: 30 }}>
            Essayez avec d'autres mots-clés ou vérifiez l'orthographe
          </Text>
        </View>
      )
    }

    return null
  }, [loading, error, debouncedQuery])

  // Routes optimisées avec useCallback
  const FirstRoute = useCallback(() => (
  <View className="flex-1 py-5">
    {loading ? (
      // Afficher des skeletons pendant le chargement
      <View>
        <View 
          className="h-5 w-1/2 bg-gray-200 rounded mb-3" 
          style={{ opacity: 0.5 }} 
        />
        <FlatList
          data={[1, 2, 3]} // 3 skeletons
          keyExtractor={item => String(item)}
          contentContainerStyle={{ 
            paddingHorizontal: 5, 
            paddingTop: 15, 
            rowGap: 15, 
            paddingBottom: 25 
          }}
          showsVerticalScrollIndicator={false}
          renderItem={() => <RestaurantCardSkeleton />}
        />
      </View>
    ) : restaurants.length === 0 ? (
      <EmptyResults type="restaurants" />
    ) : (
      <View>
        <Text className="font-poppins-bold text-[18px] mb-3">
          {restaurants.length} {restaurants.length > 1 ? 'marchands trouvés' : 'marchand trouvé'}
        </Text>

        <FlatList
          data={restaurants}
          keyExtractor={item => item.$id}
          contentContainerStyle={{ 
            paddingHorizontal: 5, 
            paddingTop: 15, 
            rowGap: 15, 
            paddingBottom: 25 
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RestaurantCard 
              item={item} 
              onFavoriChange={handleChangeFavori} 
            />
          )}
        />
      </View>
    )}
  </View>
), [restaurants, EmptyResults, handleChangeFavori, loading]);

  const SecondRoute = useCallback(() => {
    const screenWidth = layout.width - 40 
    const gap = 15
    const itemWidth = (screenWidth - gap) / 2 

    return (
      <View className="flex-1 py-5">
        {menus.length === 0 ? (
          <EmptyResults type="menus" />
        ) : (
          <View>
            <Text className="font-poppins-bold text-[18px] mb-3">
              {menus.length} {menus.length > 1 ? 'produits trouvés' : 'produit trouvé'}
            </Text>
            
            <FlatList
              data={menus}
              numColumns={2}
              keyExtractor={item => item.$id}
              contentContainerStyle={{
                paddingTop: 15, 
                paddingBottom: 25 
              }}
              columnWrapperStyle={{
                gap: gap,
                marginBottom: gap
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable 
                  className="bg-white rounded-lg border-2 border-neutral-100" 
                  style={{
                    width: itemWidth,
                    height: 250, 
                    overflow: 'hidden',
                  }}
                  onPress={() => router.push({
                    pathname: `/MenuDetails/${item.$id}` as any,
                    params: { fromSearchGlobal: 'yes' }
                  })}
                >
                  <Image 
                    source={{ uri: item.menuImage }} 
                    style={{ height: '60%', width: '100%' }} 
                    resizeMode="cover"
                  />
                  <View className='px-3 pb-3 pt-2' style={{ gap: 2 }}>
                    <Text className='font-poppins-bold text-[14px]'>
                      {item.normalPrice} F
                    </Text>
                    <Text 
                      className='font-semibold text-[13px] text-neutral-500' 
                      numberOfLines={1}
                    >
                      {item.menuName}
                    </Text>
                    <Text 
                      className='font-regular text-[12px] text-neutral-400' 
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>
    )
  }, [menus, EmptyResults, layout.width])

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  })

  const routes = [
    { key: 'first', title: 'Marchands' },
    { key: 'second', title: 'Produits' },
  ]

  const renderTab = useCallback((props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#169137', height: 3, borderRadius: 100 }}
      style={{ backgroundColor: 'white' }}
      inactiveColor="#a3a3a3"
      activeColor="black"
      labelStyle={{ fontFamily: 'Poppins-Medium', textTransform: 'none' }}
    />
  ), [])

  // État initial (pas de recherche)
  const showInitialState = !loading && restaurants.length === 0 && menus.length === 0 && !debouncedQuery
  const showMinLengthWarning = query.trim().length > 0 && query.trim().length < MIN_SEARCH_LENGTH

  return (
    <SafeAreaView className="flex-1 bg-white px-5 py-5">
      {/* Barre de recherche */}
      <View 
        className="bg-neutral-100 px-3 rounded-lg flex-row gap-x-3 items-center" 
        style={{ elevation: 5, paddingVertical: 7 }}
      >
        <Pressable hitSlop={20} onPress={() => router.back()}>
          <Image source={images.back} className="size-5" resizeMode="contain" />
        </Pressable>
        
        <TextInput
          className="flex-1 font-regular text-[14px]"
          placeholder="Rechercher des marchands, produits, divers..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          placeholderTextColor="#A0A0A0"
          autoFocus
        />

        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Image source={images.croix} className="size-7" resizeMode="contain" />
          </Pressable>
        )}
      </View>

      {/* Avertissement minimum de caractères */}
      {showMinLengthWarning && (
        <View className="mt-3 px-3">
          <Text className="font-regular text-[13px] text-neutral-500 text-center">
            Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour lancer la recherche
          </Text>
        </View>
      )}

      {/* Résultats avec tabs */}
      {debouncedQuery && (
        <View className="flex-1 mt-5 bg-white">
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTab}
          />
        </View>
      )}

      {/* État initial */}
      {showInitialState && !showMinLengthWarning && (
        <View className="items-center" style={{ paddingTop: 70 }}>
          <View 
            className="bg-neutral-200 items-center justify-center" 
            style={{ width: 100, height: 100, borderRadius: 100 }}
          >
            <Image 
              source={images.search} 
              resizeMode="contain" 
              tintColor="#404040" 
              style={{ width: '50%', height: '50%' }} 
            />
          </View>
          <Text 
            className="font-regular text-[14px] mt-2 text-neutral-600 text-center" 
            style={{ paddingHorizontal: 30 }}
          >
            Trouvez tout, n'importe quand. Votre univers, livré
          </Text>
        </View>
      )}

      {/* Modals de feedback */}
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
    </SafeAreaView>
  )
}

export default SearchRestaurant