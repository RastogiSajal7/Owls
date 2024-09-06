import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../../configs/FirebaseConfig';
import {doc, setDoc, getDoc} from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import LoadingIndicator from './LoadingIndicator';

export default function Index() {
  const [isSignUp, setIsSignUp] = useState(false);

  return isSignUp ? (
    <SignUp onToggle={() => setIsSignUp(false)} />
  ) : (
    <SignIn onToggle={() => setIsSignUp(true)} />
  );
}


// signIn code
function SignIn({ onToggle }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both fields");
      return;
    }
    
    setLoading(true);
  
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
  
        // Fetching user's name from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userName = userDoc.data().name;
          setUsername(userName);
          
          // Hide the loading indicator
          setLoading(false);
          
          // Alert and navigate using the fetched username
          Alert.alert("Sign-In Successful", `Welcome ${userName}`);
          navigation.navigate('MainPage', { username: userName });
        } else {
          // Handle case where user document does not exist
          setLoading(false);
          Alert.alert("Error", "User data not found");
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        setLoading(false); // Hide the loading indicator on error
        Alert.alert("Error", errorMessage);
        console.error("Error signing in:", errorCode, errorMessage);
      });
  };  

  return (
    <View style={styles.container}>
      {loading && <LoadingIndicator />}
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.toggleText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}


// signUp code
function SignUp({ onToggle }) {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      // Save additional data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        phone: phone,
        password: password,
        createdAt: new Date(),
      });
      navigation.navigate("MainPage");
      Alert.alert("Sign-Up Successful", `Welcome ${name}`);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      Alert.alert("Error", errorMessage);
      console.error("Error signing up:", errorCode, errorMessage);
    });
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
      style={styles.input}
      placeholder="Phone Number"
      value={phone}
      onChangeText={setPhone}
      keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.toggleText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 32,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#004721",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  toggleText: {
    color: "#004721",
    fontSize: 16,
  },
});