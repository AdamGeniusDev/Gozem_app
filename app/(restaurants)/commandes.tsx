import { View, Text, useWindowDimensions, Image, ActivityIndicator, FlatList, RefreshControl, Pressable } from 'react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { images } from '@/constants';
import { router, useLocalSearchParams, useFocusEffect, Href} from 'expo-router';
import useAppwrite from '@/lib/useAppwrite';
import { OrderHistoryItem } from '@/types/type';
import { getUserOrdersActive, getUserOrdersHistory } from '@/lib/appwrite';
import { useAuth } from '@clerk/clerk-expo';
import { getTimeFromDate } from '@/lib/utils';
import { useUserStore } from '@/store/user.store';

// Type pour les items de la FlatList
type FlatListItem = 
  | { type: 'header'; data: { date: string; count: number } }
  | { type: 'order'; data: OrderHistoryItem };

const OrderCard = ({ order }: { order: OrderHistoryItem }) => {
  const heureOrder = getTimeFromDate(order.orderCreatedAt);
  
  const handlePress = () => {
    console.log('🔍 Clic détecté sur commande:', order.orderId);
    router.push(`/orderProcess/${order.orderId}` as Href);
  };
  
  const showStatusBadge = ['delivered', 'canceled', 'rejected'].includes(order.status);
  
  return (
    <Pressable
      className='flex-row gap-x-4 py-3 px-4 border-b border-gray-200 active:bg-gray-50' 
      onPressIn={handlePress}
      delayLongPress={0}
    >
      {/* Avatar du restaurant */}
      <View className='relative'>
        <View style={{ width: 45, height: 45, overflow: 'hidden' }} className='rounded-full bg-gray-200'>
          <Image 
            source={order.restaurant?.avatar ? { uri: order.restaurant.avatar } : images.boutique} 
            resizeMode='cover' 
            className='w-full h-full'
          />
        </View>
        
        {showStatusBadge && (
          <View className='absolute bottom-0 right-0 bg-white rounded-full p-0.5'>
            <Image 
              source={order.status === 'delivered' ? images.checked : images.rejected} 
              style={{ width: 20, height: 20 }} 
            />
          </View>
        )}
      </View>

      <View className='flex-row flex-1 justify-between'>
        <View className='flex-1'>
          <Text className='font-semibold text-[15px]' numberOfLines={1}>
            {order.restaurant.name}
          </Text>
          <Text className='text-regular text-[13px] text-gray-600'>
            {heureOrder}
          </Text>
          
          {/* Items */}
          <View className='pt-2 flex-row gap-x-2 items-start'>
            <Image source={images.panierr} style={{ width: 14, height: 14 }} className='mt-1' />
            <View className='flex-1'>
              {order.items.slice(0, 2).map((item, idx) => (
                <Text key={idx} className='text-regular text-[13px] text-neutral-600' numberOfLines={1}>
                  {item.quantity}x {item.menuName}
                </Text>
              ))}
              {order.items.length > 2 && (
                <Text className='text-[12px] text-neutral-400'>
                  +{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className='justify-between items-end ml-2'>
          <View className='items-end'>
            <Text className={`text-[15px] font-poppins-bold ${
              ['delivered', 'pending', 'completed', 'accepted', 'preparing'].includes(order.status)
                ? 'text-green-700' 
                : 'text-red-600'
            }`}>
              {order.totalPrice}F
            </Text>
            
            {(order.status === 'canceled' || order.status === 'rejected') && (
              <Text className='text-[12px] font-medium text-red-600'>
                {order.status === 'canceled' ? 'Annulée' : 'Rejetée'}
              </Text>
            )}
          </View>
          <Image source={images.repas} style={{ width: 35, height: 35 }} className='mt-2' />
        </View>
      </View>
    </Pressable>
  );
};

const EmptyState = ({ message = "Vous n'avez aucune commande" }) => (
  <View className='flex-1 justify-center items-center px-6'>
    <View 
      className='bg-neutral-200 items-center justify-center' 
      style={{ width: 100, height: 100, borderRadius: 50 }}
    >
      <Image 
        source={images.facture} 
        style={{ width: '70%', height: '70%' }} 
        resizeMode='contain' 
        tintColor={'#737373'} 
      />
    </View>
    <Text className='font-semibold text-[17px] text-center pt-4'>
      {message}
    </Text>
    <Text className='font-regular text-neutral-700 text-center pt-2'>
      Lorsque vous passez une commande, elle s'affichera ici
    </Text>
  </View>
);

const Commandes = () => {
  const { getToken, userId } = useAuth();
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!userId) return;
    loadUser(getToken, userId);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, [])
  );

  const { 
    data: ordersHistory, 
    loading, 
    refreshing: refreshingHistory,
    refetch: refetchHistory 
  } = useAppwrite<OrderHistoryItem[]>({
    fn: () => {
      if (!user?.$id) {
        return Promise.resolve([]);
      }
      return getUserOrdersHistory(user.$id, getToken);
    },
    dependencies: [user?.$id, refreshTrigger],
    showErrorAlert: false
  });

  const { 
    data: ordersActive, 
    loading: loadingActive,
    refreshing: refreshingActive,
    refetch: refetchActive 
  } = useAppwrite<OrderHistoryItem[]>({
    fn: () => {
      if (!user?.$id) {
        return Promise.resolve([]);
      }
      return getUserOrdersActive(user.$id, getToken);
    },
    dependencies: [user?.$id, refreshTrigger],
    showErrorAlert: false
  });

  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement manuel...');
    await Promise.all([refetchHistory(), refetchActive()]);
  };

  const isRefreshing = refreshingHistory || refreshingActive;

  // Grouper les commandes par date pour l'historique
  const groupedOrders = useMemo(() => {
    if (!ordersHistory || ordersHistory.length === 0) return [];
    
    const groups: { [date: string]: OrderHistoryItem[] } = {};
    
    ordersHistory.forEach(order => {
      if (!groups[order.orderDate]) {
        groups[order.orderDate] = [];
      }
      groups[order.orderDate].push(order);
    });
    
    return Object.entries(groups)
      .map(([date, orders]) => ({
        date,
        orders: orders.sort((a, b) => 
          new Date(b.orderCreatedAt).getTime() - new Date(a.orderCreatedAt).getTime()
        )
      }))
      .sort((a, b) => 
        new Date(b.orders[0].orderCreatedAt).getTime() - 
        new Date(a.orders[0].orderCreatedAt).getTime()
      );
  }, [ordersHistory]);

  // Aplatir les données pour la FlatList avec le bon type
  const flattenedHistoryData = useMemo(() => {
    const items: FlatListItem[] = [];
    
    groupedOrders.forEach((group) => {
      items.push({ 
        type: 'header', 
        data: { date: group.date, count: group.orders.length } 
      });
      
      group.orders.forEach((order) => {
        items.push({ type: 'order', data: order });
      });
    });
    
    return items;
  }, [groupedOrders]);

  // Premier onglet : En cours
  const FirstRoute = () => {
    if (loadingActive && !isRefreshing) {
      return (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#48681B' />
          <Text className='font-regular text-[15px] mt-3'>
            Chargement de vos commandes...
          </Text>
        </View>
      );
    }

    if (!ordersActive || ordersActive.length === 0) {
      return (
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={<EmptyState message="Aucune commande en cours" />}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#48681B']}
              tintColor='#48681B'
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={ordersActive}
        keyExtractor={(item, index) => `${item.orderId}-${index}`}
        renderItem={({ item }) => 
          <OrderCard order={item} />
        }
        ListHeaderComponent={() => (
          <View className='bg-neutral-100 py-5 px-3 flex-row justify-between items-center'>
            <Text className='font-regular text-[13px] text-gray-600'>
              {ordersActive.length} commande{ordersActive.length > 1 ? 's' : ''} en cours
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#48681B']}
            tintColor='#48681B'
          />
        }
      />
    );
  };

  // Deuxième onglet : Programmé
  const SecondRoute = () => (
    <FlatList
      data={[]}
      renderItem={null}
      ListEmptyComponent={<EmptyState message="Aucune commande programmée" />}
      contentContainerStyle={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#48681B']}
          tintColor='#48681B'
        />
      }
    />
  );

  // Troisième onglet : Historique
  const ThirdRoute = () => {
    if (loading && !isRefreshing) {
      return (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#48681B' />
          <Text className='font-regular text-[15px] mt-3'>
            Chargement de votre historique...
          </Text>
        </View>
      );
    }

    if (!ordersHistory || ordersHistory.length === 0) {
      return (
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#48681B']}
              tintColor='#48681B'
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={flattenedHistoryData}
        keyExtractor={(item, index) => 
          item.type === 'header' 
            ? `header-${item.data.date}-${index}` 
            : `order-${item.data.orderId}-${index}`
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View className='bg-neutral-100 py-5 px-3 flex-row justify-between items-center'>
                <Text className='font-poppins-bold text-[15px]'>
                  {item.data.date}
                </Text>
                <Text className='font-regular text-[13px] text-gray-600'>
                  {item.data.count} commande{item.data.count > 1 ? 's' : ''}
                </Text>
              </View>
            );
          }
          
          return <OrderCard order={item.data} />;
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#48681B']}
            tintColor='#48681B'
          />
        }
      />
    );
  };

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
    third: ThirdRoute,
  });

  const toNumber = (v: string | string[] | undefined): number => {
    if (!v) return 0;
    if (Array.isArray(v)) return Number(v[0]) || 0;
    return Number(v) || 0;
  };

  const { initialIndex } = useLocalSearchParams<{ initialIndex?: string | string[] }>();
  const [index, setIndex] = useState(() => toNumber(initialIndex ?? '0'));
  const layout = useWindowDimensions();

  const routes = [
    { key: 'first', title: 'En cours' },
    { key: 'second', title: 'Programmé' },
    { key: 'third', title: 'Historique' }
  ];

  const renderTab = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ 
        backgroundColor: '#169137', 
        height: 3, 
        borderRadius: 100 
      }}
      style={{ backgroundColor: 'white', elevation: 0, shadowOpacity: 0 }}
      inactiveColor='#a3a3a3'
      activeColor='#000'
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'right', 'left']}>
      <View className='px-5 py-6'>
        <Text className='font-poppins-bold text-[16px]'>Mes Commandes</Text>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTab}
      />
    </SafeAreaView>
  );
};

export default Commandes;