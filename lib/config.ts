import Constants from 'expo-constants';

const getEnvVar = (key: string): string => {
  let value: string | undefined;
  
  // En développement : utiliser process.env
  if (__DEV__) {
    value = (process.env as any)[key];
  } else {
    // En build : utiliser Constants.expoConfig.extra
    value = Constants.expoConfig?.extra?.[key];
  }
  
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  
  return value;
};

export const ENV = {
  APPWRITE_PROJECT_ID: getEnvVar('EXPO_PUBLIC_APPWRITE_PROJECT_ID'),
  APPWRITE_ENDPOINT: getEnvVar('EXPO_PUBLIC_APPWRITE_ENDPOINT'),
  APPWRITE_API_KEY: getEnvVar('EXPO_PUBLIC_APPWRITE_API_KEY'),
  CLERK_PUBLISHABLE_KEY: getEnvVar('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  GEOAPIFY_API_KEY: getEnvVar('EXPO_PUBLIC_GEOAPIFY_API_KEY'),
  KKIAPAY_PUBLIC_KEY: getEnvVar('EXPO_PUBLIC_KKIAPAY_PUBLIC_KEY'),
};