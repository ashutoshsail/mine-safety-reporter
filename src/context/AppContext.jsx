import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateIncidentId } from '../utils/mockData';
import { format } from 'date-fns';
import { AuthContext } from './AuthContext';
import { ConfigContext } from './ConfigContext';

export const AppContext = createContext();

export const ACCIDENT_TYPES = ['Reportable', 'Serious Bodily', 'Fatal', 'Lost Time Injury'];

export const AppProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const { MINES } = useContext(ConfigContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');
  const [localDemoIncidents, setLocalDemoIncidents] = useState([]);

  const setDemoModeAndUpdateStorage = (isDemo) => {
    setDemoMode(isDemo);
    localStorage.setItem('demoMode', isDemo);
    if (!isDemo) {
        setLocalDemoIncidents([]); // Clear local incidents when turning off demo mode
    }
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
      return localStorage.getItem(`lastMine_${currentUser.uid}`) || (MINES.length > 0 ? MINES[0] : '');
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

    const incidentsQuery = query(collection(db, 'incidents'), where("isDemo", "!=", true), orderBy('createdAt', 'desc'));
    
    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
      setLoading(false);
    });

    return () => unsubscribeIncidents();
  }, [currentUser]);
  
  const addIncident = async (incidentData) => {
    const newIncident = {
      ...incidentData,
      reporterName: user.name,
      id: generateIncidentId(incidentData.mine, incidentData.type, new Date(incidentData.date)),
      status: 'Open',
      mandaysLost: incidentData.type.toLowerCase().includes('lost') ? 0 : null,
      comments: [],
      history: [{ user: user.name, action: 'Created Report', timestamp: new Date().toISOString() }],
      createdAt: serverTimestamp(),
      isDemo: false,
    };
    
    if (ACCIDENT_TYPES.some(accType => incidentData.type.toLowerCase().includes(accType.toLowerCase()))) {
        const dateStr = format(new Date(incidentData.date), 'yyyy-MM-dd');
        const dailySubmissionsDoc = doc(db, 'dailySubmissions', dateStr);
        await setDoc(dailySubmissionsDoc, {
            [incidentData.mine]: { status: 'Accident', submittedAt: new Date().toISOString(), submittedBy: user.name }
        }, { merge: true });
    }

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

  const addComment = async (docId, commentText, tags) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const incidentToUpdate = incidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    const newComment = { 
        user: user.name, 
        text: commentText, 
        timestamp: new Date().toISOString(), 
        tags: tags || []
    };
    const newComments = [...(incidentToUpdate.comments || []), newComment];
    const newHistory = [...incidentToUpdate.history, { user: user.name, action: 'Added a comment', timestamp: new Date().toISOString() }];
    await updateDoc(incidentDoc, { comments: newComments, history: newHistory });
  };

  const submitNoAccident = async (mineName, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', dateStr);
    await setDoc(dailySubmissionsDoc, {
        [mineName]: { status: 'No Accident', submittedAt: new Date().toISOString(), submittedBy: user.name }
    }, { merge: true });
  };

  const value = useMemo(() => ({
    incidents: demoMode ? [...incidents, ...localDemoIncidents] : incidents,
    loading, addIncident, updateIncident, addComment, submitNoAccident,
    user, theme, toggleTheme, navPreference, updateNavPreference,
    updateUserLastSelectedMine, getUserLastSelectedMine,
    demoMode, setDemoMode: setDemoModeAndUpdateStorage,
    setLocalDemoIncidents,
  }), [incidents, localDemoIncidents, loading, user, theme, navPreference, demoMode]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
