import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Create the context with a safe default value
export const ConfigContext = createContext({
    loading: true,
    error: null,
    minesConfig: [],
    sectionsConfig: [],
    incidentTypesConfig: [],
    MINES: [],
    SECTIONS: [],
    INCIDENT_TYPES: [],
});

export const ConfigProvider = ({ children }) => {
    const [minesConfig, setMinesConfig] = useState([]);
    const [sectionsConfig, setSectionsConfig] = useState([]);
    const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);
    const [loadingStates, setLoadingStates] = useState({
        mines: true,
        sections: true,
        incidentTypes: true,
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const collections = [
            { name: 'mines', setter: setMinesConfig, collectionName: 'config_mines' },
            { name: 'sections', setter: setSectionsConfig, collectionName: 'config_sections' },
            { name: 'incidentTypes', setter: setIncidentTypesConfig, collectionName: 'config_incident_types' },
        ];

        const unsubs = collections.map(({ name, setter, collectionName }) => {
            return onSnapshot(
                query(collection(db, collectionName), orderBy('name')),
                (snapshot) => {
                    setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    setLoadingStates(prev => ({ ...prev, [name]: false }));
                },
                (err) => {
                    console.error(`Error fetching ${collectionName}:`, err);
                    setError(`Failed to load ${collectionName}. Please check your connection and Firestore rules.`);
                    setLoadingStates(prev => ({ ...prev, [name]: false }));
                }
            );
        });
        
        // Timeout to prevent infinite loading screen
        const timeoutId = setTimeout(() => {
            if (loadingStates.mines || loadingStates.sections || loadingStates.incidentTypes) {
                setError("Failed to load configuration data in time. Please check your network connection.");
            }
        }, 10000); // 10 seconds

        return () => {
            unsubs.forEach(unsub => unsub());
            clearTimeout(timeoutId);
        };
    }, []);

    const isLoading = Object.values(loadingStates).some(state => state === true);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
                <p className="text-lg animate-pulse">Loading Configuration...</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
                <div className="text-center p-4">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
                    <p className="text-light-subtle-text dark:text-dark-subtle-text">{error}</p>
                </div>
            </div>
        )
    }

    const value = {
        loading: isLoading,
        error,
        minesConfig,
        sectionsConfig,
        incidentTypesConfig,
        MINES: minesConfig.filter(m => m.isActive).map(m => m.name),
        SECTIONS: sectionsConfig.filter(s => s.isActive).map(s => s.name),
        INCIDENT_TYPES: incidentTypesConfig.filter(it => it.isActive).map(it => it.name),
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};
