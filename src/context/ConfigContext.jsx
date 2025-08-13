import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [minesConfig, setMinesConfig] = useState([]);
    const [sectionsConfig, setSectionsConfig] = useState([]);
    const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);
    const [companyProfile, setCompanyProfile] = useState({ logoUrl: '' }); // <-- Add state for logo
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
            return onSnapshot(query(collection(db, name), orderBy('name')),
                (snapshot) => {
                    if (!snapshot.metadata.hasPendingWrites) {
                        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                        loadedCount++;
                        if (loadedCount === totalCollections) {
                            setLoading(false);
                        }
                    }
                },
                (err) => {
                    console.error(`Error fetching ${name}:`, err);
                    setError(`Failed to load configuration: ${name}.`);
                    setLoading(false);
                }
            );
        });
        
        // Listener for the company profile (which includes the logo)
        const profileDocRef = doc(db, 'config_general', 'companyProfile');
        const unsubProfile = onSnapshot(profileDocRef, (doc) => {
            setCompanyProfile(doc.exists() ? doc.data() : { logoUrl: '' });
        });

        const timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
            }
        }, 10000);

        return () => {
            unsubs.forEach(unsub => unsub());
            unsubProfile();
            clearTimeout(timeoutId);
        };
    }, []);


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
        companyProfile, // <-- Provide company profile
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
