import React, { useState, useContext, useEffect } from 'react';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Megaphone, Check } from 'lucide-react';

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

export default AdminNoticeManager;
