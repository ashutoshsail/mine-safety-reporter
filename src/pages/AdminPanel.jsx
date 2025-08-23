import React, { useState, useContext, useEffect } from 'react';
import { UIContext } from '../context/UIContext';
import { DataContext } from '../context/DataContext';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { collection, writeBatch, doc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ShieldCheck, DatabaseZap, Trash2, Edit, Plus, ToggleLeft, ToggleRight, X, Check, Image as ImageIcon, Megaphone, ArrowUp, ArrowDown, Clock, FileText } from 'lucide-react';
import AssignSections from '../components/AssignSections';
import AdminNoticeManager from '../components/AdminNoticeManager';

const ConfigManager = React.memo(({ title, collectionName, items }) => {
    const [newItem, setNewItem] = useState({ name: '' });
    const [editingItem, setEditingItem] = useState(null);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name || !window.confirm(`Are you sure you want to add "${newItem.name}"?`)) return;
        const newOrder = (items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0) + 10;
        await addDoc(collection(db, collectionName), { name: newItem.name, isActive: true, order: newOrder });
        setNewItem({ name: '' });
    };

    const handleUpdateItem = async () => {
        if (!editingItem || !editingItem.id || !window.confirm(`Are you sure you want to update "${editingItem.name}"?`)) return;
        const itemDocRef = doc(db, collectionName, editingItem.id);
        await updateDoc(itemDocRef, { name: editingItem.name, isActive: editingItem.isActive });
        setEditingItem(null);
    };
    
    const handleReorder = async (item, direction) => {
        const itemIndex = items.findIndex(i => i.id === item.id);
        const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (newIndex >= 0 && newIndex < items.length) {
            const batch = writeBatch(db);
            const currentItemRef = doc(db, collectionName, items[itemIndex].id);
            const targetItemRef = doc(db, collectionName, items[newIndex].id);
            
            const newOrder = items[newIndex].order;
            const targetNewOrder = items[itemIndex].order;
            
            batch.update(currentItemRef, { order: newOrder });
            batch.update(targetItemRef, { order: targetNewOrder });
            await batch.commit();
        }
    };

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">{title}</h2>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ name: e.target.value })}
                    placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
                    className="flex-grow p-2 text-sm rounded-md border dark:bg-dark-card dark:border-slate-600"
                />
                <button type="submit" className="bg-light-primary text-white font-semibold px-4 py-2 rounded-md text-sm">
                    <Plus size={16} />
                </button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {(items || []).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                        {editingItem?.id === item.id ? (
                            <>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="flex-grow p-1 text-sm rounded-md border dark:bg-dark-card dark:border-slate-600"
                                />
                                <div className="flex gap-1 ml-2">
                                    <button onClick={handleUpdateItem} className="p-1 rounded-md text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50"><Check size={16} /></button>
                                    <button onClick={() => setEditingItem(null)} className="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><X size={16} /></button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className={`text-sm ${!item.isActive ? 'line-through text-slate-400' : ''}`}>{item.name}</span>
                                <div className="flex gap-1 ml-2">
                                    <button onClick={() => handleReorder(item, 'up')} className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"><ArrowUp size={16} /></button>
                                    <button onClick={() => handleReorder(item, 'down')} className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"><ArrowDown size={16} /></button>
                                    <button onClick={() => setEditingItem(item)} className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"><Edit size={16} /></button>
                                    <button onClick={() => updateDoc(doc(db, collectionName, item.id), { isActive: !item.isActive })} className="p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600">
                                        {item.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

const AdminPanel = ({ setRoute }) => {
    const { setDemoMode, demoMode } = useContext(UIContext);
    const { loadMockIncidentForForm } = useContext(DataContext);
    const { minesConfig, sectionsConfig, incidentTypesConfig } = useContext(ConfigContext);
    const [message, setMessage] = useState('');

    const handleLoadDemoData = () => {
        setDemoMode(true);
        setMessage("Demo mode activated with mock data.");
    };

    const handleClearDemoData = () => {
        setDemoMode(false);
        setMessage("Demo mode deactivated.");
    };

    const handleLoadMockIncident = () => {
        if (!demoMode) {
             setDemoMode(true);
             setMessage("Activating demo mode and loading mock incident...");
             setTimeout(() => {
                loadMockIncidentForForm();
                setRoute('report');
             }, 1000);
        } else {
            loadMockIncidentForForm();
            setRoute('report');
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-semibold text-light-text dark:text-dark-text">Admin Panel</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ConfigManager title="Mines" collectionName="config_mines" items={minesConfig} />
                <ConfigManager title="Sections" collectionName="config_sections" items={sectionsConfig} />
                <ConfigManager title="Incident Types" collectionName="config_incident_types" items={incidentTypesConfig} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <AdminNoticeManager />
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Demo Mode Controls</h2>
                    <div className="space-y-3">
                        <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">
                            Generate temporary, in-memory mock data for demonstration purposes. This data is not saved to the database.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleLoadDemoData} className="flex items-center justify-center gap-2 bg-light-secondary text-white font-semibold px-4 py-2 rounded-md transition-colors">
                                <DatabaseZap size={16} /><span>Load Demo Data</span>
                            </button>
                            <button onClick={handleClearDemoData} className="flex items-center justify-center gap-2 bg-light-status-danger text-white font-semibold px-4 py-2 rounded-md transition-colors">
                                <Trash2 size={16} /><span>Clear Demo Data</span>
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                             <button onClick={handleLoadMockIncident} className="flex items-center justify-center w-full gap-2 bg-light-accent text-white font-semibold px-4 py-2 rounded-md transition-colors">
                                <FileText size={16} /><span>Load Mock Incident for Form</span>
                            </button>
                        </div>
                        {message && <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2">{message}</p>}
                    </div>
                </div>
            </div>
            <AssignSections />
        </div>
    );
};

export default AdminPanel;