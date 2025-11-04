import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Image, ImageSourcePropType, Text, View, Pressable } from 'react-native';
import { images } from '@/constants';


interface TabBarIconProps {
  icon: ImageSourcePropType;
  title: string;
  focused: boolean;
}

export default function TabLayout() {

  const { isSignedIn} = useAuth();


  if (!isSignedIn) return <Redirect href='/(auth)/welcome'/>;

  const TabBarIcon = ({ focused, title, icon }: TabBarIconProps) => (
    <View className="h-full items-center justify-center gap-1 px-1 mt-3">
      <Image
        source={icon}
        className="size-7"
        resizeMode="contain"
        tintColor={focused ? '#169137' : '#B0B3B2'}
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
          paddingTop: 8,
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
        name="food"
        options={{ title: 'Food', tabBarIcon: ({ focused }) => <TabBarIcon title="Food" icon={images.food} focused={focused} /> }}
      />
     
      <Tabs.Screen
        name="favoris"
        options={{ title: "Favoris", tabBarIcon: ({ focused }) => <TabBarIcon title="Favoris" icon={images.coeurp} focused={focused} /> }}
      />
      <Tabs.Screen
        name="panier"
        options={{ title: "Panier", tabBarIcon: ({ focused }) => <TabBarIcon title="Panier" icon={images.panierr} focused={focused} /> }}
      />
      <Tabs.Screen
        name="commandes"
        options={{ title: "Commandes", tabBarIcon: ({ focused }) => <TabBarIcon title="Commande" icon={images.commande} focused={focused} /> }}
      />
    </Tabs>
  );
}
