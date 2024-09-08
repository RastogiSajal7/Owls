import React from 'react';
import { AppProvider } from './AppProvider';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from './components/Home';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import BottomNavigation from './components/BottomNavigation';
import SignUp from './components/SignUp';
import ChatScreen from './components/ChatScreen';

const Stack = createNativeStackNavigator();

export default function Index() {
  return (
    <AppProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar hidden={true} />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
          <Stack.Screen name="MainPage" component={BottomNavigation} options={{ headerShown: false }} />
          <Stack.Screen name='Chat' component={ChatScreen} options={{ headerShown: true }} />
        </Stack.Navigator>
      </GestureHandlerRootView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});