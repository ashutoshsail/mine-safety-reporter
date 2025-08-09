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
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');

  const setDemoModeAndUpdateStorage = (isDemo) => {
    setDemoMode(isDemo);
    localStorage.setItem('demoMode', isDemo);
  };

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

  const updateUserLastSelectedMine = (mineName) => {
    if(currentUser) {
      localStorage.setItem(`lastMine_${currentUser.uid}`, mineName);
    }
  };

  const getUserLastSelectedMine = () => {
    if(currentUser) {
      return localStorage.getItem(`lastMine_${currentUser.uid}`) || MINES[0];
    }
    return MINES[0];
  };


  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; 
    }

    const fetchUserDetails = async () => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", currentUser.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data();
            setUser({ 
              name: userDoc.name, 
              userId: userDoc.userId, 
              email: userDoc.email,
              isAdmin: userDoc.isAdmin || false // Correctly read the isAdmin flag
            });
        } else {
            setUser({ name: currentUser.email, userId: 'N/A', email: currentUser.email, isAdmin: false });
        }
    };
    fetchUserDetails();

    setLoading(true);
    let incidentsQuery;
    const incidentsCollection = collection(db, 'incidents');
    if (demoMode) {
        incidentsQuery = query(incidentsCollection, orderBy('createdAt', 'desc'));
    } else {
        incidentsQuery = query(incidentsCollection, where("isDemo", "!=", true), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setIncidents(incidentsData);
      setLoading(false);
    });

    return () => unsubscribeIncidents();
  }, [currentUser, demoMode]);

  // ... (All other functions remain the same)
  
  const value = {
    incidents,
    loading,
    user,
    theme,
    toggleTheme,
    navPreference,
    updateNavPreference,
    updateUserLastSelectedMine,
    getUserLastSelectedMine,
    demoMode,
    setDemoMode: setDemoModeAndUpdateStorage,
    MINES,
    SECTIONS,
    INCIDENT_TYPES,
    currentDate: new Date('2025-08-05T10:00:00Z'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
