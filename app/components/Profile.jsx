import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { db } from "../../configs/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import LoadingIndicator from '../components/LoadingIndicator';

export default function Profile({ username }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser; // Get current user
        if (user) {
          const userDocRef = doc(db, "users", user.uid); // Use UID
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setEmail(userData.email || "");
            setPhoneNumber(userData.phoneNumber || "");
            setAddress(userData.address || "");
            setPassword(userData.password || "");
          }
        } else {
          console.error("No user is signed in.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <LoadingIndicator/>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require("../../assets/images/profilePic.jpg")}
            style={styles.profileImage}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{username || "User Name"}</Text>
          <Text style={styles.profileQuote}>
            {"A great chat application isn't just about sending messages; it's about creating seamless connections, fostering conversations, and making every user feel heard."}
          </Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>📞</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTextQ}>Phone Number </Text>
            <Text style={styles.menuText}>{phoneNumber}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>📧</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTextQ}>Email </Text>
            <Text style={styles.menuText}>{email}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Notifications")}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>🔔</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTextQ}>Notifications </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>🔑</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTextQ}>Password </Text>
            <Text style={styles.menuText}>{'*'.repeat(password.length)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>💬</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTextQ}>Language </Text>
            <Text style={styles.menuText}>English</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginRight: 15,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  profileQuote: {
    fontSize: 14,
    color: "#555",
  },
  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ffd759",
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "flex-start",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuIconText: {
    fontSize: 18,
    color: "#555",
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  menuTextQ: {
    fontSize: 16,
    color: "green",
  },
});
