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
              isAdmin: userDoc.isAdmin || false
            });
        } else {
            setUser({ name: currentUser.email, userId: 'N/A', email: currentUser.email, isAdmin: false });
        }
    };
    fetchUserDetails();

    setLoading(true);
    // The query now depends on whether demo mode is active
    let incidentsQuery;
    const incidentsCollection = collection(db, 'incidents');
    if (demoMode) {
        // In demo mode, show all incidents
        incidentsQuery = query(incidentsCollection, orderBy('createdAt', 'desc'));
    } else {
        // Outside demo mode, show only real incidents (those without isDemo: true)
        incidentsQuery = query(incidentsCollection, where("isDemo", "!=", true), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setIncidents(incidentsData);
      setLoading(false);
    });

    return () => unsubscribeIncidents();
  }, [currentUser, demoMode]); // Re-run when demoMode changes

  const submitNoAccident = async (mineName, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', dateStr);
    try {
        await setDoc(dailySubmissionsDoc, {
            [mineName]: { 
              status: 'No Accident', 
              submittedAt: new Date().toISOString(), 
              submittedBy: user.name
            }
        }, { merge: true });
    } catch (error) {
        console.error("Error submitting 'No Accident' report: ", error);
    }
  };
  
  const addIncident = async (incidentData) => {
    const newIncident = {
      ...incidentData,
      reporterName: user.name,
      id: generateIncidentId(incidentData.mine, incidentData.type, new Date(incidentData.date)),
      status: 'Open',
      mandaysLost: incidentData.type === 'Lost Time Injury (LTI)' ? 0 : null,
      comments: [],
      history: [{ user: user.name, action: 'Created Report', timestamp: new Date().toISOString() }],
      createdAt: serverTimestamp(),
      isDemo: false, // Real incidents are never demo incidents
    };
    const incidentsCollection = collection(db, 'incidents');
    const docRef = await addDoc(incidentsCollection, newIncident);
    return { ...newIncident, docId: docRef.id };
  };
  
  const updateIncident = async (docId, updates) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    const newHistory = [...incidentToUpdate.history, { user: user.name, action: `Updated fields: ${Object.keys(updates).join(', ')}`, timestamp: new Date().toISOString() }];
    await updateDoc(incidentDoc, { ...updates, history: newHistory });
  };

  const addComment = async (docId, commentText) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    const newComment = { user: user.name, text: commentText, timestamp: new Date().toISOString() };
    const newComments = [...incidentToUpdate.comments, newComment];
    const newHistory = [...incidentToUpdate.history, { user: user.name, action: 'Added a comment', timestamp: new Date().toISOString() }];
    await updateDoc(incidentDoc, { comments: newComments, history: newHistory });
  };
  
  const value = {
    incidents,
    loading,
    addIncident,
    updateIncident,
    addComment,
    submitNoAccident,
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
