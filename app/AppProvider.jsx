import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts'; // Import contacts from Expo
import { auth } from '../configs/FirebaseConfig'; // Firebase authentication instance
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../configs/FirebaseConfig'; // Firebase Firestore instance
import { onAuthStateChanged } from 'firebase/auth'; // Firebase Auth state change listener
import { useNavigation } from '@react-navigation/native';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const navigation = useNavigation();

  // User state
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactLoading, setContactLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Function to normalize phone numbers
  const normalizePhoneNumber = (number) => {
    const cleanedNumber = number.replace(/\D/g, '');  // Remove all non-numeric characters
    return cleanedNumber.slice(-10);  // Return only the last 10 digits
  };

  // Fetch user details function
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

  // Fetch contacts function
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
              number: normalizePhoneNumber(pn.number),  // Normalize phone number
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

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in, set the user and fetch user details
        setUser(currentUser);
        fetchUserDetails(); // Fetch user details after login
        fetchContacts(); // Fetch contacts after login
      } else {
        // No user is signed in, clear the user, user details, and contacts
        setUser(null);
        setUserDetails({});
        setContacts([]);
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Sign in function
  const login = async (userCredential) => {
    const user = userCredential.user;
    setUser(user);
    await fetchUserDetails(); // Fetch user details after setting the user
    await fetchContacts(); // Fetch contacts after setting the user
  };

  // Sign out function
  const logout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      setUser(null);
      setUserDetails({}); // Clear user details on logout
      setContacts([]); // Clear contacts on logout
      navigation.navigate('Home'); // Navigate to Home screen
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppContext.Provider value={{ user, login, logout, contacts, setContacts, userDetails, loading, contactLoading, permissionStatus }}>
      {children}
    </AppContext.Provider>
  );
};
