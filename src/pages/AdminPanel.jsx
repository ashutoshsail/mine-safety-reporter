import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../firebaseConfig';
import { collection, writeBatch, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { mockIncidents } from '../utils/mockData';
import { serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, DatabaseZap, Trash2, Edit, Plus, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import AssignSections from '../components/AssignSections'; // <-- Import the new component

// Reusable component to manage each configuration list
const ConfigManager = ({ title, collectionName, items, fields }) => {
    const [newItem, setNewItem] = useState({ name: '' });
    const [editingItem, setEditingItem] = useState(null);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        await addDoc(collection(db, collectionName), { ...newItem, isActive: true, name: newItem.name });
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


const AdminPanel = () => {
    const { demoMode, setDemoMode, minesConfig, sectionsConfig, incidentTypesConfig } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLoadDemoData = async () => { /* ... function code ... */ };
    const handleClearDemoData = async () => { /* ... function code ... */ };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
                <ShieldCheck size={24} className="text-light-accent" />
                <h1 className="text-2xl font-semibold">Admin Panel</h1>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3">Manage Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ConfigManager title="Mines" collectionName="config_mines" items={minesConfig} fields={['name']} />
                    <ConfigManager title="Sections" collectionName="config_sections" items={sectionsConfig} fields={['name']} />
                    <ConfigManager title="Incident Types" collectionName="config_incident_types" items={incidentTypesConfig} fields={['name']} />
                    {/* Add the new component here */}
                    <div className="md:col-span-2 lg:col-span-3">
                        <AssignSections />
                    </div>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-3">Demo Mode Controls</h2>
                {/* ... Demo mode JSX remains the same ... */}
            </div>
        </div>
    );
};

export default AdminPanel;
