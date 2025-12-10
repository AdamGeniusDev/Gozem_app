import { GestureHandlerRootView } from "react-native-gesture-handler";
import './global.css';
import 'react-native-reanimated';
import { SplashScreen, Stack } from "expo-router";
import {useFonts} from 'expo-font';
import { useCallback, useEffect } from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {ClerkProvider} from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { loaders } from '@/constants';
import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/i18n/index';
import { useCartInitialization } from "@/hooks/useCartInitialization";

Sentry.init({
  dsn: 'https://2ed88e3bf6e402259453c5e5c0330312@o4509044325744640.ingest.de.sentry.io/4509982614814800',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {

  useCartInitialization();

  SplashScreen.preventAutoHideAsync().catch(()=>{})

  const [fontLoaded,error] = useFonts({
    "Black": require("../assets/fonts/black.otf"),
    "Bold": require("../assets/fonts/bold.otf"),
    "Cursive": require("../assets/fonts/cursive.ttf"),
    "ExtraBold": require("../assets/fonts/extra_bold.ttf"),
    "Medium": require("../assets/fonts/medium.otf"),
    "Regular": require("../assets/fonts/regular.otf"),
    "SemiBold": require("../assets/fonts/semi_bold.otf"),
    "RobotoMedium": require("../assets/fonts/roboto_medium_numbers.ttf"),
    "Poppins": require("../assets/fonts/poppins.ttf"),
    "PoppinsExtra": require("../assets/fonts/poppins-extra.ttf"),
    "PoppinsBold": require("../assets/fonts/poppins-bold.ttf"),
  })

  useEffect(()=>{
    if(error) throw error;
  },[error]);

   const onLoaderLayout = useCallback(async () => {
    // on cache le splash dès que le Loader React est visible
    try {
      await SplashScreen.hideAsync();
    } catch {}
  }, []);

  if(!fontLoaded){
    return (
     <View
     onLayout={onLoaderLayout}
     style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}
      >
                {/* Lottie */}
                <LottieView
                  source={loaders.loader}   // ex: require('../assets/anim/Cosmos.json')
                  autoPlay
                  loop
                  style={{ width: 96, height: 96 }}
                />
                <Text className="font-medium mt-3 text-neutral-700 text-[15px]">Chargement...</Text>
                {/* Fallback si Lottie met du temps à se charger
                <ActivityIndicator size="large" />
                */}
                
              </View>
    )
  }

  
  return (
    //bottomSheetModalProvider ici c'est dans le cas ou je voudrais utiliser un bottom sheet modal
    <ClerkProvider tokenCache={tokenCache}>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <Stack screenOptions={{headerShown: false}} />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
});