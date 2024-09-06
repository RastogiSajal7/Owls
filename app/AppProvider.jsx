import React, { createContext, useContext, useState } from 'react';
import { lightTheme, darkTheme } from './theme';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // User state
  const [user, setUser] = useState(null);

  // Contacts state
  const [contacts, setContacts] = useState([]);

  // Theme toggle function
  const toggleTheme = () => setIsDarkMode(prevMode => !prevMode);

  // Example function to set user
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, user, login, logout, contacts, setContacts }}>
      {children}
    </AppContext.Provider>
  );
};
