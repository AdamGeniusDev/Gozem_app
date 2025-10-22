import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as Notification from 'expo-notifications';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

type Perms = Notification.PermissionStatus | 'unknown';

Notification.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface NotificationProps {
    token: string | null;
    permissionsStatus: Perms;
    lastNotification: Notification.Notification | null;
    isInitialized: boolean;

    initialize: () => Promise<void>;
    requestPermission: () => Promise<boolean>;
    sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
    sendPushNotification: (title: string, body: string, data?: any) => Promise<void>;
    scheduleNotification: (title: string,body: string, second: number,data?:any) => Promise<string>;
    cancelAllNotifications: () => Promise<void>;
    setLastNotification: (notification: Notification.Notification) => void;
  
}

const useNotificationStore = create<NotificationProps>()(

    persist(
        (set,get) => ({
            token: null,
            permissionsStatus: 'unknown',
            lastNotification: null,
            isInitialized: false,

            initialize: async () => {
                if(get().isInitialized) return;

                try{

                    if( Platform.OS === 'android'){
                        await Notification.setNotificationChannelAsync('default',{
                            name: 'default',
                            importance: Notification.AndroidImportance.MAX,
                            vibrationPattern: [0, 250, 250, 250],
                            lightColor: '#FF231F7C',
                        })
                    }

                    const {status} = await Notification.getPermissionsAsync();

                    set({permissionsStatus: status});

                    if( status === 'granted'){
                        const token = await Notification.getExpoPushTokenAsync({
                            projectId: '3f8e6327-82be-41fc-9f0f-6f78193a2bd3'
                        });
                        set({token: token.data});
                        set({isInitialized: true} );
                    }

                    Notification.addNotificationResponseReceivedListener(response => {
                        console.log('Notification response received:', response.notification.request.content.data);
                    })

                } catch(error: any){
                    console.log('Erreur initialisation des notifications:', error.message);
                }
            },
            requestPermission: async() =>{

                try{
                    
                    const {status: existingStatus} = await Notification.getPermissionsAsync();
                    let finalStatus = existingStatus;

                    if(finalStatus !== 'granted'){
                        const {status} = await Notification.requestPermissionsAsync();
                        finalStatus = status;
                    }

                    set({permissionsStatus: finalStatus});

                    if(finalStatus === 'granted'){
                        const token = await Notification.getExpoPushTokenAsync({
                            projectId: '3f8e6327-82be-41fc-9f0f-6f78193a2bd3'
                        })

                        set({token: token.data});
                        return true;
                    }

                    return false

                } catch(error: any){
                    console.log('Erreur demande de permission pour les notifications:', error.message);
                    return false;
                }

            }, 

            sendLocalNotification: async( title: string, body: string, data?: any) => {

                const {permissionsStatus} = get();

                if( permissionsStatus !== 'granted'){
                    console.log('Permission non accordée pour les notifications locales.');
                    return;
                }

                await Notification.scheduleNotificationAsync({
                    content:{
                        title,
                        body,
                        data: data || {},
                        sound: 'default',
                    },
                    trigger: null,
                })
            },

            sendPushNotification: async(title: string,body: string,data?:any) => {

                const {permissionsStatus} = get();

                if(permissionsStatus !== 'granted') return;

                const {token} = get();

                if(!token){
                    console.log('Aucun token de notification disponible pour envoyer une notification push.');
                    return;
                }

                try{

                    await fetch('https://exp.host/--/api/v2/push/send',{
                        method: 'POST',
                        headers:{
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: token,
                            sound: 'default',
                            title,
                            body,
                            data: data || {},
                    }),
                });

                } catch(error: any){
                        console.log('Erreur envoi notification push:', error.message);
                }

            },
            scheduleNotification: async(title: string,body: string, second: number, data?:any) => {

                const {permissionsStatus} = get();

                if(permissionsStatus !== 'granted') {
                    throw new Error('Permission non accordée pour les notifications programmées.');
                }

                const id = await Notification.scheduleNotificationAsync({
                    content:{
                        title,
                        body,
                        data: data || {},
                        sound: 'default',
                    },
                    trigger: {
                        type: Notification.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: second,
                        repeats: false,
                    }
                });
                return id;


            },

            cancelAllNotifications: async() => {
                await Notification.cancelAllScheduledNotificationsAsync();
            },

            setLastNotification: (notification) => {
                set({lastNotification: notification});
            }

        })
    ,{
        name: 'notification-store',
        storage: createJSONStorage(()=> AsyncStorage),
        partialize: (s) => ({permissionsStatus: s.permissionsStatus, token: s.token})
    })
)

export default useNotificationStore;