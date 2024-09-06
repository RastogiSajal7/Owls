import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const LoadingIndicator = () => {
 
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
 
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 1000, 
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1, 
          duration: 1000, 
          useNativeDriver: true, 
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/images/owl.png')}
        style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
  },
});

export default LoadingIndicator;
