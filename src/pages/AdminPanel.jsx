import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../firebaseConfig';
import { collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { mockIncidents } from '../utils/mockData';
import { serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, DatabaseZap, Trash2 } from 'lucide-react';

const AdminPanel = () => {
    const { demoMode, setDemoMode } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLoadDemoData = async () => {
        if (!window.confirm("Are you sure you want to load 250 mock incidents into the database? This cannot be undone easily.")) {
            return;
        }
        setLoading(true);
        setMessage('Loading demo data... this may take a moment.');

        try {
            const batch = writeBatch(db);
            const incidentsCollection = collection(db, 'incidents');

            mockIncidents.forEach(incident => {
                const docRef = doc(incidentsCollection); // Firestore will auto-generate an ID
                const incidentWithDemoTag = {
                    ...incident,
                    isDemo: true, // Add the demo tag
                    createdAt: serverTimestamp() // Use a proper server timestamp
                };
                batch.set(docRef, incidentWithDemoTag);
            });

            await batch.commit();
            setDemoMode(true);
            setMessage('Successfully loaded 250 mock incidents.');
        } catch (error) {
            console.error("Error loading demo data: ", error);
            setMessage('Failed to load demo data. Check the console for errors.');
        }
        setLoading(false);
    };

    const handleClearDemoData = async () => {
        if (!window.confirm("Are you sure you want to delete all demo incidents from the database? This is permanent.")) {
            return;
        }
        setLoading(true);
        setMessage('Deleting demo data...');

        try {
            const incidentsCollection = collection(db, 'incidents');
            const q = query(incidentsCollection, where("isDemo", "==", true));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setMessage("No demo data found to delete.");
                setLoading(false);
                setDemoMode(false);
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            setDemoMode(false);
            setMessage(`Successfully deleted ${querySnapshot.size} demo incidents.`);
        } catch (error) {
            console.error("Error clearing demo data: ", error);
            setMessage('Failed to clear demo data. Check the console for errors.');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
                <ShieldCheck size={24} className="text-light-accent" />
                <h1 className="text-2xl font-semibold">Admin Panel</h1>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3">Demo Mode Controls</h2>
                <div className="space-y-3">
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">
                        Use these controls to populate the app with mock data for demonstration purposes. This data is tagged and can be cleared at any time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleLoadDemoData} 
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                            <DatabaseZap size={16} />
                            <span>Load Demo Data</span>
                        </button>
                        <button 
                            onClick={handleClearDemoData} 
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            <span>Clear Demo Data</span>
                        </button>
                    </div>
                    {loading && <p className="text-sm">{message}</p>}
                    {!loading && message && <p className="text-sm font-semibold text-green-600 dark:text-green-400">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
