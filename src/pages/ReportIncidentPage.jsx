import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronRight, FileText, Download, Edit, CheckCircle, Upload, X, UserPlus, Trash2, Check } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportIncidentPage = () => {
    const { user, MINES, SECTIONS, INCIDENT_TYPES, addIncident, currentDate } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const initialVictimState = { name: '', category: 'Regular', formB: '', contractorName: '', poNumber: '' };
    const [currentVictim, setCurrentVictim] = useState(initialVictimState);
    const [victimFeedback, setVictimFeedback] = useState(false);
    const [formData, setFormData] = useState({
        reporterName: user.name,
        mine: MINES[0],
        sectionName: SECTIONS[0],
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

    const isVictimInfoRequired = ['Lost Time Injury (LTI)', 'Fatality', 'Reportable'].includes(formData.type);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
            const createdIncident = await addIncident(formData);
            setNewIncident(createdIncident);
            setStep(3);
        }
    };
    
    // ... (downloadPDF and photo handling functions remain the same) ...
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

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Report New Incident</h1>
            <div className="bg-light-card dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md">
                {step === 1 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* ... (Basic incident details form fields) ... */}
                        </div>

                        {/* Victim Details Section */}
                        {isVictimInfoRequired && (
                            <div className="col-span-2 border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-2">Victim Details (Required)</h3>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <input name="name" value={currentVictim.name} onChange={handleVictimChange} placeholder="Victim's Name" className="col-span-2 ..." />
                                        <select name="category" value={currentVictim.category} onChange={handleVictimChange} className="...">
                                            <option>Regular</option>
                                            <option>Contractual</option>
                                        </select>
                                        {currentVictim.category === 'Regular' ? (
                                            <input name="formB" value={currentVictim.formB} onChange={handleVictimChange} placeholder="Form B No." className="..." />
                                        ) : (
                                            <>
                                                <input name="contractorName" value={currentVictim.contractorName} onChange={handleVictimChange} placeholder="Contractor's Name" className="..." />
                                                <input name="poNumber" value={currentVictim.poNumber} onChange={handleVictimChange} placeholder="PO No." className="..." />
                                            </>
                                        )}
                                    </div>
                                    <button type="button" onClick={handleAddVictim} className="flex items-center gap-2 text-sm bg-light-accent text-white px-3 py-1.5 rounded-md">
                                        {victimFeedback ? <><Check size={16}/> Victim Added</> : <><UserPlus size={16}/> Add Victim</>}
                                    </button>
                                </div>
                                {formData.victims.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 mt-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm">
                                        <span>{v.name} ({v.category})</span>
                                        <button type="button" onClick={() => removeVictim(i)}><Trash2 size={14} className="text-red-500"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* ... (Other optional fields and photo upload) ... */}

                        <div className="mt-6 text-right"><button type="submit" className="...">Next: Preview</button></div>
                    </form>
                )}
                {/* ... (Step 2 and 3 remain structurally similar) ... */}
            </div>
            <div ref={pdfRef} className="fixed -left-[9999px] top-0"><IncidentReportPDF incident={newIncident || formData} /></div>
        </div>
    );
};

export default ReportIncidentPage;
