// app/ChampionChat/[id].tsx
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { sendMessage } from '@/lib/appwrite';
import { useUserStore } from '@/store/user.store';
import { images } from '@/constants';
import { useMessages } from '@/lib/useMessage';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChampionChat = () => {
  const { id: conversationId, championName, championAvatar } = useLocalSearchParams<{
    id: string;
    championName?: string;
    championAvatar?: string;
  }>();
  
  const currentUser = useUserStore((state) => state.user);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const { messages, loading } = useMessages(conversationId as string);

  // ✅ Calculer si on peut envoyer
  const canSend = text.trim().length > 0 && !isSending;

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmedText = text.trim();
    
    if (!trimmedText || !currentUser?.$id || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(conversationId as string, trimmedText, currentUser.$id,'champion');
      setText('');
      scrollToBottom();
    } catch (error) {
      console.error('❌ Erreur envoi:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#48681B" />
          <Text className="mt-3 text-gray-500">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header avec avatar du champion */}
        <View className="bg-primary-400 px-5 py-4">
          <View className="flex-row items-center gap-x-3">
            <Pressable onPress={() => router.back()} hitSlop={15}>
              <Image
                source={images.back}
                className="w-5 h-5"
                tintColor="white"
                resizeMode="contain"
              />
            </Pressable>

            {championAvatar ? (
              <View className="w-12 h-12 rounded-full overflow-hidden bg-white">
                <Image
                  source={{ uri: championAvatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center">
                <Image
                  source={images.utilisateur}
                  className="w-8 h-8"
                  tintColor="#48681B"
                  resizeMode="contain"
                />
              </View>
            )}

            <View className="flex-1">
              <Text className="font-poppins-bold text-white text-[18px]">
                {championName || 'Votre Champion'}
              </Text>
              <Text className="text-white/80 text-[13px]">
                En ligne
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUser?.$id;
            return (
              <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
                <View
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-primary-400 rounded-br-none'
                      : 'bg-gray-200 rounded-bl-none'
                  }`}
                >
                  <Text className={isMe ? 'text-white' : 'text-gray-900'}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Image
                  source={images.utilisateur}
                  className="w-12 h-12"
                  tintColor="#48681B"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-500 text-center text-[15px] font-medium">
                Démarrez la conversation
              </Text>
              <Text className="text-gray-400 text-center text-[13px] mt-2 px-8">
                Posez vos questions à votre champion concernant votre livraison
              </Text>
            </View>
          }
          onContentSizeChange={scrollToBottom}
        />

        {/* Zone de saisie */}
        <View className="border-t border-gray-200 bg-white px-4 py-3">
          <View className="flex-row gap-2">
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Votre message..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                className="text-[15px] text-gray-900 max-h-24"
                editable={!isSending}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                canSend ? 'bg-primary-400' : 'bg-gray-300'
              }`}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Image
                  source={images.send || images.back}
                  className="w-5 h-5"
                  tintColor="white"
                  resizeMode="contain"
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChampionChat;