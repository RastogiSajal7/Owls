import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmergencyContacts = ({ contacts, sosContacts, addSosContact }) => {
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setFilteredContacts(
      searchQuery
        ? contacts.filter(contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : contacts
    );
  }, [searchQuery, contacts]);

  const isContactSelected = contact => sosContacts.some(sosContact => sosContact.id === contact.id);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Selected: {sosContacts.length} / 5</Text>
        <TouchableOpacity>
          <Ionicons name="refresh-sharp" size={22} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const selected = isContactSelected(item);
          return (
            <TouchableOpacity
              onPress={() => !selected && sosContacts.length < 5 && addSosContact(item)}
              style={[styles.contactCard, selected && styles.selectedContactCard]}
              disabled={selected}
            >
              <Image source={require('../../assets/images/avatar.png')} style={styles.avatar} />
              <View>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phoneNumbers?.[0] && (
                  <Text style={styles.contactNumber}>{item.phoneNumbers[0].number}</Text>
                )}
              </View>
              {selected && <Ionicons style={styles.checkmarkIcon} name="checkmark-circle" size={24} color="#4caf50" />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.noContactsText}>No contacts found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  contactCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 2,
  },
  selectedContactCard: { backgroundColor: '#e0f7fa' },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactNumber: { fontSize: 14, color: '#555' },
  noContactsText: { textAlign: 'center', fontSize: 16, color: '#555' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  checkmarkIcon: { marginLeft: 20 },
});

export default EmergencyContacts;
