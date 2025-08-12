import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, getDocs } from 'firebase/firestore';

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [minesConfig, setMinesConfig] = useState([]);
    const [sectionsConfig, setSectionsConfig] = useState([]);
    const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);
    const [homePageNotice, setHomePageNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const collectionsToFetch = [
            { name: 'config_mines', setter: setMinesConfig },
            { name: 'config_sections', setter: setSectionsConfig },
            { name: 'config_incident_types', setter: setIncidentTypesConfig },
        ];

        // 1. Perform an initial, one-time fetch to guarantee data is available.
        Promise.all(
            collectionsToFetch.map(c => getDocs(query(collection(db, c.name))))
        ).then(snapshots => {
            // 2. Use the results of the fetch to set the initial state.
            snapshots.forEach((snapshot, index) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                collectionsToFetch[index].setter(data);
            });
            // 3. ONLY NOW, after the data is loaded and set, remove the loading screen.
            setLoading(false);
        }).catch(err => {
            console.error("Critical config load failed:", err);
            setError("Failed to load essential application data. Please check your Firestore rules and collection names.");
            setLoading(false);
        });

        // 4. ALSO, set up snapshot listeners for real-time updates.
        const unsubs = collectionsToFetch.map(({ setter, name }) => {
            return onSnapshot(query(collection(db, name), orderBy('name')), snapshot => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        });
        
        const noticeDocRef = doc(db, 'config_general', 'homePageNotice');
        const unsubNotice = onSnapshot(noticeDocRef, (doc) => {
            setHomePageNotice(doc.exists() ? doc.data() : null);
        });

        return () => {
            unsubs.forEach(unsub => unsub());
            unsubNotice();
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
