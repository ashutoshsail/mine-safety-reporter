import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateIncidentId } from '../utils/mockData'; // We still need the ID generator
import { format } from 'date-fns';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false });
  
  // State for dynamic configuration
  const [mines, setMines] = useState([]);
  const [sections, setSections] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');

  const setDemoModeAndUpdateStorage = (isDemo) => {
    setDemoMode(isDemo);
    localStorage.setItem('demoMode', isDemo);
  };

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; 
    }

    // Fetch user details (unchanged)
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

    // Fetch incidents based on demo mode (unchanged)
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
    });

    // NEW: Fetch dynamic configuration from Firestore
    const unsubMines = onSnapshot(collection(db, 'config_mines'), snapshot => setMines(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubSections = onSnapshot(collection(db, 'config_sections'), snapshot => setSections(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubIncidentTypes = onSnapshot(collection(db, 'config_incident_types'), snapshot => setIncidentTypes(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));

    return () => {
      unsubscribeIncidents();
      unsubMines();
      unsubSections();
      unsubIncidentTypes();
    };
  }, [currentUser, demoMode]);

  // All other functions (addIncident, etc.) remain the same but will use the dynamic lists
  
  const value = {
    // ... (rest of the values)
    MINES: mines.filter(m => m.isActive).map(m => m.name),
    SECTIONS: sections.filter(s => s.isActive).map(s => s.name),
    INCIDENT_TYPES: incidentTypes.filter(it => it.isActive).map(it => it.name),
    // Pass the full config objects for the admin panel
    minesConfig: mines,
    sectionsConfig: sections,
    incidentTypesConfig: incidentTypes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
