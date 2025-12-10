import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Href, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/user.store';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead} from '@/lib/appwrite';
import { images } from '@/constants';
import { useNotificationCount } from '@/lib/useNotification';
import { Notification } from '@/types/type';

export default function NotificationScreen() {
  const user = useUserStore(state => state.user);
  
  const { refresh: refreshCount } = useNotificationCount();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (showRefreshing = false) => {
    if (!user?.$id) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNotifications(user.$id);
      setNotifications(data);

    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [user?.$id]);

  const handleNotificationPress = async (notification: Notification) => {
    if (!user?.$id) return;

    const isUnread = notification.isRead === 'false';

    try {
      // ⚡ Mise à jour optimiste immédiate (UX instantanée)
      if (isUnread) {
        setNotifications(prev =>
          prev.map(n =>
            n.$id === notification.$id ? { ...n, isRead: 'true' } : n
          )
        );
      }

      // ⚡ Navigation immédiate (pas d'attente)
      if (notification.link) {
        router.push(notification.link as Href);
      }

      // ⚡ Appels API en arrière-plan (non bloquants)
      if (isUnread) {
        // Fire and forget - pas d'await
        Promise.all([
          markNotificationAsRead(notification.$id),
          refreshCount()
        ]).catch(error => {
          console.error('❌ Erreur background update:', error);
          // En cas d'erreur, on peut rollback
          setNotifications(prev =>
            prev.map(n =>
              n.$id === notification.$id ? { ...n, isRead: 'false' } : n
            )
          );
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors du tap notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.$id) return;

    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: 'true' }))
      );

      // ⚡ API en arrière-plan
      Promise.all([
        markAllNotificationsAsRead(user.$id),
        refreshCount()
      ]).catch(error => {
        console.error('❌ Erreur marquer tout comme lu:', error);
        // Rollback si erreur
        loadNotifications();
      });

    } catch (error) {
      console.error('❌ Erreur marquer tout comme lu:', error);
    }
  };

  // Refresh manuel (optimisé)
  const onRefresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(true),
      refreshCount()
    ]);
  }, [user?.$id]);

  // ✅ Calculer le nombre de non lues localement
  const localUnreadCount = notifications.filter(n => n.isRead === 'false').length;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#48681B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top', 'left', 'right']}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className='px-3 pb-4 border-b border-neutral-200'>
          <View className='flex-row items-center gap-x-5' style={{ marginTop: 20 }}>
            {/* Bouton retour */}
            <Pressable onPress={() => router.back()} hitSlop={15}>
              <Image source={images.back} className='size-5' resizeMode='contain' />
            </Pressable>

            {/* Titre */}
            <Text className='font-semibold text-[16px] flex-1'>Notifications</Text>

            {/* Bouton marquer tout comme lu */}
            {localUnreadCount > 0 && (
              <Pressable 
                className='bg-neutral-200 py-2 px-3 rounded-full'
                onPress={handleMarkAllAsRead}
              >
                <Text className="text-primary-300 font-medium text-[12px]">
                  Tout marquer comme lue
                </Text>
              </Pressable>
            )}
          </View>

          {/* Compteur de non lues */}
          {localUnreadCount > 0 && (
            <Text className="text-neutral-500 text-[13px] mt-3">
              {localUnreadCount} notification{localUnreadCount > 1 ? 's' : ''} non lue{localUnreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        {/* Liste des notifications */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.$id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#48681B']}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          renderItem={({ item }) => {
            const isUnread = item.isRead === 'false';

            return (
              <Pressable
                onPress={() => handleNotificationPress(item)}
                className={`px-4 py-3 border-b border-neutral-200 ${
                  isUnread ? 'bg-neutral-100' : 'bg-white'
                }`}
              >
                <View className="flex-row items-start gap-x-3">
                  {/* Indicateur non lu */}
                  {isUnread && (
                    <View className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                  )}

                  {/* Contenu */}
                  <View className="flex-1">
                    {/* Date */}
                    <Text className="text-neutral-400 text-[11px] mb-1">
                      {formatDate(item.$createdAt)}
                    </Text>
                    
                    {/* Titre */}
                    <Text
                      className={`text-[15px] mb-1 ${
                        isUnread ? 'font-semibold' : 'font-regular text-neutral-500'
                      }`}
                    >
                      {item.title}
                    </Text>

                    {/* Message */}
                    <Text className="text-neutral-500 text-[13px]">
                      {item.message}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-20">
              <Image
                source={images.cloche}
                className="size-20 mb-4"
                resizeMode="contain"
                tintColor="#D4D4D4"
              />
              <Text className="text-neutral-400 text-[15px]">
                Aucune notification
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// Helper pour formater la date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}