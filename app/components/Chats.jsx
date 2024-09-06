import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../configs/FirebaseConfig';
import { onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../AppProvider';

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { contacts } = useAppContext(); 
  const currentUserId = auth.currentUser.uid;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'chats'));  // Create a query to listen to the 'chats' collection
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const chatList = [];
  
          querySnapshot.forEach((doc) => {
            const chatData = doc.data();
            if (chatData.participants.includes(currentUserId)) {
              let lastMessage = '';
  
              // Fetch last message
              const messagesRef = collection(db, 'chats', doc.id, 'messages');
              const lastMessageQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
              getDocs(lastMessageQuery).then((lastMessageSnapshot) => {
                if (!lastMessageSnapshot.empty) {
                  lastMessage = lastMessageSnapshot.docs[0].data().text;
                }
  
                const contactPhoneNumber = chatData.participants.find(participant => participant !== currentUserId);
  
                // Normalize and match phone numbers with contacts from context
                const contact = contacts.find(c =>
                  c.phoneNumbers &&
                  normalizePhoneNumber(c.phoneNumbers[0].number) === normalizePhoneNumber(contactPhoneNumber)
                );
  
                const contactName = contact ? contact.name : 'Unknown';
  
                chatList.push({
                  id: doc.id,
                  lastMessage,
                  contactName,
                  contactPhoneNumber,
                });
  
                setChats(chatList);
              });
            }
          });
        });
  
        // Cleanup the listener on component unmount
        return () => unsubscribe();
  
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };
  
    if (contacts.length > 0) {  // Only fetch chats if contacts are available
      fetchChats();
    }
  }, [contacts]);

  const normalizePhoneNumber = (number) => {
    return number.replace(/\D/g, '');  // Remove all non-numeric characters
  };

  const handleChatPress = (chatId, contactName, contactPhoneNumber) => {
    navigation.navigate('Chat', { chatId, contact: { name: contactName, phoneNumber: contactPhoneNumber } });
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleChatPress(item.id, item.contactName, item.contactPhoneNumber)}>
            <View style={styles.chatItem}>
              <Text style={styles.chatName}>{item.contactName}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}  
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  chatItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  chatName: { fontSize: 18, fontWeight: 'bold' },
  lastMessage: { fontSize: 16, color: '#666' },
});

export default Chats;
