import React,
{ createContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [minesConfig, setMinesConfig] = useState([]);
    const [sectionsConfig, setSectionsConfig] = useState([]);
    const [incidentTypesConfig, setIncidentTypesConfig] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubMines = onSnapshot(query(collection(db, 'config_mines'), orderBy('name')), snapshot => {
            setMinesConfig(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubSections = onSnapshot(query(collection(db, 'config_sections'), orderBy('name')), snapshot => {
            setSectionsConfig(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubIncidentTypes = onSnapshot(query(collection(db, 'config_incident_types'), orderBy('name')), snapshot => {
            setIncidentTypesConfig(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false); // Set loading to false after the last config item is fetched
        });

        return () => {
            unsubMines();
            unsubSections();
            unsubIncidentTypes();
        };
    }, []);

    const value = {
        loading,
        minesConfig,
        sectionsConfig,
        incidentTypesConfig,
        // Provide simple, filtered arrays for dropdowns
        MINES: minesConfig.filter(m => m.isActive).map(m => m.name),
        SECTIONS: sectionsConfig.filter(s => s.isActive).map(s => s.name),
        INCIDENT_TYPES: incidentTypesConfig.filter(it => it.isActive).map(it => it.name),
    };

    return (
        <ConfigContext.Provider value={value}>
            {!loading && children}
        </ConfigContext.Provider>
    );
};
