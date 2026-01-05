import { GestureHandlerRootView } from "react-native-gesture-handler";
import './global.css';
import 'react-native-reanimated';
import { SplashScreen, Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { useCallback, useEffect } from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { loaders } from '@/constants';
import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/i18n/index';
import { useCartInitialization } from "@/hooks/useCartInitialization";
import { KkiapayProvider } from '@kkiapay-org/react-native-sdk';
import { OfflineScreen } from '@/components/OfflineScreen';
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import Constants from 'expo-constants';

// ✅ Récupération de la clé Clerk depuis les variables d'environnement
const getClerkPublishableKey = () => {
  // En développement : utiliser process.env
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  
  // En build : utiliser Constants.expoConfig.extra
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
};

const publishableKey = getClerkPublishableKey();

if (!publishableKey) {
  throw new Error(
    'Missing Clerk Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment variables.'
  );
}

Sentry.init({
  dsn: 'https://2ed88e3bf6e402259453c5e5c0330312@o4509044325744640.ingest.de.sentry.io/4509982614814800',
  sendDefaultPii: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

// ✅ Composant séparé pour la vérification réseau (à l'intérieur des providers)
function AppContent() {
  useCartInitialization();
  const { isOnline } = useNetworkStatus();

  // Si pas de connexion, afficher l'écran offline
  if (isOnline === false) {
    return <OfflineScreen />;
  }

  // App normale avec connexion
  return (
    <BottomSheetModalProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BottomSheetModalProvider>
  );
}

export default Sentry.wrap(function RootLayout() {
  SplashScreen.preventAutoHideAsync().catch(() => {})

  const [fontLoaded, error] = useFonts({
    "Black": require("../assets/fonts/black.otf"),
    "Bold": require("../assets/fonts/bold.otf"),
    "Cursive": require("../assets/fonts/cursive.ttf"),
    "ExtraBold": require("../assets/fonts/extra_bold.ttf"),
    "Medium": require("../assets/fonts/medium.otf"),
    "Regular": require("../assets/fonts/regular.otf"),
    "SemiBold": require("../assets/fonts/semi_bold.ttf"),
    "RobotoMedium": require("../assets/fonts/roboto_medium_numbers.ttf"),
    "Poppins": require("../assets/fonts/poppins.ttf"),
    "PoppinsExtra": require("../assets/fonts/poppins-extra.ttf"),
    "PoppinsBold": require("../assets/fonts/poppins-bold.ttf"),
  })

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const onLoaderLayout = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {}
  }, []);

  // Écran de chargement des fonts
  if (!fontLoaded) {
    return (
      <View
        onLayout={onLoaderLayout}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}
      >
        <LottieView
          source={loaders.loader}
          autoPlay
          loop
          style={{ width: 96, height: 96 }}
        />
        <Text className="font-medium mt-3 text-neutral-700 text-[15px]">
          Chargement...
        </Text>
      </View>
    )
  }

  // ✅ Providers puis AppContent (qui gère le réseau)
  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
    >
      <KkiapayProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </KkiapayProvider>
    </ClerkProvider>
  );
});