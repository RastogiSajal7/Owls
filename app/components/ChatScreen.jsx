import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../configs/FirebaseConfig";

const ChatScreen = ({ route }) => {
  const { chatId, participantName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [contactName, setContactName] = useState(participantName || "Unknown");
  const currentUserId = auth.currentUser.uid;

  useEffect(() => {
    if (chatId) {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

      return () => unsubscribe();
    }
  }, [chatId]);

  const handleSend = async () => {
    if (newMessage.trim()) {
      try {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: newMessage,
          sender: currentUserId,
          timestamp: new Date(),
        });
        setNewMessage("");
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === currentUserId;
    return (
      <View
        style={[
          styles.message,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
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
          renderItem={renderMessage}
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
        <Button style={styles.sendButton} title="Send" onPress={handleSend} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  message: { padding: 10, marginBottom: 5, borderRadius: 10, maxWidth: "80%" },
  currentUserMessage: {
    backgroundColor: "#d1f7c4",
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    backgroundColor: "#ffd759",
    alignSelf: "flex-start",
  },
  messageText: { fontSize: 16 },
  contactName: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});

export default ChatScreen;
