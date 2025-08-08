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
  const [dailySubmissions, setDailySubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  // This state will now hold the user's full details
  const [user, setUser] = useState({ name: '', userId: '', email: '' });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const currentDateStr = format(new Date('2025-08-05T10:00:00Z'), 'yyyy-MM-dd');

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return; 
    }

    // Fetch the user's full name and userId from the 'users' collection
    const fetchUserDetails = async () => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", currentUser.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data();
            // Set the user state with the full name for display
            setUser({ name: userDoc.name, userId: userDoc.userId, email: userDoc.email });
        } else {
            setUser({ name: currentUser.email, userId: 'N/A', email: currentUser.email }); // Fallback
        }
    };
    fetchUserDetails();

    setLoading(true);
    const incidentsCollection = collection(db, 'incidents');
    const qIncidents = query(incidentsCollection, orderBy('date', 'desc'));
    const unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setIncidents(incidentsData);
      setLoading(false);
    });

    const dailySubmissionsDoc = doc(db, 'dailySubmissions', currentDateStr);
    const unsubscribeSubmissions = onSnapshot(dailySubmissionsDoc, (doc) => {
        setDailySubmissions(doc.exists() ? doc.data() : {});
    });

    return () => {
        unsubscribeIncidents();
        unsubscribeSubmissions();
    };
  }, [currentUser, currentDateStr]);

  const addIncident = async (incidentData) => {
    const newIncident = {
      ...incidentData,
      reporterName: user.name, // Use the user's real name
      id: generateIncidentId(incidentData.mine, incidentData.type, new Date(incidentData.date)),
      status: 'Open',
      mandaysLost: incidentData.type === 'Lost Time Injury (LTI)' ? 0 : null,
      comments: [],
      history: [
        {
          user: user.name, // Use the user's real name
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

  const addComment = async (docId, commentText) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    const newComment = {
      user: user.name, // Use the user's real name
      text: commentText,
      timestamp: new Date().toISOString(),
    };
    const newComments = [...incidentToUpdate.comments, newComment];
    const newHistory = [
      ...incidentToUpdate.history,
      {
        user: user.name, // Use the user's real name
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

  // --- Other functions (updateIncident, submitNoAccident, toggleTheme) remain the same ---
  
  const updateIncident = async (docId, updates) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    const newHistory = [
      ...incidentToUpdate.history,
      {
        user: user.name,
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
  
  const submitNoAccident = async (mineName) => {
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', currentDateStr);
    try {
        await setDoc(dailySubmissionsDoc, {
            [mineName]: { status: 'No Accident', submittedAt: new Date().toISOString() }
        }, { merge: true });
    } catch (error) {
        console.error("Error submitting 'No Accident' report: ", error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  const value = {
    incidents, loading, addIncident, updateIncident, addComment,
    dailySubmissions, submitNoAccident, user, theme, toggleTheme,
    MINES, SECTIONS, INCIDENT_TYPES,
    currentDate: new Date('2025-08-05T10:00:00Z'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
