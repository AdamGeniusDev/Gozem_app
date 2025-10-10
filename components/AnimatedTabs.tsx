// Fichier: components/AnimatedTabs.tsx
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from 'react-native'
import  { useState, useRef, useCallback } from 'react'
import { AnimatedTabsProps } from '@/types/type';

const screenWidth = Dimensions.get('window').width

const AnimatedTabs= ({
  routes,
  initialView = 0,
  containerStyle,
  activeColor = 'white',
  inactiveColor = '#6b7280',
  backgroundColor = '#f3f4f6',
  indicatorColor = '#059669'
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState(initialView);
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([initialView]));
  const indicator = useRef(new Animated.Value(initialView)).current;

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    setLoadedTabs(prev => new Set([...prev, index]));
    
    Animated.spring(indicator, {
      toValue: index,
      useNativeDriver: false,
      tension: 20,
      friction: 8
    }).start()
  }, [indicator]);

  const renderTabBar = () => {
    const indicatorWidth = 100 / routes.length;

    return (
      <View style={[styles.tabBarContainer, { backgroundColor }, containerStyle]}>
        <Animated.View
          style={[
            styles.backgroundIndicator,
            {
              backgroundColor: indicatorColor,
              width: `${indicatorWidth}%`,
              transform: [{
                translateX: indicator.interpolate({
                  inputRange: [0, routes.length - 1],
                  outputRange: [0, (screenWidth * 0.85 * (routes.length - 1)) / routes.length]
                })
              }]
            }
          ]}
        />
        
        <View style={styles.containerTab}>
          {routes.map((route, index) => (
            <Pressable
              key={route.key}
              onPress={() => handleTabPress(index)}
              style={styles.tabItem}
            >
              <Text style={[
                styles.tabText,
                { color: inactiveColor },
                activeTab === index && [styles.activeTabText, { color: activeColor }]
              ]}>
                {route.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderActiveContent = () => {
    if (!loadedTabs.has(activeTab)) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      );
    }
    
    const ActiveComponent = routes[activeTab].component;
    return <ActiveComponent />
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <View style={styles.contentContainer}>
        {renderActiveContent()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'relative',
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backgroundIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 21,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    left: 4,
  },
  containerTab: {
    flexDirection: 'row',
    width: '100%',
    zIndex: 2,
    height: 44,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabText: {
    fontFamily: 'regular',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    fontFamily: 'medium',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedTabs;