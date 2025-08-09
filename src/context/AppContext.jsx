import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateIncidentId } from '../utils/mockData';
import { format } from 'date-fns';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false });
  
  // Initialize config state with empty arrays to prevent crashes
  const [minesConfig, setMinesConfig] = useState([]);
  const [sectionsConfig, setSectionsConfig] = useState([]);
  const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);

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
      // Use a default from the loaded config if available
      const activeMines = minesConfig.filter(m => m.isActive).map(m => m.name);
      return localStorage.getItem(`lastMine_${currentUser.uid}`) || (activeMines.length > 0 ? activeMines[0] : '');
    }
    return '';
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
            setUser({ name: userDoc.name, userId: userDoc.userId, email: userDoc.email, isAdmin: userDoc.isAdmin || false });
        } else {
            setUser({ name: currentUser.email, userId: 'N/A', email: currentUser.email, isAdmin: false });
        }
    };
    fetchUserDetails();

    let incidentsQuery;
    const incidentsCollection = collection(db, 'incidents');
    if (demoMode) {
        incidentsQuery = query(incidentsCollection, orderBy('createdAt', 'desc'));
    } else {
        incidentsQuery = query(incidentsCollection, where("isDemo", "!=", true), orderBy('createdAt', 'desc'));
    }
    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
      setLoading(false);
    }, (error) => {
        console.error("Incident listener error:", error);
        setLoading(false);
    });

    const unsubMines = onSnapshot(query(collection(db, 'config_mines'), orderBy('name')), snapshot => setMinesConfig(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubSections = onSnapshot(query(collection(db, 'config_sections'), orderBy('name')), snapshot => setSectionsConfig(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubIncidentTypes = onSnapshot(query(collection(db, 'config_incident_types'), orderBy('name')), snapshot => setIncidentTypesConfig(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));

    return () => {
      unsubscribeIncidents();
      unsubMines();
      unsubSections();
      unsubIncidentTypes();
    };
  }, [currentUser, demoMode]);
  
  const addIncident = async (incidentData) => { /* ... function code ... */ };
  const updateIncident = async (docId, updates) => { /* ... function code ... */ };
  const addComment = async (docId, commentText) => { /* ... function code ... */ };
  const submitNoAccident = async (mineName, date) => { /* ... function code ... */ };

  const value = {
    incidents, loading, addIncident, updateIncident, addComment, submitNoAccident,
    user, theme, toggleTheme, navPreference, updateNavPreference,
    updateUserLastSelectedMine, getUserLastSelectedMine,
    demoMode, setDemoMode: setDemoModeAndUpdateStorage,
    MINES: minesConfig.filter(m => m.isActive).map(m => m.name),
    SECTIONS: sectionsConfig.filter(s => s.isActive).map(s => s.name),
    INCIDENT_TYPES: incidentTypesConfig.filter(it => it.isActive).map(it => it.name),
    minesConfig, sectionsConfig, incidentTypesConfig,
    currentDate: new Date('2025-08-05T10:00:00Z'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
