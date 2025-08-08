import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Import your Firebase config
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { generateIncidentId, MINES, SECTIONS, INCIDENT_TYPES } from '../utils/mockData';
import { format } from 'date-fns';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUserState] = useState({
    firstName: 'Ashutosh',
    lastName: 'Tripathi',
    fullName: 'Ashutosh Tripathi',
  });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const currentDateStr = format(new Date('2025-08-05T10:00:00Z'), 'yyyy-MM-dd');

  // --- Firestore Data Fetching ---
  useEffect(() => {
    setLoading(true);
    // Listener for Incidents
    const incidentsCollection = collection(db, 'incidents');
    const qIncidents = query(incidentsCollection, orderBy('date', 'desc'));
    const unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id,
      }));
      setIncidents(incidentsData);
      setLoading(false);
    });

    // Listener for Daily Submissions for the current day
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', currentDateStr);
    const unsubscribeSubmissions = onSnapshot(dailySubmissionsDoc, (doc) => {
        if (doc.exists()) {
            setDailySubmissions(doc.data());
        } else {
            setDailySubmissions({});
        }
    });


    // Cleanup function to stop listening when the component unmounts
    return () => {
        unsubscribeIncidents();
        unsubscribeSubmissions();
    };
  }, [currentDateStr]);


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
      createdAt: serverTimestamp(),
    };

    try {
      const incidentsCollection = collection(db, 'incidents');
      const docRef = await addDoc(incidentsCollection, newIncident);
      return { ...newIncident, docId: docRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const updateIncident = async (docId, updates) => {
    const incidentDoc = doc(db, 'incidents', docId);
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
  
  const submitNoAccident = async (mineName) => {
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', currentDateStr);
    try {
        // Using setDoc with { merge: true } will create the document if it doesn't exist,
        // or update it if it does, without overwriting the whole document.
        await setDoc(dailySubmissionsDoc, {
            [mineName]: { status: 'No Accident', submittedAt: new Date().toISOString() }
        }, { merge: true });
    } catch (error) {
        console.error("Error submitting 'No Accident' report: ", error);
    }
  };

  const value = {
    incidents,
    loading,
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
