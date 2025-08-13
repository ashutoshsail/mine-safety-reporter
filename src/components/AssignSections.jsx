import React, { useState, useContext, useEffect, useMemo } from 'react';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Check } from 'lucide-react';

const AssignSections = () => {
    const { minesConfig, sectionsConfig } = useContext(ConfigContext);
    const [selectedMineId, setSelectedMineId] = useState('');
    const [currentAssigned, setCurrentAssigned] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const selectedMine = useMemo(() => 
        minesConfig.find(m => m.id === selectedMineId), 
    [selectedMineId, minesConfig]);

    useEffect(() => {
        setCurrentAssigned(selectedMine?.assignedSections || []);
    }, [selectedMine]);

    const handleSectionToggle = (sectionId) => {
        setCurrentAssigned(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId) 
                : [...prev, sectionId]
        );
    };

    const handleSaveChanges = async () => {
        if (!selectedMineId) return;
        setIsSaving(true);
        const mineDocRef = doc(db, 'config_mines', selectedMineId);
        try {
            await updateDoc(mineDocRef, {
                assignedSections: currentAssigned
            });
        } catch (error) {
            console.error("Error updating assigned sections: ", error);
            alert("Failed to save changes.");
        }
        setIsSaving(false);
    };

    const hasUnsavedChanges = useMemo(() => {
        if (!selectedMine) return false;
        const saved = selectedMine.assignedSections || [];
        return JSON.stringify(currentAssigned.sort()) !== JSON.stringify(saved.sort());
    }, [currentAssigned, selectedMine]);

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            {/* --- TROUBLESHOOTING --- */}
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md text-xs mb-2 font-mono">
                <p className="font-bold">[DEBUG: AssignSections State]</p>
                <p><strong>Selected Mine:</strong> {selectedMine?.name || 'None'}</p>
                <p><strong>Saved Sections (from DB):</strong> {JSON.stringify(selectedMine?.assignedSections?.sort() || [])}</p>
                <p><strong>Current UI Sections:</strong> {JSON.stringify(currentAssigned.sort() || [])}</p>
                <p><strong>Has Unsaved Changes:</strong> {hasUnsavedChanges.toString()}</p>
            </div>
            {/* --- END TROUBLESHOOTING --- */}
            <h3 className="font-semibold mb-2">Assign Sections to Mines</h3>
            <div className="space-y-3">
                <select 
                    value={selectedMineId} 
                    onChange={(e) => setSelectedMineId(e.target.value)}
                    className="w-full bg-light-card dark:bg-dark-card p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                >
                    <option value="">-- Select a Mine --</option>
                    {minesConfig.map(mine => (
                        <option key={mine.id} value={mine.id}>{mine.name}</option>
                    ))}
                </select>

                {selectedMineId && (
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md dark:border-slate-600">
                        {sectionsConfig.map(section => (
                            <label key={section.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={currentAssigned.includes(section.id)}
                                    onChange={() => handleSectionToggle(section.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-light-accent focus:ring-light-accent"
                                />
                                <span className="text-sm">{section.name}</span>
                            </label>
                        ))}
                    </div>
                )}

                <button 
                    onClick={handleSaveChanges}
                    disabled={!selectedMineId || !hasUnsavedChanges || isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50 text-sm"
                >
                    {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes' : <><Check size={16}/> All Changes Saved</>)}
                </button>
            </div>
        </div>
    );
};

export default AssignSections;
