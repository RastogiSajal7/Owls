import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';

const Home = () => {
  const navigation = useNavigation();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15, 
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim]);

  const handleSwipe = (event) => {
    const { translationY } = event.nativeEvent;
    if (translationY < -50) {  // Swipe upwards threshold
      navigation.navigate('SignUp');
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleSwipe}>
      <View style={styles.container}>
        <View style={styles.upperCircularEffect}>
          <Image style={styles.conversationImage} alt='conversation' source={require('../../assets/images/Conversation.png')} />
        </View>
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.letterContainer, { transform: [{ translateY: bounceAnim }] }]}>
            <Image style={styles.owl} alt='owl' source={require('../../assets/images/owl.png')} />
          </Animated.View>
        </View>
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  upperCircularEffect: {
    width: '100%',
    height: '75%',
    backgroundColor: '#ffd759',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    alignItems: 'center',
  },
  conversationImage: {
    height: 600,
    width: 400,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  owl: {
    width: 300,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  letterContainer: {
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
  },
});

export default Home;
