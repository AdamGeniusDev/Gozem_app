import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const RestaurantCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="w-full h-[280px] bg-white rounded-2xl overflow-hidden mb-4 shadow-sm">
      {/* Image skeleton */}
      <Animated.View 
        style={{ opacity }}
        className="w-full h-[160px] bg-gray-200"
      />

      {/* Content skeleton */}
      <View className="p-4 space-y-3">
        {/* Restaurant name */}
        <Animated.View 
          style={{ opacity }}
          className="h-5 w-3/4 bg-gray-200 rounded"
        />

        {/* Rating and delivery info */}
        <View className="flex-row items-center space-x-2">
          <Animated.View 
            style={{ opacity }}
            className="h-4 w-16 bg-gray-200 rounded mt-3"
          />
          <Animated.View 
            style={{ opacity }}
            className="h-4 w-32 bg-gray-200 rounded mt-3"
          />
        </View>

        {/* Specialities */}
        <Animated.View 
          style={{ opacity }}
          className="h-4 w-full bg-gray-200 rounded mt-2"
        />
      </View>

      {/* Delivery time badge skeleton */}
      <Animated.View 
        style={{ opacity }}
        className="absolute top-3 right-3 w-20 h-8 bg-gray-300 rounded-lg"
      />

      {/* Favorite button skeleton */}
      <Animated.View 
        style={{ opacity }}
        className="absolute top-3 left-3 w-10 h-10 bg-gray-300 rounded-full"
      />
    </View>
  );
};

export default RestaurantCardSkeleton;