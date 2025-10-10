import { useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { account } from './appwrite'; 

export function useLogoutUser() {
  const { signOut } = useClerk();

  const logoutUser = async () => {
    try {
      // Déconnexion Clerk
      await signOut();

      // Déconnexion Appwrite
      await account.deleteSession('current').catch(() => {});

      // Redirection
      router.replace('/(auth)/sign');
    } catch (e) {
      console.log('Erreur de déconnexion:', e);
    }
  };

  return logoutUser;
}
