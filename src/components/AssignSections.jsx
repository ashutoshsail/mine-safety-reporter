import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Check } from 'lucide-react';

const AssignSections = () => {
    const { minesConfig, sectionsConfig } = useContext(AppContext);
    const [selectedMineId, setSelectedMineId] = useState('');
    const [assignedSections, setAssignedSections] = useState([]);
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        // When a mine is selected, populate the checkboxes with its current assigned sections
        if (selectedMineId) {
            const selectedMine = minesConfig.find(m => m.id === selectedMineId);
            setAssignedSections(selectedMine?.assignedSections || []);
        } else {
            setAssignedSections([]);
        }
    }, [selectedMineId, minesConfig]);

    const handleSectionToggle = (sectionId) => {
        setAssignedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId) 
                : [...prev, sectionId]
        );
    };

    const handleSaveChanges = async () => {
        if (!selectedMineId) return;
        const mineDocRef = doc(db, 'config_mines', selectedMineId);
        try {
            await updateDoc(mineDocRef, {
                assignedSections: assignedSections
            });
            setFeedback(true);
            setTimeout(() => setFeedback(false), 2000);
        } catch (error) {
            console.error("Error updating assigned sections: ", error);
            alert("Failed to save changes.");
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
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
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                        {sectionsConfig.map(section => (
                            <label key={section.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={assignedSections.includes(section.id)}
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
                    disabled={!selectedMineId}
                    className="w-full flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50 text-sm"
                >
                    {feedback ? <><Check size={16}/> Saved!</> : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default AssignSections;
