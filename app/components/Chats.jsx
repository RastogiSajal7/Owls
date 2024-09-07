import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/FirebaseConfig";
import { useAppContext } from "../AppProvider";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
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
        const chatsData = querySnapshot.docs.map((doc) => {
          const chatData = doc.data();
          const participants = chatData.participants || [];

          // Check if the user is a participant
          if (participants.includes(currentUserPhoneNumber)) {
            const participantNames = participants
              .filter((phoneNumber) => phoneNumber !== currentUserPhoneNumber)
              .map((phoneNumber) => {
                const name = getContactName(phoneNumber);
                return name;
              })
              .join(", ");

            return {
              id: doc.id,
              ...chatData,
              participants: chatData.participants,
              participantNames: participantNames || "Unknown",
            };
          }
          return null; // Exclude chats where user is not a participant
        }).filter((chat) => chat !== null);

        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return unsubscribe; // Return the unsubscribe function
  };

  useEffect(() => {
    const unsubscribe = fetchChats(); // Set up the snapshot listener

    return () => {
      unsubscribe(); // Clean up the listener on component unmount
    };
  }, [userDetails]); // Re-fetch if userDetails change

  const handleChatPress = (chat) => {
    const participantName = chat.participantNames || "Unknown"; // Get the name of the participant
  
    navigation.navigate("Chat", { chatId: chat.id, participantName }); // Navigate to Chat screen with chatId and participantName
  };
  

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.title}>Chat History</Text>
        <Ionicons name="refresh-sharp" size={25} onPress={fetchChats} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleChatPress(item)}
              style={styles.chatContainer}
            >
              <Text>{item.participantNames || "No participants"}</Text>
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
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: "bold" },
  chatContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffd759",
    borderRadius: 5,
  },
  lastMessage: { fontSize: 14, color: "gray", marginTop: 5 },
});

export default Chats;
