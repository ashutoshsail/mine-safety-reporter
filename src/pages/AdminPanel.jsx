import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { collection, writeBatch, query, where, getDocs, doc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { mockIncidents } from '../utils/mockData';
import { serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, DatabaseZap, Trash2, Edit, Plus, ToggleLeft, ToggleRight, X, Check, Megaphone } from 'lucide-react';
import AssignSections from '../components/AssignSections';

const ConfigManager = ({ title, collectionName, items }) => {
    const [newItem, setNewItem] = useState({ name: '' });
    const [editingItem, setEditingItem] = useState(null);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        await addDoc(collection(db, collectionName), { name: newItem.name, isActive: true });
        setNewItem({ name: '' });
    };

    const handleUpdateItem = async () => {
        if (!editingItem || !editingItem.id) return;
        const { id, ...dataToUpdate } = editingItem;
        const itemDoc = doc(db, collectionName, id);
        await updateDoc(itemDoc, dataToUpdate);
        setEditingItem(null);
    };

    const handleToggleActive = async (item) => {
        const itemDoc = doc(db, collectionName, item.id);
        await updateDoc(itemDoc, { isActive: !item.isActive });
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">{title}</h3>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ name: e.target.value })}
                    placeholder={`New ${title.slice(0, -1)} Name...`}
                    className="flex-grow bg-light-card dark:bg-dark-card p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
                <button type="submit" className="bg-light-accent hover:bg-light-accent/90 text-white p-2 rounded-md"><Plus size={20} /></button>
            </form>
            <ul className="space-y-2">
                {items && items.map(item => (
                    <li key={item.id} className="flex items-center justify-between bg-light-card dark:bg-dark-card p-2 rounded-md text-sm">
                        {editingItem?.id === item.id ? (
                            <input
                                type="text"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                className="flex-grow bg-slate-100 dark:bg-slate-700 p-1 rounded-md text-sm"
                            />
                        ) : (
                            <span className={!item.isActive ? 'line-through text-slate-400' : ''}>{item.name}</span>
                        )}
                        <div className="flex items-center gap-2">
                            {editingItem?.id === item.id ? (
                                <>
                                    <button onClick={handleUpdateItem}><Check size={18} className="text-green-500" /></button>
                                    <button onClick={() => setEditingItem(null)}><X size={18} className="text-red-500" /></button>
                                </>
                            ) : (
                                <button onClick={() => setEditingItem(item)}><Edit size={16} className="text-slate-500" /></button>
                            )}
                            <button onClick={() => handleToggleActive(item)}>
                                {item.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-slate-400" />}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AdminNoticeManager = () => {
    const { homePageNotice } = useContext(ConfigContext);
    const [notice, setNotice] = useState({
        isActive: homePageNotice?.isActive || false,
        title: homePageNotice?.title || '',
        message: homePageNotice?.message || '',
        imageUrl: homePageNotice?.imageUrl || '',
    });
    const [feedback, setFeedback] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNotice(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveChanges = async () => {
        const noticeDocRef = doc(db, 'config_general', 'homePageNotice');
        try {
            await setDoc(noticeDocRef, notice);
            setFeedback(true);
            setTimeout(() => setFeedback(false), 2000);
        } catch (error) {
            console.error("Error updating notice: ", error);
            alert("Failed to save notice.");
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Megaphone size={18}/> Home Page Notice</h3>
            <div className="flex items-center justify-between">
                <label htmlFor="isActive" className="font-semibold text-sm">Activate Notice</label>
                <input type="checkbox" id="isActive" name="isActive" checked={notice.isActive} onChange={handleInputChange} className="h-5 w-5 rounded text-light-accent focus:ring-light-accent" />
            </div>
            <input name="title" value={notice.title} onChange={handleInputChange} placeholder="Notice Title" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-slate-600" />
            <textarea name="message" value={notice.message} onChange={handleInputChange} placeholder="Notice Message..." rows="3" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-slate-600"></textarea>
            <input name="imageUrl" value={notice.imageUrl} onChange={handleInputChange} placeholder="Image URL (optional)" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-slate-600" />
            <button onClick={handleSaveChanges} className="w-full flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md text-sm">
                {feedback ? <><Check size={16}/> Saved!</> : 'Save Notice'}
            </button>
        </div>
    );
};

const AdminPanel = () => {
    const { demoMode, setDemoMode } = useContext(AppContext);
    const { minesConfig, sectionsConfig, incidentTypesConfig } = useContext(ConfigContext);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLoadDemoData = async () => {
        if (!window.confirm("Are you sure you want to load 250 mock incidents into the database?")) return;
        setLoading(true);
        setMessage('Loading demo data...');
        try {
            const batch = writeBatch(db);
            const incidentsCollection = collection(db, 'incidents');
            mockIncidents.forEach(incident => {
                const docRef = doc(incidentsCollection);
                batch.set(docRef, { ...incident, isDemo: true, createdAt: serverTimestamp() });
            });
            await batch.commit();
            setDemoMode(true);
            setMessage('Successfully loaded 250 mock incidents.');
        } catch (error) {
            setMessage('Failed to load demo data.');
            console.error(error);
        }
        setLoading(false);
    };

    const handleClearDemoData = async () => {
        if (!window.confirm("Are you sure you want to delete all demo incidents? This is permanent.")) return;
        setLoading(true);
        setMessage('Deleting demo data...');
        try {
            const q = query(collection(db, 'incidents'), where("isDemo", "==", true));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setMessage("No demo data found.");
                setLoading(false);
                setDemoMode(false);
                return;
            }
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setDemoMode(false);
            setMessage(`Successfully deleted ${snapshot.size} demo incidents.`);
        } catch (error) {
            setMessage('Failed to clear demo data.');
            console.error(error);
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
                <h2 className="text-lg font-semibold mb-3">Manage Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ConfigManager title="Mines" collectionName="config_mines" items={minesConfig} />
                    <ConfigManager title="Sections" collectionName="config_sections" items={sectionsConfig} />
                    <ConfigManager title="Incident Types" collectionName="config_incident_types" items={incidentTypesConfig} />
                    <div className="md:col-span-2 lg:col-span-3">
                        <AssignSections />
                    </div>
                     <div className="md:col-span-2 lg:col-span-3">
                        <AdminNoticeManager />
                    </div>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3">Demo Mode Controls</h2>
                <div className="space-y-3">
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">
                        Populate the app with mock data for demonstration purposes. This data is tagged and can be cleared at any time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleLoadDemoData} disabled={loading} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50">
                            <DatabaseZap size={16} /><span>Load Demo Data</span>
                        </button>
                        <button onClick={handleClearDemoData} disabled={loading} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50">
                            <Trash2 size={16} /><span>Clear Demo Data</span>
                        </button>
                    </div>
                    {loading && <p className="text-sm animate-pulse">{message}</p>}
                    {!loading && message && <p className="text-sm font-semibold text-green-600 dark:text-green-400">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
