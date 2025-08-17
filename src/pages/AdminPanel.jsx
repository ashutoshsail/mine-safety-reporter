import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { collection, writeBatch, doc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ShieldCheck, DatabaseZap, Trash2, Edit, Plus, ToggleLeft, ToggleRight, X, Check, Image as ImageIcon, Megaphone, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import AssignSections from '../components/AssignSections';

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
        if (!editingItem || !editingItem.id || !window.confirm(`Are you sure you want to save changes to "${editingItem.name}"?`)) return;
        const { id, ...dataToUpdate } = editingItem;
        const itemDoc = doc(db, collectionName, id);
        await updateDoc(itemDoc, dataToUpdate);
        setEditingItem(null);
    };

    const handleToggleActive = async (item) => {
        if (!window.confirm(`Are you sure you want to ${item.isActive ? 'deactivate' : 'activate'} "${item.name}"?`)) return;
        const itemDoc = doc(db, collectionName, item.id);
        await updateDoc(itemDoc, { isActive: !item.isActive });
    };

    const handleReorder = async (index, direction) => {
        const itemToMove = items[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const itemToSwap = items[swapIndex];

        if (!itemToMove || !itemToSwap || typeof itemToMove.order !== 'number' || typeof itemToSwap.order !== 'number') {
            alert("Cannot reorder items. One or more items is missing an 'order' field. Please check your Firestore data.");
            return;
        }

        const batch = writeBatch(db);
        const itemToMoveRef = doc(db, collectionName, itemToMove.id);
        const itemToSwapRef = doc(db, collectionName, itemToSwap.id);

        batch.update(itemToMoveRef, { order: itemToSwap.order });
        batch.update(itemToSwapRef, { order: itemToMove.order });

        await batch.commit();
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <h3 className="font-semibold text-base mb-2">{title}</h3>
            <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ name: e.target.value })}
                    placeholder={`New ${title.slice(0, -1)} Name...`}
                    className="flex-grow bg-light-card dark:bg-dark-card p-2 rounded-md border border-light-border dark:border-dark-border text-sm"
                />
                <button type="submit" className="bg-light-secondary hover:bg-light-secondary/90 text-white p-2 rounded-md"><Plus size={20} /></button>
            </form>
            <ul className="space-y-2">
                {items && items.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between bg-light-card dark:bg-dark-card p-2 rounded-md text-sm">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <button onClick={() => handleReorder(index, 'up')} disabled={index === 0} className="disabled:opacity-20"><ArrowUp size={14} /></button>
                                <button onClick={() => handleReorder(index, 'down')} disabled={index === items.length - 1} className="disabled:opacity-20"><ArrowDown size={14} /></button>
                            </div>
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
                        </div>
                        <div className="flex items-center gap-2">
                            {editingItem?.id === item.id ? (
                                <>
                                    <button onClick={handleUpdateItem}><Check size={18} className="text-light-status-success" /></button>
                                    <button onClick={() => setEditingItem(null)}><X size={18} className="text-light-status-danger" /></button>
                                </>
                            ) : (
                                <button onClick={() => setEditingItem(item)}><Edit size={16} className="text-light-subtle-text" /></button>
                            )}
                            <button onClick={() => handleToggleActive(item)}>
                                {item.isActive ? <ToggleRight size={24} className="text-light-status-success" /> : <ToggleLeft size={24} className="text-slate-400" />}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
});

const LogoManager = () => {
    const { companyProfile } = useContext(ConfigContext);
    const [logoUrl, setLogoUrl] = useState('');
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        if (companyProfile) {
            setLogoUrl(companyProfile.logoUrl || '');
        }
    }, [companyProfile]);

    const handleSaveChanges = async () => {
        if (!window.confirm("Are you sure you want to update the company logo?")) return;
        const profileDocRef = doc(db, 'config_general', 'companyProfile');
        try {
            await setDoc(profileDocRef, { logoUrl: logoUrl }, { merge: true });
            setFeedback(true);
            setTimeout(() => setFeedback(false), 2000);
        } catch (error) {
            console.error("Error updating logo: ", error);
            alert("Failed to save logo.");
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-base"><ImageIcon size={18}/> Company Logo</h3>
            <input 
                value={logoUrl} 
                onChange={(e) => setLogoUrl(e.target.value)} 
                placeholder="Paste image URL here..." 
                className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" 
            />
            <button onClick={handleSaveChanges} className="w-full flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md text-sm">
                {feedback ? <><Check size={16}/> Saved!</> : 'Save Logo'}
            </button>
        </div>
    );
};

const AdminNoticeManager = () => {
    const { homePageNotice } = useContext(ConfigContext);
    const [notice, setNotice] = useState({
        isActive: false,
        title: '',
        message: '',
        imageUrl: '',
    });
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        if (homePageNotice) {
            setNotice(homePageNotice);
        }
    }, [homePageNotice]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNotice(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveChanges = async () => {
        if (!window.confirm("Are you sure you want to save the notice?")) return;
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
            <h3 className="font-semibold flex items-center gap-2 text-base"><Megaphone size={18}/> Home Page Notice</h3>
            <div className="flex items-center justify-between">
                <label htmlFor="isActive" className="font-semibold text-sm">Activate Notice</label>
                <input type="checkbox" id="isActive" name="isActive" checked={notice.isActive} onChange={handleInputChange} className="h-5 w-5 rounded text-light-primary focus:ring-light-primary" />
            </div>
            <input name="title" value={notice.title} onChange={handleInputChange} placeholder="Notice Title" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
            <textarea name="message" value={notice.message} onChange={handleInputChange} placeholder="Notice Message..." rows="3" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border"></textarea>
            <input name="imageUrl" value={notice.imageUrl} onChange={handleInputChange} placeholder="Image URL (optional)" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
            <button onClick={handleSaveChanges} className="w-full flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md text-sm">
                {feedback ? <><Check size={16}/> Saved!</> : 'Save Notice'}
            </button>
        </div>
    );
};

const OperationalDataManager = () => {
    const { MINES } = useContext(ConfigContext);
    const [mine, setMine] = useState(MINES && MINES.length > 0 ? MINES[0] : '');
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [hours, setHours] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mine || !month || !hours || isNaN(parseInt(hours))) {
            alert('Please fill all fields with valid data.');
            return;
        }
        if (!window.confirm(`Save ${hours} hours for ${mine} for the month of ${month}?`)) return;

        setFeedback('Saving...');
        try {
            const docRef = doc(db, 'operationalData', mine);
            await setDoc(docRef, { [month]: parseInt(hours, 10) }, { merge: true });

            setFeedback('Successfully saved!');
            setHours('');
        } catch (error) {
            console.error("Error saving operational data: ", error);
            setFeedback('Error saving data.');
        }
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2 text-base mb-2"><Clock size={18}/> Monthly Hours Worked</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <select value={mine} onChange={e => setMine(e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border">
                    {(MINES || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex gap-2">
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                    <input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="Total Hours" className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                </div>
                <button type="submit" className="w-full bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md text-sm">
                    {feedback ? feedback : 'Save Hours'}
                </button>
            </form>
        </div>
    );
};

const AdminPanel = () => {
    const { setDemoMode } = useContext(AppContext);
    const { minesConfig, sectionsConfig, incidentTypesConfig } = useContext(ConfigContext);
    const [message, setMessage] = useState('');

    const handleLoadDemoData = () => {
        if (window.confirm("This will enable Demo Mode and generate temporary data for this session. Proceed?")) {
            setDemoMode(true);
            setMessage('Demo Mode activated. You can now navigate to other pages.');
        }
    };

    const handleClearDemoData = () => {
        setDemoMode(false);
        setMessage('Demo Mode deactivated.');
    };

    // NEW: Add a loading check.
    // If the core config data hasn't loaded yet, show a loading message to prevent crashing.
    if (!minesConfig || !sectionsConfig || !incidentTypesConfig) {
        return (
            <div className="p-4 bg-slate-100 dark:bg-slate-950 min-h-screen flex items-center justify-center">
                <p>Loading Configuration...</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-950 min-h-screen">
            <div className="space-y-6">
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Manage Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ConfigManager title="Mines" collectionName="config_mines" items={minesConfig} />
                        <ConfigManager title="Sections" collectionName="config_sections" items={sectionsConfig} />
                        <ConfigManager title="Incident Types" collectionName="config_incident_types" items={incidentTypesConfig} />
                        <div className="md:col-span-2 lg:col-span-3"><AssignSections /></div>
                        <div className="md:col-span-2 lg:col-span-3"><LogoManager /></div>
                        <div className="md:col-span-2 lg:col-span-3"><AdminNoticeManager /></div>
                        <div className="md:col-span-2 lg:col-span-3"><OperationalDataManager /></div>
                    </div>
                </div>

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
                        {message && <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2">{message}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;