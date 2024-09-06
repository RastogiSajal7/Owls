import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, Image, TouchableOpacity } from 'react-native';
import * as Contacts from 'expo-contacts';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../configs/FirebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAppContext } from '../AppProvider';

const ContactsScreen = () => {
  const navigation = useNavigation();
  const { contacts, setContacts } = useAppContext();
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const getContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        const filteredContacts = data.filter(
          (contact) =>
            Array.isArray(contact.phoneNumbers) && contact.phoneNumbers.length > 0
        );

        if (filteredContacts.length > 0) {
          setContacts(filteredContacts);
          setFilteredContacts(filteredContacts);
        }
      }

      setLoading(false);
    };

    getContacts();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query) {
      const filtered = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  };

  const getOrCreateChatId = async (contact) => {
    const currentUserId = auth.currentUser.uid;
    const contactPhoneNumber = contact.phoneNumbers[0].number;  // Get contact's phone number
  
    // Normalize phone numbers for consistent chatId
    const normalizedCurrentUserPhoneNumber = normalizePhoneNumber(auth.currentUser.phoneNumber);
    const normalizedContactPhoneNumber = normalizePhoneNumber(contactPhoneNumber);
  
    // Sort by normalized phone numbers for consistent chatId
    const chatParticipants = [normalizedCurrentUserPhoneNumber, normalizedContactPhoneNumber].sort();
    const chatId = `${chatParticipants[0]}_${chatParticipants[1]}`;
  
    const chatRef = collection(db, 'chats');
    const chatSnapshot = await getDocs(query(chatRef, where('__name__', '==', chatId)));
  
    if (!chatSnapshot.empty) {
      return chatId;
    } else {
      // Store both normalized phone numbers in the participants array
      await setDoc(doc(db, 'chats', chatId), {
        participants: [normalizedCurrentUserPhoneNumber, normalizedContactPhoneNumber],
      });
      return chatId;
    }
  };

  const normalizePhoneNumber = (number) => {
    return number.replace(/\D/g, '');  // Remove all non-numeric characters
  };

  const handleContactPress = async (contact) => {
    try {
      const chatId = await getOrCreateChatId(contact);  // Call the function to get or create the chatId

      // Once the chatId is retrieved, navigate to the Chat screen
      if (chatId) {
        navigation.navigate('Chat', { chatId, contact });
      } else {
        console.log("Unable to retrieve or create chatId.");
      }
    } catch (error) {
      console.log("Error handling contact press:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00f" />
      </View>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.container}>
        <Text style={styles.noAccessText}>No access to contacts. Please grant permission in your device settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <Text style={styles.totalContactsText}>
        Total Contacts: {filteredContacts.length}
      </Text>
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
  totalContactsText: { alignSelf: 'flex-end', fontSize: 16, color: '#333', marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  contactCard: { backgroundColor: '#fff', padding: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc', marginRight: 15 },
  contactName: { fontSize: 18, fontWeight: '600', color: '#333' },
  contactNumber: { fontSize: 16, color: '#555', marginTop: 5 },
  noAccessText: { fontSize: 16, color: '#f00', textAlign: 'center' },
  noContactsText: { fontSize: 16, color: '#555', textAlign: 'center', marginTop: 20 }
});

export default ContactsScreen;
