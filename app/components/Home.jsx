import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAppContext } from '../AppProvider';

const Home = () => {
  const navigation = useNavigation();
  const {isLoggedIn} = useAppContext();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -25,
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
    if (translationY < -50) {
      if (isLoggedIn) {
        navigation.navigate('MainPage');
      } else {
        navigation.navigate('SignUp');
      }
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleSwipe}>
      <View style={styles.container}>
        <View style={styles.upperCircularEffect}>
          <Image
            style={styles.conversationImage}
            alt="conversation"
            source={require('../../assets/images/Conversation.png')}
          />
        </View>
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.letterContainer, { transform: [{ translateY: bounceAnim }] }]}>
            <Image
              style={styles.owl}
              alt="owl"
              source={require('../../assets/images/owl.png')}
            />
            <Image
              style={styles.parchment}
              alt="parchment"
              source={require('../../assets/images/parchment.png')}
            />
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
    height: 200,
    resizeMode: 'contain',
  },
  parchment: {
    width: 80,
    height: 100,
    resizeMode: 'contain',
    marginTop: -85,
  },
  letterContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default Home;
