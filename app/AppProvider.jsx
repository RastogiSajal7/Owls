import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Contacts from 'expo-contacts';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { auth, db } from '../configs/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const navigation = useNavigation();

  // State variables
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [contactLoading, setContactLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [sosContacts, setSosContacts] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Assume user is authenticated if token exists
          const currentUser = auth.currentUser;
          if (currentUser) {
            setUser(currentUser);
            setIsLoggedIn(true); // Set isLoggedIn to true
            fetchUserDetails();
            fetchContacts();
          } else {
            console.warn('No authenticated user, even with token.');
            setIsLoggedIn(false); // Set isLoggedIn to false
          }
        } else {
          setIsLoggedIn(false); // No token, user is not logged in
        }
      } catch (error) {
        console.error('Error retrieving auth token:', error);
        setIsLoggedIn(false); // Set isLoggedIn to false in case of error
      } finally {
        setIsInitializing(false); // Auth state has been checked
      }
    };

    checkAuthState();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true); // Set isLoggedIn to true
        fetchUserDetails();
        fetchContacts();
      } else {
        setUser(null);
        setIsLoggedIn(false); // Set isLoggedIn to false
        setUserDetails({});
        setContacts([]);
      }
      setIsInitializing(false); // Auth state has been checked
    });

    return () => unsubscribe();
  }, []);


  // Normalize phone number
  const normalizePhoneNumber = (number) => {
    const cleanedNumber = number.replace(/\D/g, ''); // Remove all non-numeric characters
    return cleanedNumber.slice(-10); // Return only the last 10 digits
  };

  // Fetch user details
  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    setContactLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        const filteredContacts = data
          .filter((contact) => Array.isArray(contact.phoneNumbers) && contact.phoneNumbers.length > 0)
          .map((contact) => ({
            ...contact,
            phoneNumbers: contact.phoneNumbers.map((pn) => ({
              ...pn,
              number: normalizePhoneNumber(pn.number),
            })),
          }));

        if (filteredContacts.length > 0) {
          setContacts(filteredContacts);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactLoading(false);
    }
  };

  // Add SOS contact
  const addSosContact = (contact) => {
    setSosContacts((prev) => {
      if (prev.length >= 5) return prev; // Limit to 5 contacts
      return [...prev, contact];
    });
  };

  // Reset SOS contacts
  const resetSosContact = () => {
    setSosContacts([]);
  };

  // Check if user is already logged in (using AsyncStorage)
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Assume user is authenticated if token exists
          const currentUser = auth.currentUser;
          if (currentUser) {
            setUser(currentUser);
            fetchUserDetails();
            fetchContacts();
          } else {
            console.warn('No authenticated user, even with token.');
          }
        }
      } catch (error) {
        console.error('Error retrieving auth token:', error);
      } finally {
        setIsInitializing(false); // Auth state has been checked
      }
    };

    checkAuthState();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserDetails();
        fetchContacts();
      } else {
        setUser(null);
        setUserDetails({});
        setContacts([]);
      }
      setIsInitializing(false); // Auth state has been checked
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (userCredential) => {
    const user = userCredential.user;
    setUser(user);

    // Store token in AsyncStorage
    try {
      await AsyncStorage.setItem('authToken', user.uid);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }

    await fetchUserDetails();
    await fetchContacts();
  };

  // Logout function
  const logout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('authToken'); // Remove token on logout
      setUser(null);
      setUserDetails({});
      setContacts([]);
      resetSosContact();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Render a loader during initialization
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        contacts,
        setContacts,
        userDetails,
        loading,
        contactLoading,
        permissionStatus,
        sosContacts,
        addSosContact,
        resetSosContact,
        isLoggedIn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;