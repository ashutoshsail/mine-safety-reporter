import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Import your Firebase config
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { generateIncidentId, MINES, SECTIONS, INCIDENT_TYPES } from '../utils/mockData';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Daily submissions and user can remain as local state for now
  const [dailySubmissions, setDailySubmissions] = useState({});
  const [user, setUserState] = useState({
    firstName: 'Ashutosh',
    lastName: 'Tripathi',
    fullName: 'Ashutosh Tripathi',
  });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // --- Firestore Data Fetching ---
  useEffect(() => {
    setLoading(true);
    const incidentsCollection = collection(db, 'incidents');
    const q = query(incidentsCollection, orderBy('date', 'desc')); // Order by date descending

    // onSnapshot listens for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        // Firestore timestamps need to be converted to JS dates if needed,
        // but for this app, we store dates as strings which is simpler.
        docId: doc.id, // Keep the document ID for updates
      }));
      setIncidents(incidentsData);
      setLoading(false);
    });

    // Cleanup function to stop listening when the component unmounts
    return () => unsubscribe();
  }, []);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const setUser = (userData) => {
    setUserState({ ...user, ...userData, fullName: `${userData.firstName} ${userData.lastName}` });
  };

  // --- Firestore Data Modification ---
  const addIncident = async (incidentData) => {
    const newIncident = {
      ...incidentData,
      id: generateIncidentId(incidentData.mine, incidentData.type, new Date(incidentData.date)),
      status: 'Open',
      mandaysLost: incidentData.type === 'Lost Time Injury (LTI)' ? 0 : null,
      comments: [],
      history: [
        {
          user: user.fullName,
          action: 'Created Report',
          timestamp: new Date().toISOString(),
        },
      ],
      photos: incidentData.photos || [],
      createdAt: serverTimestamp(), // Firestore server timestamp
    };

    try {
      const incidentsCollection = collection(db, 'incidents');
      const docRef = await addDoc(incidentsCollection, newIncident);
      return { ...newIncident, docId: docRef.id }; // Return the new incident with its ID
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const updateIncident = async (docId, updates) => {
    const incidentDoc = doc(db, 'incidents', docId);
    
    // To add to the history array, we need to get the existing incident first
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;

    const newHistory = [
      ...incidentToUpdate.history,
      {
        user: user.fullName,
        action: `Updated fields: ${Object.keys(updates).join(', ')}`,
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      await updateDoc(incidentDoc, { ...updates, history: newHistory });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const addComment = async (docId, commentText) => {
    const incidentDoc = doc(db, 'incidents', docId);

    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;

    const newComment = {
      user: user.fullName,
      text: commentText,
      timestamp: new Date().toISOString(),
    };
    const newComments = [...incidentToUpdate.comments, newComment];
    const newHistory = [
      ...incidentToUpdate.history,
      {
        user: user.fullName,
        action: 'Added a comment',
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      await updateDoc(incidentDoc, { comments: newComments, history: newHistory });
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };
  
  const submitNoAccident = (mineName) => {
    setDailySubmissions(prev => ({
        ...prev,
        [mineName]: { status: 'No Accident', submittedAt: new Date('2025-08-05') }
    }));
  };

  const value = {
    incidents,
    loading, // Pass loading state to the app
    addIncident,
    updateIncident,
    addComment,
    dailySubmissions,
    submitNoAccident,
    user,
    setUser,
    theme,
    toggleTheme,
    MINES,
    SECTIONS,
    INCIDENT_TYPES,
    currentDate: new Date('2025-08-05T10:00:00Z'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
