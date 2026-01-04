// hooks/useMessages.ts - VERSION OPTIMISÉE
import { useEffect, useState, useRef } from 'react';
import { databases, client, appwriteConfig } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

interface Message {
  $id: string;
  conversationId: string;
  content: string;
  sender_id: string;
  $createdAt: string;
}

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ Éviter les doublons avec un Set
  const processedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    if (!conversationId) return;

    // ✅ Capturer la référence locale pour le cleanup
    const messageIds = processedMessageIds.current;

    // 1️⃣ CHARGER L'HISTORIQUE
    const loadMessages = async () => {
      try {
        const response = await databases.listDocuments<Message>(
          appwriteConfig.databaseId,
          appwriteConfig.messagesCollectionId,
          [
            Query.equal('conversationId', conversationId),
            Query.orderAsc('$createdAt'),
            Query.limit(50),
          ]
        );
        
        setMessages(response.documents);
        
        // ✅ Marquer tous les messages existants comme traités
        response.documents.forEach(msg => {
          messageIds.add(msg.$id);
        });
        
        console.log(`✅ ${response.documents.length} messages chargés`);
      } catch (error) {
        console.error('❌ Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // 2️⃣ ÉCOUTER LES NOUVEAUX MESSAGES EN TEMPS RÉEL
    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.messagesCollectionId}.documents`;

    const unsubscribe = client.subscribe(channel, (response: any) => {
      const payload = response.payload;

      // Extraire l'ID de conversation (objet ou string)
      const payloadConvId = typeof payload.conversationId === 'string' 
        ? payload.conversationId 
        : payload.conversationId?.$id;

      // Vérifier que c'est pour cette conversation
      if (payloadConvId !== conversationId) return;

      // Vérifier que c'est un nouveau message
      if (!response.events.includes('databases.*.collections.*.documents.*.create')) return;

      // ✅ Vérifier si déjà traité (évite les doublons)
      if (messageIds.has(payload.$id)) {
        console.log('⚠️ Doublon détecté, ignoré:', payload.$id);
        return;
      }

      console.log('📨 Nouveau message reçu:', payload.content);

      // ✅ Marquer comme traité AVANT d'ajouter
      messageIds.add(payload.$id);

      // ✅ Normaliser le payload (conversationId peut être un objet)
      const normalizedMessage: Message = {
        $id: payload.$id,
        conversationId: payloadConvId,
        content: payload.content,
        sender_id: payload.sender_id,
        $createdAt: payload.$createdAt,
      };

      setMessages(prev => [...prev, normalizedMessage]);
      console.log('✅ Message ajouté à la liste');
    });

    console.log('🔌 Realtime connecté');

    // 3️⃣ CLEANUP
    return () => {
      unsubscribe();
      messageIds.clear(); 
      console.log('🔌 Realtime déconnecté');
    };
  }, [conversationId]);

  return { messages, loading };
};