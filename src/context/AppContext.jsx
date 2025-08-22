import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateMockData, generateIncidentId, generateSingleMockIncident } from '../utils/mockData';
import { format } from 'date-fns';
import { AuthContext } from './AuthContext';
import { ConfigContext } from './ConfigContext';

export const AppContext = createContext();

export const ACCIDENT_TYPES = ['Reportable', 'Serious Bodily', 'Fatal', 'Lost Time Injury'];

export const AppProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const { MINES, SECTIONS, INCIDENT_TYPES } = useContext(ConfigContext);
  const [incidents, setIncidents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false, uid: null });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');
  const [localDemoIncidents, setLocalDemoIncidents] = useState([]);
  const [localDemoHoursWorked, setLocalDemoHoursWorked] = useState({});
  const [userLastSelectedMine, setUserLastSelectedMine] = useState(localStorage.getItem('userLastSelectedMine') || '');
  const [mockIncidentForForm, setMockIncidentForForm] = useState(null);

  const currentDate = useMemo(() => new Date(), []);

  // Effect for Demo Mode and Mock Data Generation
  useEffect(() => {
    if (demoMode && MINES.length > 0 && INCIDENT_TYPES.length > 0) {
      console.log("[STATUS_CODE: A1] AppContext: Generating mock data for demo mode...");
      const { incidents: demoIncidents, hoursWorked: demoHours } = generateMockData({ mines: MINES, sections: SECTIONS, incidentTypes: INCIDENT_TYPES });
      setLocalDemoIncidents(demoIncidents);
      setLocalDemoHoursWorked(demoHours);
    } else if (!demoMode) {
      setLocalDemoIncidents([]);
      setLocalDemoHoursWorked({});
    }
  }, [demoMode, MINES, SECTIONS, INCIDENT_TYPES]);
  
  // Master Effect for Firestore Subscriptions
  useEffect(() => {
    console.log(`[STATUS_CODE: A2] AppContext: Auth state changed. currentUser: ${currentUser ? currentUser.uid : 'null'}`);
    
    if (currentUser === undefined) return;

    let unsubIncidents = () => {};
    let unsubUsers = () => {};

    if (currentUser) {
        if (!demoMode) {
            unsubIncidents = onSnapshot(query(collection(db, 'incidents')), (snapshot) => {
                const fetchedIncidents = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
                setIncidents(fetchedIncidents);
            });
        }
        
        console.log("[STATUS_CODE: A3] AppContext: Fetching users from Firestore...");
        unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            setAllUsers(fetchedUsers);
            console.log(`[STATUS_CODE: A4] AppContext: Fetched users from Firestore. Count: ${fetchedUsers.length}. UIDs: ${fetchedUsers.map(u => u.uid).join(', ')}`);
        });

    } else {
        console.log("[STATUS_CODE: A5] AppContext: No currentUser. Setting to Guest User.");
        setIncidents([]);
        setAllUsers([]);
        setUser({ name: 'Guest User', uid: 'anonymous', isAdmin: false });
        setLoading(false);
    }

    return () => {
      unsubIncidents();
      unsubUsers();
    };
  }, [currentUser, demoMode]);

  // Secondary effect to set user after allUsers and currentUser are available
  useEffect(() => {
    if (currentUser && allUsers.length > 0) {
        console.log(`[STATUS_CODE: A6] AppContext: Matching currentUser UID (${currentUser.uid}) with user list...`);
        const appUser = allUsers.find(u => u.uid === currentUser.uid);
        if (appUser) {
            console.log(`[STATUS_CODE: A7] AppContext: User profile found! Name: ${appUser.name}`);
            setUser({ name: appUser.name, userId: appUser.userId, email: appUser.email, isAdmin: appUser.isAdmin, uid: appUser.uid });
        } else {
            console.log(`[STATUS_CODE: A8] AppContext: User profile NOT found for UID: ${currentUser.uid}`);
            setUser({ name: 'User Not Found', uid: currentUser.uid, isAdmin: false });
        }
        console.log("[STATUS_CODE: A9] AppContext: App is ready. Loading set to false.");
        setLoading(false);
    } else if (currentUser === null) {
        console.log("[STATUS_CODE: A10] AppContext: Not logged in. Setting to Guest User and ready.");
        setUser({ name: 'Guest User', uid: 'anonymous', isAdmin: false });
        setLoading(false);
    }
  }, [currentUser, allUsers]);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updateNavPreference = (newPref) => {
    setNavPreference(newPref);
    localStorage.setItem('navPreference', newPref);
  };
  
  const updateUserLastSelectedMine = (mineName) => {
    setUserLastSelectedMine(mineName);
    localStorage.setItem('userLastSelectedMine', mineName);
  };

  const getUserLastSelectedMine = () => {
    return userLastSelectedMine;
  };

  const addIncident = async (formData) => {
    try {
      const incidentId = generateIncidentId(formData.mine, formData.type, new Date());
      const newIncidentRef = await addDoc(collection(db, 'incidents'), {
        ...formData,
        id: incidentId,
        createdAt: serverTimestamp(),
        status: 'Open',
        history: [{
            user: user.name,
            action: `Incident created with type: ${formData.type}`,
            timestamp: new Date().toISOString()
        }],
      });
      console.log("Document written with ID: ", newIncidentRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const updateIncident = async (docId, updates) => {
    try {
        const incidentToUpdate = incidents.find(inc => inc.docId === docId);
        if (!incidentToUpdate) return;
        
        const incidentDoc = doc(db, 'incidents', docId);
        let historyMessage = '';
        
        if (updates.daysLost !== undefined && updates.daysLost !== incidentToUpdate.daysLost) {
            historyMessage = `Updated Days Lost from ${incidentToUpdate.daysLost || 0} to ${updates.daysLost}`;
            const newHistory = [...(incidentToUpdate.history || []), { user: user.name, action: historyMessage, timestamp: new Date().toISOString() }];
            await updateDoc(incidentDoc, { ...updates, history: newHistory });
            return;
        }

        if (updates.status && updates.status !== incidentToUpdate.status) {
            historyMessage = `Changed status from ${incidentToUpdate.status} to ${updates.status}`;
            const newHistory = [...(incidentToUpdate.history || []), { user: user.name, action: historyMessage, timestamp: new Date().toISOString() }];
            await updateDoc(incidentDoc, { ...updates, history: newHistory });
            return;
        }

    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };
  
  const addComment = async (docId, commentText, selectedTags) => {
      const incidentToUpdate = incidents.find(inc => inc.docId === docId);
      if (!incidentToUpdate) return;
      
      const incidentDoc = doc(db, 'incidents', docId);
      const newComment = {
          user: user.name,
          text: commentText,
          timestamp: new Date().toISOString(),
          tags: selectedTags,
      };
      
      const newComments = [...(incidentToUpdate.comments || []), newComment];
      
      let updates = { comments: newComments };
      let historyMessage = `Added a comment: "${commentText}"`;
      
      const newStatusTag = selectedTags.find(tag => tag.includes('Mark as'));
      if (newStatusTag) {
          const newStatus = newStatusTag.split(' ').pop();
          updates.status = newStatus;
          historyMessage = `Added a comment and changed status to ${newStatus}`;
      }

      const newHistory = [...(incidentToUpdate.history || []), { user: user.name, action: historyMessage, timestamp: new Date().toISOString() }];
      updates.history = newHistory;

      await updateDoc(incidentDoc, updates);
  };

  const submitNoAccident = async (mineName, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dailySubmissionsDoc = doc(db, 'dailySubmissions', dateStr);
    await setDoc(dailySubmissionsDoc, {
        [mineName]: { status: 'No Accident', submittedAt: new Date().toISOString(), submittedBy: user.name }
    }, { merge: true });
  };

  const setDemoModeAndUpdateStorage = (newMode) => {
    setDemoMode(newMode);
    localStorage.setItem('demoMode', newMode);
  };

  const loadMockIncidentForForm = () => {
    if (MINES && SECTIONS && INCIDENT_TYPES) {
      setMockIncidentForForm(generateSingleMockIncident({ mines: MINES, sections: SECTIONS, incidentTypes: INCIDENT_TYPES }));
    }
  };
  
  const clearMockIncidentForForm = () => {
    setMockIncidentForForm(null);
  };

  const value = useMemo(() => ({
    incidents: demoMode ? [...localDemoIncidents, ...incidents] : incidents,
    hoursWorked: demoMode ? localDemoHoursWorked : {},
    allUsers,
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
    ACCIDENT_TYPES,
    currentDate,
    mockIncidentForForm,
    loadMockIncidentForForm,
    clearMockIncidentForForm,
  }), [incidents, localDemoIncidents, localDemoHoursWorked, allUsers, loading, user, theme, navPreference, userLastSelectedMine, demoMode, currentDate, mockIncidentForForm]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
