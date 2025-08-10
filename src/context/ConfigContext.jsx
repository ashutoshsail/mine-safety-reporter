import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [minesConfig, setMinesConfig] = useState([]);
    const [sectionsConfig, setSectionsConfig] = useState([]);
    const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);
    const [homePageNotice, setHomePageNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const collections = [
            { setter: setMinesConfig, name: 'config_mines' },
            { setter: setSectionsConfig, name: 'config_sections' },
            { setter: setIncidentTypesConfig, name: 'config_incident_types' },
        ];

        const unsubs = collections.map(({ setter, name }) => {
            return onSnapshot(query(collection(db, name), orderBy('name')),
                (snapshot) => {
                    setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                },
                (err) => {
                    console.error(`Error fetching ${name}:`, err);
                    setError(`Failed to load configuration: ${name}. Please check Firestore rules and indexes.`);
                }
            );
        });

        const noticeDocRef = doc(db, 'config_general', 'homePageNotice');
        const unsubNotice = onSnapshot(noticeDocRef, (doc) => {
            setHomePageNotice(doc.exists() ? doc.data() : null);
        });
        
        // This check is more robust. It waits for all three configs to have at least one item,
        // or times out if the collections are empty or there's an issue.
        const timer = setTimeout(() => {
            if (loading) {
                 setLoading(false); // Stop loading even if collections are empty.
            }
        }, 5000); // 5 seconds should be enough

        return () => {
            unsubs.forEach(unsub => unsub());
            unsubNotice();
            clearTimeout(timer);
        };
    }, [loading]); // Rerun effect if loading state changes

    useEffect(() => {
        if (minesConfig.length > 0 && sectionsConfig.length > 0 && incidentTypesConfig.length > 0) {
            setLoading(false);
        }
    }, [minesConfig, sectionsConfig, incidentTypesConfig]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
                <p className="text-lg animate-pulse">Loading Application Configuration...</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
                <div className="text-center p-4">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h2>
                    <p className="text-light-subtle-text dark:text-dark-subtle-text">{error}</p>
                </div>
            </div>
        )
    }

    const value = {
        minesConfig,
        sectionsConfig,
        incidentTypesConfig,
        homePageNotice,
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
