import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfig';
import { useAppContext } from '../AppProvider';

const ContactsScreen = () => {
  const navigation = useNavigation();
  const { contacts, contactLoading, userDetails, permissionStatus } = useAppContext();
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
    } else {
      // Filter contacts based on the search query
      const filtered = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Function to get or create chat ID
  const getOrCreateChatId = async (contact) => {
    const currentUserPhoneNumber = userDetails.phone;
    const contactPhoneNumber = contact.phoneNumbers[0].number;

    const chatParticipants = [currentUserPhoneNumber, contactPhoneNumber].sort();
    const chatId = `${chatParticipants[0]}_${chatParticipants[1]}`;

    const chatRef = collection(db, 'chats');
    const chatSnapshot = await getDocs(query(chatRef, where('__name__', '==', chatId)));

    if (!chatSnapshot.empty) {
      return chatId;
    } else {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUserPhoneNumber, contactPhoneNumber],
      });
      return chatId;
    }
  };

  // Handle contact press
  const handleContactPress = async (contact) => {
    try {
      const chatId = await getOrCreateChatId(contact);

      if (chatId) {
        const participantName = contact.name; 
        navigation.navigate('Chat', { chatId, participantName }); 
      } else {
        console.log('Unable to retrieve or create chatId.');
      }
    } catch (error) {
      console.log('Error handling contact press:', error);
    }
  };

  if (contactLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00f" />
      </View>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.container}>
        <Text style={styles.noAccessText}>
          No access to contacts. Please grant permission in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.totalContactsText} >
        <Text style={{fontSize: 15, color: '#333', fontWeight: 'bold'}}>
          Total Contacts: {filteredContacts.length}
        </Text>
        <Ionicons name="refresh-sharp" size={22}  />
      </View>
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleContactPress(item)} style={styles.contactCard}>
            <Image source={require('../../assets/images/avatar.png')} style={styles.avatar} />
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                <Text style={styles.contactNumber}>{item.phoneNumbers[0].number}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.noContactsText}>No contacts found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  searchBar: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20 },
  totalContactsText: { flexDirection: 'row', alignSelf: 'flex-end', marginBottom: 10, gap: 20 },
  contactCard: { backgroundColor: '#fff', padding: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 10, elevation: 2 },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactNumber: { fontSize: 14, color: '#555' },
  noContactsText: { textAlign: 'center', fontSize: 16, color: '#555' },
  noAccessText: { textAlign: 'center', fontSize: 16, color: 'red' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
});

export default ContactsScreen;
