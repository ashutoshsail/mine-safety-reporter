import React, { useState, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronRight, FileText, Download, Edit, CheckCircle, Upload, X, UserPlus, Trash2, Check } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportIncidentPage = () => {
    const { user, minesConfig, sectionsConfig, incidentTypesConfig, addIncident, currentDate, updateUserLastSelectedMine, getUserLastSelectedMine } = useContext(AppContext);
    
    const [step, setStep] = useState(1);
    const initialVictimState = { name: '', category: 'Regular', formB: '', contractorName: '', poNumber: '' };
    const [currentVictim, setCurrentVictim] = useState(initialVictimState);
    const [victimFeedback, setVictimFeedback] = useState(false);

    const activeMines = useMemo(() => minesConfig.filter(m => m.isActive), [minesConfig]);
    const lastSelectedMine = getUserLastSelectedMine();

    const [formData, setFormData] = useState({
        reporterName: user.name,
        mine: lastSelectedMine || (activeMines.length > 0 ? activeMines[0].name : ''),
        sectionName: '',
        otherSection: '',
        date: new Date(currentDate).toISOString().split('T')[0],
        time: new Date(currentDate).toTimeString().slice(0, 5),
        type: 'First Aid',
        location: '',
        description: '',
        victims: [],
        incidentCause: '',
        immediateAction: '',
        photos: [],
    });
    const [newIncident, setNewIncident] = useState(null);
    const pdfRef = useRef();

    const availableSections = useMemo(() => {
        const selectedMineConfig = minesConfig.find(m => m.name === formData.mine);
        if (selectedMineConfig && selectedMineConfig.assignedSections) {
            return sectionsConfig.filter(s => selectedMineConfig.assignedSections.includes(s.id) && s.isActive);
        }
        // Fallback to all active sections if none are assigned
        return sectionsConfig.filter(s => s.isActive);
    }, [formData.mine, minesConfig, sectionsConfig]);

    // Effect to reset section if it's no longer available for the selected mine
    useEffect(() => {
        if (availableSections.length > 0 && !availableSections.find(s => s.name === formData.sectionName)) {
            setFormData(prev => ({ ...prev, sectionName: availableSections[0]?.name || '' }));
        }
    }, [availableSections, formData.sectionName]);


    const isVictimInfoRequired = !['Near Miss', 'High Potential Incident'].includes(formData.type);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'mine') {
            updateUserLastSelectedMine(value);
        }
    };
    
    const handleVictimChange = (e) => setCurrentVictim(prev => ({...prev, [e.target.name]: e.target.value}));

    const handleAddVictim = () => {
        if (!currentVictim.name) return;
        setFormData(prev => ({ ...prev, victims: [...prev.victims, currentVictim] }));
        setCurrentVictim(initialVictimState);
        setVictimFeedback(true);
        setTimeout(() => setVictimFeedback(false), 1500);
    };

    const removeVictim = (index) => setFormData(prev => ({ ...prev, victims: prev.victims.filter((_, i) => i !== index) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isVictimInfoRequired && formData.victims.length === 0) {
            alert('Victim details are required for this type of incident.');
            return;
        }
        if (step === 1) setStep(2);
        else if (step === 2) {
            const finalData = { ...formData };
            if (formData.sectionName === 'Other') finalData.sectionName = formData.otherSection;
            const createdIncident = await addIncident(finalData);
            setNewIncident(createdIncident);
            setStep(3);
        }
    };
    
    const downloadPDF = async () => { /* ... function code ... */ };
    const handlePhotoUpload = (e) => { /* ... function code ... */ };
    const removePhoto = (index) => { /* ... function code ... */ };

    const FormField = ({ label, children }) => (
        <div>
            <label className="block text-xs font-semibold mb-1">{label}</label>
            {children}
        </div>
    );
    
    const inputClass = "w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm";

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Report New Incident</h1>
            <div className="bg-light-card dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md">
                {step === 1 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <FormField label="Reporter Name"><input type="text" value={formData.reporterName} readOnly className="w-full bg-slate-200 dark:bg-slate-800 p-2 rounded-md text-sm cursor-not-allowed" /></FormField>
                            <FormField label="Incident Type"><select name="type" value={formData.type} onChange={handleInputChange} className={inputClass}>{incidentTypesConfig.filter(it => it.isActive).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></FormField>
                            <FormField label="Mine"><select name="mine" value={formData.mine} onChange={handleInputChange} className={inputClass}>{activeMines.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></FormField>
                            <FormField label="Section"><select name="sectionName" value={formData.sectionName} onChange={handleInputChange} className={inputClass}>{availableSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></FormField>
                            {/* ... rest of the form ... */}
                        </div>
                        {/* ... Victim details and other sections ... */}
                        <div className="mt-6 text-right border-t pt-4"><button type="submit" className="bg-light-primary hover:bg-light-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md flex items-center gap-2 float-right text-sm"><ChevronRight size={16} /><span>Next: Preview</span></button></div>
                    </form>
                )}
                {/* ... Step 2 and 3 JSX ... */}
            </div>
            <div ref={pdfRef} className="fixed -left-[9999px] top-0"><IncidentReportPDF incident={newIncident || formData} /></div>
        </div>
    );
};

export default ReportIncidentPage;
