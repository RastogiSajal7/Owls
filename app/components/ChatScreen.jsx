import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Linking
} from "react-native";
import { Image } from "expo-image";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as Font from 'expo-font';


const ChatScreen = ({ route, navigation }) => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'MyCustomFont': require('../../assets/fonts/JotiOne-Regular.ttf'),
      });
      setFontLoaded(true);
    };
    loadFonts();
  }, []);

  const { chatId, participantName, participantProfilePic } = route.params;
  const currentUserId = auth.currentUser.uid;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [lastTap, setLastTap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(40);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // State for keyboard height

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0); // Reset keyboard height when keyboard is dismissed
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLinkPress = (url) => {
    Linking.openURL(url);  // Opens the URL in a web browser
  };
  const parseText = (text) => {
    // Use a regular expression to find URLs and make them clickable
    const regex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={() => handleLinkPress(part)}
          >
            {part}
          </Text>
        );
      }
      return part; // Regular text
    });
  };

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
    setSelectedMessages((prevSelected) =>
      prevSelected.includes(messageId)
        ? prevSelected.filter((id) => id !== messageId)
        : [...prevSelected, messageId]
    );
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
      setSelectedMessages([]);
    } catch (error) {
      console.error("Error deleting messages:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000); // Firebase timestamps are in seconds
    return date.toLocaleString(); // Or use custom formatting
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
            isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
            isSelected && styles.selectedMessage,
          ]}
        >
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
          <Text style={styles.messageText} selectable>
            {parseText(item.text)}
          </Text>
          {likedByCurrentUser && (
            <View style={styles.LikeSuperContainer}>
              <View style={styles.likeIconContainer}>
                <Text style={styles.likeIcon}>❤️</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20} 
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
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

          <View
            style={[
              styles.inputContainer,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight / 5 : 10 },
            ]}
          >
            <TextInput
              style={[styles.input, { height: Math.max(40, inputHeight) }]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message😊"
              multiline
              onContentSizeChange={(event) =>
                setInputHeight(event.nativeEvent.contentSize.height)
              }
            />
            <TouchableOpacity style={styles.sendSuperContainer} onPress={handleSend}>
              <View style={styles.sendButton} >
              <Ionicons name="send-sharp" size={24} color="#ccc" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
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
    fontFamily: "MyCustomFont",
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
    borderRadius: 10,
    borderTopRightRadius: 0,
    padding: 10,
    marginBottom: 10,
    maxWidth: "80%",
    marginRight: 10,
    overflow: "visible",
    transform: [{ skewY: "-5deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    fontFamily: "MyCustomFont",
  },
  otherUserMessage: {
    backgroundColor: "#ffd759",
    alignSelf: "flex-start",
    borderRadius: 10,
    borderTopLeftRadius: 0,
    padding: 10,
    marginBottom: 10,
    maxWidth: "80%",
    marginLeft: 10,
    overflow: "visible",
    transform: [{ skewY: "5deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    fontFamily: "MyCustomFont",
  },
  messageText: {
    fontSize: 16,
    transform: [{ skewY: "0deg" }],
    fontFamily: "MyCustomFont",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5, // space between timestamp and message
  },
  selectedMessage: {
    backgroundColor: "rgba(0, 128, 128, 0.5)",
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
    borderColor: "#005246",
    borderWidth: 3,
    borderRadius: 20,
    paddingHorizontal: 10,
    textAlignVertical: "top",
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#f5f5f5",
    fontFamily: "MyCustomFont",
  },
  sendSuperContainer: {
    backgroundColor: '#005246',
    margin: 5,
    padding: 5,
    borderColor: "#ccc",
    borderWidth: 3,
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 10,
  },
  link: {
    color: '#005246',
    textDecorationLine: 'underline',
  }
});

export default ChatScreen;