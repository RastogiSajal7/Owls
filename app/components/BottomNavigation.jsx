import React from "react";
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Profile from "./Profile";
import Chats from "./Chats";
import Stories from "./Stories";
import Contacts from "./Contacts";
import { useRoute } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const route = useRoute();
  const { username } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Chats":
              iconName = focused ? "chatbox-ellipses" : "chatbox-ellipses-outline";
              break;
            case "Stories":
              iconName = focused ? "images" : "images-outline";
              break;
            case "Add":
              iconName = focused ? "add-circle" : "add-circle-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            case "Contacts":
              iconName = focused ? "people" : "people-outline";
              break;
            default:
              iconName = "home";
          }

          return (
            <View>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: "#005246",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen
        name="Chats"
        children={() => <Chats username={username} />}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Stories"
        children={() => <Stories username={username} />}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
      name="Add"
      component={View}
      options={{
        tabBarButton: (props) => (
          <TouchableOpacity {...props} onPress={() => alert('Add feature coming soon!')}>
            <View style={styles.addCircle}>
            <Ionicons name="add-circle" size={60} color="#005246" />
            </View>
          </TouchableOpacity>
        ),
      }}
      />
      <Tab.Screen
        name="Contacts"
        children={() => <Contacts username={username} />}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        children={() => <Profile username={username} />}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  addCircle: {
    position: 'absolute',
    bottom: 20,
    height: 60,
    width: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, 
  }
})
