import React, { useEffect } from 'react';
import { Redirect, Tabs ,router} from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { isProfileComplete } from '@/lib/appwrite';
import { Image, ImageSourcePropType, Text, View, Pressable } from 'react-native';
import { images } from '@/constants';

interface TabBarIconProps {
  icon: ImageSourcePropType;
  title: string;
  focused: boolean;
}

export default function TabLayout() {
  const { isSignedIn, getToken, userId } = useAuth();

  useEffect(() => {
    const checkProfile = async () => {
      if (userId && getToken) {
        try {
          const isComplete = await isProfileComplete(userId, getToken);
          if (!isComplete) router.replace('/(auth)/info'); // Redirect correct en effet
        } catch (error) {
          console.error('Erreur:', error);
        }
      }
    };
    checkProfile();
  }, [userId, getToken]);

  if (!isSignedIn) return <Redirect href='/(auth)/welcome'/>;

  const TabBarIcon = ({ focused, title, icon }: TabBarIconProps) => (
    <View className="h-full items-center justify-center gap-1 px-1 mt-3">
      <Image
        source={icon}
        className="size-7"
        resizeMode="contain"
        tintColor={focused ? '#48681B' : '#B0B3B2'}
      />
      <Text
        numberOfLines={1}
        className={`w-full  text-center leading-4 text-[11px] ${focused ? 'text-primary-400' : 'text-neutral-400'}`}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 75,
          backgroundColor: 'white',
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: 10,
          elevation: 5,
        },

        // ↓ Opacité plus légère au press (et ripple Android)
        tabBarButton: (props) => (
          <Pressable
            android_ripple={{color: 'rgba(0,0,0,.07)'}}
            {...props}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ focused }) => <TabBarIcon title="Accueil" icon={images.acceuil} focused={focused} /> }}
      />
      <Tabs.Screen
        name="aide"
        options={{ title: 'Aide', tabBarIcon: ({ focused }) => <TabBarIcon title="Aide" icon={images.aide} focused={focused} /> }}
      />
      <Tabs.Screen
        name="adresses"
        options={{ title: 'Adresses', tabBarIcon: ({ focused }) => <TabBarIcon title="Adresses" icon={images.adresse} focused={focused} /> }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: 'Activité', tabBarIcon: ({ focused }) => <TabBarIcon title="Activité" icon={images.activity} focused={focused} /> }}
      />
      <Tabs.Screen
        name="compte"
        options={{ title: 'Compte', tabBarIcon: ({ focused }) => <TabBarIcon title="Compte" icon={images.compte} focused={focused} /> }}
      />
    </Tabs>
  );
}
