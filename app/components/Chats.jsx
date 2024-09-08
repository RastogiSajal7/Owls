import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useAppContext } from "../AppProvider";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // For the search input
  const { userDetails, contacts } = useAppContext();
  const navigation = useNavigation();
  const currentUserPhoneNumber = userDetails.phone;

  const normalizePhoneNumber = (number) => {
    return number.replace(/\D/g, "");
  };

  const getContactName = (phoneNumber) => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const contact = contacts.find(
      (c) =>
        c.phoneNumbers &&
        c.phoneNumbers.some(
          (num) => normalizePhoneNumber(num.number) === normalizedPhoneNumber
        )
    );
    return contact ? contact.name : "Unknown";
  };

  const fetchChats = () => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "chats"),
      (querySnapshot) => {
        const chatPromises = querySnapshot.docs.map((doc) => {
          const chatData = doc.data();
          const participants = chatData.participants || [];
  
          if (participants.includes(currentUserPhoneNumber)) {
            const participantNames = participants
              .filter((phoneNumber) => phoneNumber !== currentUserPhoneNumber)
              .map((phoneNumber) => getContactName(phoneNumber))
              .join(", ");
  
            const messagesRef = collection(db, "chats", doc.id, "messages");
            const lastMessageQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
  
            // Return a promise that resolves to a chat object with the last message
            return new Promise((resolve) => {
              onSnapshot(lastMessageQuery, (messageSnapshot) => {
                const lastMessageDoc = messageSnapshot.docs[0];
                const lastMessage = lastMessageDoc ? lastMessageDoc.data() : { text: "No messages yet.", timestamp: null };
  
                resolve({
                  id: doc.id,
                  ...chatData,
                  participants: chatData.participants,
                  participantNames: participantNames || "Unknown",
                  lastMessage: lastMessage.text,
                  lastMessageTimestamp: lastMessage.timestamp || new Date(0), // Use a default timestamp if there's no message
                });
              });
            });
          }
          return null;
        });
  
        // Wait for all promises to resolve
        Promise.all(chatPromises).then((results) => {
          // Filter out any null values and sort the chats based on last message timestamp
          const filteredChats = results.filter((chat) => chat !== null).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
          setChats(filteredChats);
          setLoading(false);
        });
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );
  
    return unsubscribe;
  };
  

  useEffect(() => {
    const unsubscribe = fetchChats();

    return () => {
      unsubscribe();
    };
  }, [userDetails]);

  const handleChatPress = (chat) => {
    const participantName = chat.participantNames || "Unknown";

    navigation.navigate("Chat", { chatId: chat.id, participantName });
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.participantNames.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={styles.title}>Chat History</Text>
        <Ionicons name="refresh-sharp" size={25} onPress={fetchChats} />
      </View>
      
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by participant name"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleChatPress(item)}
              style={styles.chatContainer}
            >
              <Image source={require('../../assets/images/profile.gif')} style={styles.avatar} />
              <View style={styles.chatInfo}>
                <Text style={styles.participantNames}>{item.participantNames || "No participants"}</Text>
                <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
                  {item.lastMessage || "No messages yet"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text>No chats available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    paddingBottom: 50,
    flex: 1,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  searchBar: {
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  chatContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    flexDirection: 'row',
    borderRadius: 10,
    elevation: 2,
    maxHeight: 80,
    overflow: "hidden",
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15 
  },
  chatInfo: {
    flex: 1, 
    justifyContent: "center",
  },
  participantNames: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
});

export default Chats;
