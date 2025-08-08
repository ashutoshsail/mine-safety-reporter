import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateIncidentId, MINES, SECTIONS, INCIDENT_TYPES } from '../utils/mockData';
import { format } from 'date-fns';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', userId: '', email: '' });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updateNavPreference = (preference) => {
    setNavPreference(preference);
    localStorage.setItem('navPreference', preference);
  };

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; 
    }
    // ... (rest of useEffect for fetching data remains the same)
  }, [currentUser]);

  // ... (all data functions like addIncident, addComment, etc. remain the same)

  const value = {
    // ... (other values)
    user,
    theme,
    toggleTheme,
    navPreference,
    updateNavPreference,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
