import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs } from 'firebase/firestore';
import { generateMockData, generateIncidentId } from '../utils/mockData';
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
  const [user, setUser] = useState({ name: '', userId: '', email: '', isAdmin: false });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');
  const [localDemoIncidents, setLocalDemoIncidents] = useState([]);
  const [localDemoHoursWorked, setLocalDemoHoursWorked] = useState({});

  const setDemoModeAndUpdateStorage = (isDemo) => {
    setDemoMode(isDemo);
    localStorage.setItem('demoMode', isDemo);
    if (isDemo) {
      if (MINES.length > 0 && SECTIONS.length > 0 && INCIDENT_TYPES.length > 0) {
        const liveConfigs = { mines: MINES, sections: SECTIONS, incidentTypes: INCIDENT_TYPES };
        const { incidents: demoIncidents, hoursWorked: demoHours } = generateMockData(liveConfigs);
        setLocalDemoIncidents(demoIncidents);
        setLocalDemoHoursWorked(demoHours);
      }
    } else {
      setLocalDemoIncidents([]);
      setLocalDemoHoursWorked({});
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

    const incidentsQuery = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    
    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      setIncidents(prevIncidents => {
        let newIncidents = [...prevIncidents];
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), docId: change.doc.id };
          if (change.type === "added") {
            if (!newIncidents.some(inc => inc.docId === data.docId)) {
                newIncidents.push(data);
            }
          }
          if (change.type === "modified") {
            const index = newIncidents.findIndex(inc => inc.docId === data.docId);
            if (index > -1) {
              newIncidents[index] = data;
            }
          }
          if (change.type === "removed") {
            newIncidents = newIncidents.filter(inc => inc.docId !== data.docId);
          }
        });
        
        newIncidents.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || Date.now();
            const timeB = b.createdAt?.toMillis() || Date.now();
            return timeB - timeA;
        });
        return newIncidents;
      });
      setLoading(false);
    });

    const usersQuery = query(collection(db, 'users'), orderBy('name'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubscribeIncidents();
        unsubscribeUsers();
    };
  }, [currentUser]);
  
  const addIncident = async (incidentData) => {
    const newIncident = {
      ...incidentData,
      reporterName: user.name,
      id: generateIncidentId(incidentData.mine, incidentData.type, new Date(incidentData.date)),
      status: 'Open',
      daysLost: 0,
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
    try {
        const docRef = await addDoc(incidentsCollection, newIncident);
        return { ...newIncident, docId: docRef.id };
    } catch (error) {
        console.error("Error adding incident: ", error);
        return null;
    }
  };

  const updateIncident = async (docId, updates, action) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const allIncidents = [...incidents, ...localDemoIncidents];
    const incidentToUpdate = allIncidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;
    
    const actionMessage = action || `Updated fields: ${Object.keys(updates).join(', ')}`;
    const newHistory = [...(incidentToUpdate.history || []), { user: user.name, action: actionMessage, timestamp: new Date().toISOString() }];
    await updateDoc(incidentDoc, { ...updates, history: newHistory });
  };

  const addComment = async (docId, commentText, tags) => {
    const incidentDoc = doc(db, 'incidents', docId);
    const allIncidents = [...incidents, ...localDemoIncidents];
    const incidentToUpdate = allIncidents.find(inc => inc.docId === docId);
    if (!incidentToUpdate) return;

    const newComment = { 
        user: user.name, 
        text: commentText, 
        timestamp: new Date().toISOString(), 
        tags: tags || [],
    };
    const newComments = [...(incidentToUpdate.comments || []), newComment];
    
    const updates = { comments: newComments };
    let historyMessage = 'Added a comment';

    const statusTag = tags.find(tag => tag.startsWith("Mark as"));
    if (statusTag) {
        const newStatus = incidentToUpdate.status === 'Open' ? 'Closed' : 'Open';
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
    ACCIDENT_TYPES, // MODIFIED: This line has been added to correctly export the variable.
  }), [incidents, localDemoIncidents, localDemoHoursWorked, allUsers, loading, user, theme, navPreference, demoMode]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};