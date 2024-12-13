import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { useNavigation } from '@react-navigation/native';

const useEmergencyMessage = (userDetails) => {
  const [location, setLocation] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchLocation = async () => {
      const coords = await requestLocationWithPopup();
      if (coords) {
        setLocation(coords);
      }
    };
    fetchLocation();
  }, []);

  const requestLocationWithPopup = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        return loc.coords;
      }

      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        return loc.coords;
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to send emergency messages. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return null;
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert('Error', 'Unable to fetch location. Please try again.');
      return null;
    }
  };

  const getOrCreateChatId = async (contactPhoneNumber) => {
    const currentUserPhoneNumber = userDetails.phone;
    const chatParticipants = [currentUserPhoneNumber, contactPhoneNumber].sort();
    const chatId = `${chatParticipants[0]}_${chatParticipants[1]}`;
  
    const chatRef = collection(db, 'chats');
    const chatSnapshot = await getDocs(query(chatRef, where('__name__', '==', chatId)));
  
    if (chatSnapshot.empty) {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUserPhoneNumber, contactPhoneNumber],
      });
    }
    return chatId;
  };

  const sendEmergencyMessage = async (sosContacts) => {
    try {
      const currentLocation = await requestLocationWithPopup();
      if (!currentLocation) return;

      const emergencyMessage = `Emergency! I need help. Please respond immediately. I am sharing my live location: https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
      navigation.navigate('Chats');
      const currentUserId = auth.currentUser.uid;

      for (let contact of sosContacts) {
        const contactPhoneNumber = contact.phoneNumbers[0].number;
        const chatId = await getOrCreateChatId(contactPhoneNumber);
  
        if (chatId) {
          const messageData = {
            text: emergencyMessage,
            sender: currentUserId,
            timestamp: new Date(),
          };

          const chatMessagesRef = collection(db, 'chats', chatId, 'messages');
          await setDoc(doc(chatMessagesRef), messageData);
          console.log(`Emergency message sent to ${contact.name}`);
        }
      }

      Alert.alert('Success', 'Emergency message sent to all selected contacts!');
    } catch (error) {
      console.error('Failed to send emergency message:', error);
      Alert.alert('Error', 'Failed to send emergency message. Please try again.');
    }
  };

  return { sendEmergencyMessage };
};

export default useEmergencyMessage;
