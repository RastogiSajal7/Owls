import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { useAppContext } from '../AppProvider';

const ChatScreen = ({ route }) => {
  const { chatId, contact } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { contacts } = useAppContext();
  const [contactName, setContactName] = useState(contact?.name || 'Unknown');

  useEffect(() => {
    if (chatId) {
      const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });

      return () => unsubscribe();
    }
  }, [chatId]);

  useEffect(() => {
    if (!contact?.name && contact?.phoneNumber && contacts.length > 0) {
      // Attempt to find the contact name using the phone number
      const normalizedContactPhoneNumber = normalizePhoneNumber(contact.phoneNumber);
      const foundContact = contacts.find(c =>
        c.phoneNumbers && 
        normalizePhoneNumber(c.phoneNumbers[0].number) === normalizedContactPhoneNumber
      );
      if (foundContact) {
        setContactName(foundContact.name);
      }
    }
  }, [contact, contacts]);

  const handleSend = async () => {
    if (newMessage.trim()) {
      try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: newMessage,
          sender: auth.currentUser.uid,
          timestamp: new Date()
        });
        setNewMessage('');
        Keyboard.dismiss();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const normalizePhoneNumber = (number) => {
    return number.replace(/\D/g, '');  // Remove all non-numeric characters
  };

  return (
    <View style={styles.container}>
      <Text style={styles.contactName}>{contactName}</Text>

      {messages.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.message}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          inverted
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, marginRight: 10 },
  message: { padding: 10, marginBottom: 5, backgroundColor: '#e0e0e0', borderRadius: 10 },
  messageText: { fontSize: 16 },
  contactName: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});

export default ChatScreen;