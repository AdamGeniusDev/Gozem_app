import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as Notification from 'expo-notifications';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { Href } from 'expo-router';

type Perms = Notification.PermissionStatus | 'unknown';

// Configuration globale du handler
Notification.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface NotificationProps {
    // ✅ Données essentielles uniquement
    token: string | null;
    permissionsStatus: Perms;

    // ✅ Listeners (runtime uniquement)
    listeners: {
        received?: Notification.Subscription;
        response?: Notification.Subscription;
    };

    // ✅ Méthodes
    initialize: () => Promise<void>;
    setupListeners: () => void;
    cleanupListeners: () => void;
    requestPermission: () => Promise<boolean>;
    sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
    scheduleNotification: (title: string, body: string, second: number, data?: any) => Promise<string>;
    cancelAllNotifications: () => Promise<void>;
}

const useNotificationStore = create<NotificationProps>()(
    persist(
        (set, get) => ({
            token: null,
            permissionsStatus: 'unknown',
            listeners: {},

            initialize: async () => {
                try {
                    if (Platform.OS === 'android') {
                        await Notification.setNotificationChannelAsync('default', {
                            name: 'default',
                            importance: Notification.AndroidImportance.MAX,
                            vibrationPattern: [0, 250, 250, 250],
                            lightColor: '#FF231F7C',
                        });
                    }

                    const { status } = await Notification.getPermissionsAsync();
                    set({ permissionsStatus: status });

                    if (status === 'granted') {
                        const token = await Notification.getExpoPushTokenAsync({
                            projectId: '3f8e6327-82be-41fc-9f0f-6f78193a2bd3'
                        });
                        set({ token: token.data });
                    }

                    get().setupListeners();

                } catch (error: any) {
                    console.error('❌ Erreur initialisation notifications:', error.message);
                }
            },

            setupListeners: () => {
                get().cleanupListeners();

                // Listener: notification reçue (pour le son/vibration uniquement)
                const receivedListener = Notification.addNotificationReceivedListener((notification) => {
                    const data = notification.request.content.data;
                    console.log("📩 Notification reçue:", data);
                    // ✅ Pas d'incrémentation ici, la BD gère tout
                });

                // Listener: tap sur notification (navigation uniquement)
                const responseListener = Notification.addNotificationResponseReceivedListener((response) => {
                    const data = response.notification.request.content.data;
                    console.log("👆 Notification tapée:", data);

                    if (data?.link) {
                        import('expo-router').then(({ router }) => {
                            setTimeout(() => {
                                router.push(data.link as Href);
                            }, 100);
                        }).catch(err => {
                            console.error('❌ Erreur navigation:', err);
                        });
                    }
                });

                set({
                    listeners: {
                        received: receivedListener,
                        response: responseListener,
                    }
                });
            },

            cleanupListeners: () => {
                const { listeners } = get();
                listeners.received?.remove();
                listeners.response?.remove();
                set({ listeners: {} });
            },

            requestPermission: async () => {
                try {
                    const { status: existingStatus } = await Notification.getPermissionsAsync();
                    let finalStatus = existingStatus;

                    if (existingStatus !== 'granted') {
                        const { status } = await Notification.requestPermissionsAsync();
                        finalStatus = status;
                    }

                    set({ permissionsStatus: finalStatus });

                    if (finalStatus === 'granted') {
                        const token = await Notification.getExpoPushTokenAsync({
                            projectId: '3f8e6327-82be-41fc-9f0f-6f78193a2bd3'
                        });
                        set({ token: token.data });
                        
                        get().setupListeners();
                        
                        return true;
                    }

                    return false;

                } catch (error: any) {
                    console.error('❌ Erreur permission notification:', error.message);
                    return false;
                }
            },

            sendLocalNotification: async (title, body, data) => {
                const { permissionsStatus } = get();

                if (permissionsStatus !== 'granted') {
                    console.warn('⚠️ Permission notification non accordée');
                    return;
                }

                await Notification.scheduleNotificationAsync({
                    content: { 
                        title, 
                        body, 
                        data: data || {}, 
                        sound: 'default' 
                    },
                    trigger: null,
                });
            },

            scheduleNotification: async (title, body, second, data) => {
                const { permissionsStatus } = get();
                
                if (permissionsStatus !== 'granted') {
                    throw new Error("Permission refusée");
                }

                return await Notification.scheduleNotificationAsync({
                    content: { title, body, data: data || {}, sound: 'default' },
                    trigger: {
                        type: Notification.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: second,
                        repeats: false,
                    },
                });
            },

            cancelAllNotifications: async () => {
                await Notification.cancelAllScheduledNotificationsAsync();
            },
        }),
        {
            name: 'notification-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                permissionsStatus: state.permissionsStatus,
                token: state.token,
            }),
        }
    )
);

export default useNotificationStore;