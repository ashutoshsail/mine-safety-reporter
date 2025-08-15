import React, { createContext, useState, useEffect, useMemo } from 'react';
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
        const collectionsToWatch = [
            { setter: setMinesConfig, name: 'config_mines' },
            { setter: setSectionsConfig, name: 'config_sections' },
            { setter: setIncidentTypesConfig, name: 'config_incident_types' },
        ];

        let loadedCount = 0;
        const totalCollections = collectionsToWatch.length;

        const unsubs = collectionsToWatch.map(({ setter, name }) => {
            return onSnapshot(query(collection(db, name), orderBy('order')),
                (snapshot) => {
                    setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    loadedCount++;
                    if (loadedCount === totalCollections) {
                        setLoading(false);
                    }
                },
                (err) => {
                    console.error(`Error fetching ${name}:`, err);
                    setError(`Failed to load configuration: ${name}.`);
                    setLoading(false);
                }
            );
        });
        
        const noticeDocRef = doc(db, 'config_general', 'homePageNotice');
        const unsubNotice = onSnapshot(noticeDocRef, (doc) => {
            setHomePageNotice(doc.exists() ? doc.data() : null);
        });

        const timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
            }
        }, 15000);

        return () => {
            unsubs.forEach(unsub => unsub());
            unsubNotice();
            clearTimeout(timeoutId);
        };
    }, []);

    // CRITICAL FIX: The useMemo hook must be called before any conditional returns.
    const value = useMemo(() => ({
        minesConfig,
        sectionsConfig,
        incidentTypesConfig,
        homePageNotice,
        MINES: minesConfig.filter(m => m.isActive).map(m => m.name),
        SECTIONS: sectionsConfig.filter(s => s.isActive).map(s => s.name),
        INCIDENT_TYPES: incidentTypesConfig.filter(it => it.isActive).map(it => it.name),
    }), [minesConfig, sectionsConfig, incidentTypesConfig, homePageNotice]);

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

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};
