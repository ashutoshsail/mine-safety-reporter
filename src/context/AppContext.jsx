import React, { createContext, useState, useEffect } from 'react';
import { mockIncidents, generateIncidentId, MINES, SECTIONS, INCIDENT_TYPES } from '../utils/mockData';
import { format } from 'date-fns';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [dailySubmissions, setDailySubmissions] = useState(() => {
     // Initialize submissions with some random data for today
     const today = new Date('2025-08-05');
     const initialSubmissions = {};
     MINES.forEach(mine => {
         const rand = Math.random();
         if (rand < 0.7) { // 70% submitted 'No Accident'
             initialSubmissions[mine] = { status: 'No Accident', submittedAt: today };
         } else if (rand < 0.8) { // 10% have an LTI
            // This part is tricky as we need to ensure an LTI exists for this mine today
            // For simplicity, we'll just mark it and assume data consistency
            initialSubmissions[mine] = { status: 'Accident', submittedAt: today };
         }
         // The rest are 'No Submission' by default
     });
     return initialSubmissions;
  });
  
  const [user, setUserState] = useState({
    firstName: 'Ashutosh',
    lastName: 'Tripathi',
    fullName: 'Ashutosh Tripathi',
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setUser = (userData) => {
    setUserState({ ...user, ...userData, fullName: `${userData.firstName} ${userData.lastName}` });
  };

  const addIncident = (incidentData) => {
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
    };
    setIncidents(prev => [newIncident, ...prev]);
    return newIncident;
  };

  const updateIncident = (incidentId, updates) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          const newHistory = [
            ...inc.history,
            {
              user: user.fullName,
              action: `Updated fields: ${Object.keys(updates).join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          ];
          return { ...inc, ...updates, history: newHistory };
        }
        return inc;
      })
    );
  };

  const addComment = (incidentId, commentText) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          const newComment = {
            user: user.fullName,
            text: commentText,
            timestamp: new Date().toISOString(),
          };
          const newHistory = [
            ...inc.history,
            {
              user: user.fullName,
              action: 'Added a comment',
              timestamp: new Date().toISOString(),
            },
          ];
          return { ...inc, comments: [...inc.comments, newComment], history: newHistory };
        }
        return inc;
      })
    );
  };
  
  const submitNoAccident = (mineName) => {
    setDailySubmissions(prev => ({
        ...prev,
        [mineName]: { status: 'No Accident', submittedAt: new Date('2025-08-05') }
    }));
  };

  const value = {
    incidents,
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
    // Add a fixed date for consistency across the app
    currentDate: new Date('2025-08-05T10:00:00Z'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
