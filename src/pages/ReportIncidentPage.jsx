import React, { useState, useContext, useRef, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { ChevronRight, FileText, Download, CheckCircle, Upload, X, UserPlus, Trash2, Check } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportIncidentPage = () => {
    const { user, addIncident, updateUserLastSelectedMine, getUserLastSelectedMine } = useContext(AppContext);
    const { minesConfig, sectionsConfig, INCIDENT_TYPES } = useContext(ConfigContext);
    
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
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        type: INCIDENT_TYPES.length > 0 ? INCIDENT_TYPES[0] : 'First Aid',
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
            const activeSections = sectionsConfig.filter(s => s.isActive);
            return activeSections.filter(s => selectedMineConfig.assignedSections.includes(s.id));
        }
        return sectionsConfig.filter(s => s.isActive);
    }, [formData.mine, minesConfig, sectionsConfig]);

    useEffect(() => {
        if (availableSections.length > 0 && !availableSections.find(s => s.name === formData.sectionName)) {
            setFormData(prev => ({ ...prev, sectionName: availableSections[0]?.name || '' }));
        } else if (availableSections.length === 0) {
            setFormData(prev => ({ ...prev, sectionName: '' }));
        }
    }, [availableSections]);


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
    
    const downloadPDF = async () => {
        const pdfContainer = pdfRef.current;
        if (!pdfContainer) return;
        pdfContainer.style.display = 'block';
        const canvas = await html2canvas(pdfContainer, { scale: 2 });
        pdfContainer.style.display = 'none';
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeightOnPdf = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightOnPdf);
        pdf.save(`Incident-Report-${newIncident.id}.pdf`);
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const photoPreviews = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...photoPreviews] }));
    };

    const removePhoto = (index) => {
        const updatedPhotos = [...formData.photos];
        URL.revokeObjectURL(updatedPhotos[index].url);
        updatedPhotos.splice(index, 1);
        setFormData(prev => ({ ...prev, photos: updatedPhotos }));
    };

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
                            <FormField label="Incident Type"><select name="type" value={formData.type} onChange={handleInputChange} className={inputClass}>{INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></FormField>
                            <FormField label="Mine"><select name="mine" value={formData.mine} onChange={handleInputChange} className={inputClass}>{activeMines.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></FormField>
                            <FormField label="Section"><select name="sectionName" value={formData.sectionName} onChange={handleInputChange} className={inputClass} disabled={availableSections.length === 0}>{availableSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></FormField>
                            {formData.sectionName === 'Other' && <div className="col-span-2"><FormField label="Other Section Name"><input type="text" name="otherSection" value={formData.otherSection} onChange={handleInputChange} className={inputClass} required /></FormField></div>}
                            <FormField label="Date"><input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputClass} /></FormField>
                            <FormField label="Time"><input type="time" name="time" value={formData.time} onChange={handleInputChange} className={inputClass} /></FormField>
                            <div className="col-span-2"><FormField label="Location"><input type="text" name="location" value={formData.location} onChange={handleInputChange} className={inputClass} required /></FormField></div>
                            <div className="col-span-2"><FormField label="Description"><textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className={inputClass} required></textarea></FormField></div>
                        </div>

                        <div className="col-span-2 border-t pt-4">
                            <h3 className="font-semibold mb-2 text-base">Victim Details {isVictimInfoRequired ? '(Required)' : '(Optional)'}</h3>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <input name="name" value={currentVictim.name} onChange={handleVictimChange} placeholder="Victim's Name" className={`col-span-2 ${inputClass}`} />
                                    <select name="category" value={currentVictim.category} onChange={handleVictimChange} className={inputClass}>
                                        <option>Regular</option>
                                        <option>Contractual</option>
                                    </select>
                                    {currentVictim.category === 'Regular' ? (
                                        <input name="formB" value={currentVictim.formB} onChange={handleVictimChange} placeholder="Form B No." className={inputClass} />
                                    ) : (
                                        <>
                                            <input name="contractorName" value={currentVictim.contractorName} onChange={handleVictimChange} placeholder="Contractor's Name" className={inputClass} />
                                            <input name="poNumber" value={currentVictim.poNumber} onChange={handleVictimChange} placeholder="PO No." className={inputClass} />
                                        </>
                                    )}
                                </div>
                                <button type="button" onClick={handleAddVictim} className={`flex items-center gap-2 text-sm text-white px-3 py-1.5 rounded-md transition-colors ${victimFeedback ? 'bg-green-500' : 'bg-light-accent'}`}>
                                    {victimFeedback ? <><Check size={16}/> Victim Added</> : <><UserPlus size={16}/> Add Victim</>}
                                </button>
                            </div>
                            {formData.victims.map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-2 mt-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm">
                                    <span>{v.name} ({v.category})</span>
                                    <button type="button" onClick={() => removeVictim(i)}><Trash2 size={14} className="text-red-500 hover:text-red-700"/></button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="col-span-2 border-t pt-4 space-y-3">
                            <FormField label="Cause of Incident (Optional)"><textarea name="incidentCause" value={formData.incidentCause} onChange={handleInputChange} rows="2" className={inputClass}></textarea></FormField>
                            <FormField label="Immediate Action Taken (Optional)"><textarea name="immediateAction" value={formData.immediateAction} onChange={handleInputChange} rows="2" className={inputClass}></textarea></FormField>
                            <FormField label="Upload Photos"><label className="cursor-pointer bg-light-secondary hover:bg-light-secondary/90 text-white font-semibold px-3 py-2 rounded-md text-sm flex items-center gap-2 w-max"><Upload size={14} /><span>Choose Files</span><input type="file" multiple onChange={handlePhotoUpload} className="hidden" accept="image/*" /></label></FormField>
                            {formData.photos.length > 0 && <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">{formData.photos.map((photo, index) => (<div key={index} className="relative"><img src={photo.url} alt={photo.name} className="w-full h-20 object-cover rounded-md" /><button onClick={() => removePhoto(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button></div>))}</div>}
                        </div>

                        <div className="mt-6 text-right border-t pt-4"><button type="submit" className="bg-light-primary hover:bg-light-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md flex items-center gap-2 float-right text-sm"><ChevronRight size={16} /><span>Next: Preview</span></button></div>
                    </form>
                )}
                {step === 2 && (<div><h3 className="text-lg font-semibold mb-4 text-center">Preview Report</h3><div className="border border-slate-200 dark:border-slate-600 rounded-lg"><IncidentReportPDF incident={formData} isPreview={true} /></div><div className="mt-6 flex justify-between"><button onClick={() => setStep(1)} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 font-semibold px-4 py-2 rounded-md text-sm">Back to Edit</button><button onClick={handleSubmit} className="bg-light-primary hover:bg-light-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm"><FileText size={16} /><span>Submit Report</span></button></div></div>)}
                {step === 3 && newIncident && (<div className="text-center py-8"><CheckCircle className="mx-auto text-green-500 mb-4" size={48} /><h3 className="text-xl font-semibold mb-2">Report Submitted!</h3><p className="text-light-subtle-text dark:text-dark-subtle-text mb-4">Incident ID:</p><p className="text-base font-mono bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-md mb-6">{newIncident.id}</p><div className="flex justify-center gap-4"><button onClick={downloadPDF} className="bg-light-secondary hover:bg-light-secondary/90 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm"><Download size={16} /><span>Download PDF</span></button></div></div>)}
            </div>
            <div ref={pdfRef} className="fixed -left-[9999px] top-0"><IncidentReportPDF incident={newIncident || formData} /></div>
        </div>
    );
};

export default ReportIncidentPage;
