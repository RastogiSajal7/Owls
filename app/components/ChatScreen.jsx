import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const ChatScreen = ({ route, navigation }) => {
  const { chatId, participantName, participantProfilePic } = route.params;
  const currentUserId = auth.currentUser.uid;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [lastTap, setLastTap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(40);
  const [selectedMessages, setSelectedMessages] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: "#fff",
      },
      headerTitle: () =>
        selectedMessages.length > 0 ? (
          <TouchableOpacity onPress={handleDeleteSelectedMessages}>
            <Ionicons name="trash" size={28} color="#0a0a0a" />
          </TouchableOpacity>
        ) : (
          <View style={styles.header}>
            <Image
              source={
                participantProfilePic
                  ? { uri: participantProfilePic }
                  : require("../../assets/images/profile.gif")
              }
              style={styles.avatar}
            />
            <Text style={styles.contactName}>{participantName || "Unknown"}</Text>
          </View>
        ),
    });

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
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [chatId, participantName, participantProfilePic, selectedMessages]);

  const handleSend = async () => {
    if (newMessage.trim()) {
      try {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          text: newMessage,
          sender: currentUserId,
          timestamp: new Date(),
          likedByCurrentUser: false,
        });
        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleDoubleTap = async (messageId, likedByCurrentUser) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      try {
        const messageRef = doc(db, "chats", chatId, "messages", messageId);
        await updateDoc(messageRef, {
          likedByCurrentUser: !likedByCurrentUser,
        });
      } catch (error) {
        console.error("Error liking/unliking message:", error);
      }
    } else {
      setLastTap(now);
    }
  };

  const handleLongPress = (messageId) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages((prev) => prev.filter((id) => id !== messageId));
    } else {
      setSelectedMessages((prev) => [...prev, messageId]);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    try {
      const batch = writeBatch(db);

      selectedMessages.forEach((messageId) => {
        const message = messages.find((msg) => msg.id === messageId);

        if (message && message.sender === currentUserId) {
          const messageRef = doc(db, "chats", chatId, "messages", messageId);
          batch.delete(messageRef);
        }
      });

      await batch.commit();
      setSelectedMessages([]); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting messages:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === currentUserId;
    const likedByCurrentUser = item.likedByCurrentUser || false;
    const isSelected = selectedMessages.includes(item.id);

    return (
      <TouchableOpacity
        style={{ paddingRight: 5 }}
        onPress={() => handleDoubleTap(item.id, likedByCurrentUser)}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={1}
      >
        <View
          style={[
            styles.message,
            isCurrentUser
              ? styles.currentUserMessage
              : styles.otherUserMessage,
            isSelected && styles.selectedMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          {likedByCurrentUser && (
            <View style={styles.LikeSuperContainer}>
              <View style={styles.likeIconContainer}>
                <Ionicons
                  name="heart"
                  size={18}
                  color="red"
                  style={styles.likeIcon}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
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
          style={[styles.input, { height: Math.max(40, inputHeight) }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
          multiline
          onContentSizeChange={(event) =>
            setInputHeight(event.nativeEvent.contentSize.height)
          }
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send-sharp" size={24} color="#005246" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  message: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    maxWidth: "80%",
    marginRight: 10,
    overflow: "visible",
  },
  currentUserMessage: {
    backgroundColor: "#d1f7c4",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  otherUserMessage: {
    backgroundColor: "#ffd759",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  selectedMessage: {
    backgroundColor: "rgba(0, 128, 128, 0.5)", // Highlight color for selected messages
  },
  messageText: {
    fontSize: 16,
  },
  LikeSuperContainer: {
    marginBottom: 20,
    marginTop: -5,
  },
  likeIconContainer: {
    height: 25,
    width: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: -35,
    right: -10,
    backgroundColor: "#0a0a0a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 30,
  },
  likeIcon: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    textAlignVertical: "top",
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  sendButton: {
    height: 40,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginLeft: 10,
    borderRadius: 30,
  },
});

export default ChatScreen;
