import { createPrivateNotification, getUserNotificationToken } from '@/lib/appwrite';

// ============================================
// ENVOYER NOTIFICATION PUSH À UN TOKEN
// ============================================
export const sendPushNotificationToToken = async (
  token: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      }),
    });

    const result = await response.json();
    
    if (result.data?.status === 'error') {
      throw new Error(result.data.message || 'Erreur envoi notification');
    }

    console.log('✅ Push notification envoyée:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur envoi push notification:', error);
    throw error;
  }
};

// ============================================
// RÉCUPÉRER LE TOKEN D'UN UTILISATEUR
// ============================================

// ============================================
// ENVOYER NOTIFICATION COMPLÈTE (PUSH + BD)
// ============================================
export const sendCompleteNotification = async (
  userId: string,
  title: string,
  message: string,
  link: string,
  pushData?: any
) => {
  try {
    // 1. Enregistrer en base de données (toujours persisté)
    await createPrivateNotification('private', title, message, userId, link);
    console.log('✅ Notification enregistrée en BD');

    // 2. Envoyer la push notification (si token disponible)
    const token = await getUserNotificationToken(userId);
    
    if (token) {
      await sendPushNotificationToToken(token, title, message, {
        ...pushData,
        link,
      });
      console.log('✅ Push notification envoyée');
    } else {
      console.log('ℹ️ Pas de token push pour cet utilisateur');
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    return false;
  }
};


// NOTIFIER LE MARCHAND D'UNE NOUVELLE COMMANDE

export const notifyMerchantNewOrder = async (
  merchantId: string,
  orderId: string,
  restaurantName: string,
  totalItems: number,
  totalPrice: number
) => {
  const title = '🔔 Nouvelle commande !';
  const message = `${restaurantName} - ${totalItems} article(s) - ${totalPrice} F`;
  const link = `/orderDetails/${orderId}`;

  await sendCompleteNotification(merchantId, title, message, link, {
    type: 'new_order',
    orderId,
    totalPrice,
    totalItems,
    restaurantName,
  });
};


// NOTIFIER LE CLIENT QUE SA COMMANDE EST PASSÉE

export const notifyClientOrderPlaced = async (
  clientId: string,
  orderId: string,
  restaurantName: string,
  totalPrice: number
) => {
  const title = '✅ Commande passée';
  const message = `Votre commande de ${totalPrice} F a été envoyée à ${restaurantName}`;
  const link = `/orderProcess/${orderId}`;

  await sendCompleteNotification(clientId, title, message, link, {
    type: 'order_placed',
    orderId,
  });
};