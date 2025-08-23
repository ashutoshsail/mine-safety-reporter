import React, { useState, useContext, useRef, useMemo, useEffect, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import { ConfigContext } from '../context/ConfigContext';
import { ChevronRight, FileText, Download, CheckCircle, Upload, X, UserPlus, Trash2, Check, ExternalLink } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';
import CustomSelect from '../components/CustomSelect';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// This component was moved outside to prevent re-renders causing focus loss.
const FormField = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text mb-1">{label}</label>
        {children}
    </div>
);

const ReportIncidentPage = ({ setRoute }) => {
    const { user, addIncident, mockIncidentForForm, clearMockIncidentForForm } = useContext(DataContext);
    const { minesConfig, sectionsConfig, INCIDENT_TYPES } = useContext(ConfigContext);
    
    const [step, setStep] = useState(1);
    const initialVictimState = { name: '', category: 'Regular', formB: '', contractorName: '', poNumber: '', age: '', designation: '', natureOfInjury: '' };
    const [victims, setVictims] = useState([initialVictimState]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        mine: '',
        section: '',
        location: '',
        type: '',
        description: '',
        reporterName: user.name,
        photos: [],
        enquiryReport: { rootCause: '', actionTaken: '', measuresSuggested: '', responsibility: ''},
        victims: [],
        daysLost: 0,
        closureDate: '',
    });

    const [newIncident, setNewIncident] = useState(null);
    const pdfRef = useRef();

    const activeMines = useMemo(() => minesConfig.filter(m => m.isActive).map(m => m.name), [minesConfig]);
    const activeSections = useMemo(() => sectionsConfig.filter(s => s.isActive).map(s => s.name), [sectionsConfig]);

    const isLTI = useMemo(() => formData.type === 'Lost Time Injury (LTI)', [formData.type]);

    useEffect(() => {
        if (mockIncidentForForm) {
            setFormData(mockIncidentForForm);
            if (mockIncidentForForm.victims && mockIncidentForForm.victims.length > 0) {
                 setVictims(mockIncidentForForm.victims);
            }
            if (mockIncidentForForm.enquiryReport) {
                setFormData(prev => ({ ...prev, enquiryReport: mockIncidentForForm.enquiryReport }));
            }
            setNewIncident(mockIncidentForForm);
            setStep(1);
            clearMockIncidentForForm();
        }
    }, [mockIncidentForForm, clearMockIncidentForForm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVictimChange = (index, e) => {
        const { name, value } = e.target;
        const newVictims = [...victims];
        newVictims[index][name] = value;
        setVictims(newVictims);
    };

    const handleAddVictim = () => {
        setVictims(prev => [...prev, initialVictimState]);
    };

    const handleRemoveVictim = (index) => {
        setVictims(prev => prev.filter((_, i) => i !== index));
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (!formData.mine || !formData.section || !formData.date || !formData.time || !formData.type || !formData.location || !formData.description) {
                alert('Please fill in all required fields.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        }
    };
    
    const handlePrevStep = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        // Final validation
        if (isLTI && victims.length === 0) {
            alert('Victim details are mandatory for Lost Time Injuries.');
            return;
        }

        const finalData = {
            ...formData,
            victims: victims.filter(v => v.name !== ''),
        };
        
        await addIncident(finalData);
        setNewIncident(finalData);
        setStep(3);
    };

    const downloadPDF = async () => {
        const input = pdfRef.current;
        if (input) {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("incident-report.pdf");
        }
    };

    const handlePhotoUpload = (e) => {
        // Handle photo upload logic here
        // For now, we'll just store the filenames in formData
        const files = Array.from(e.target.files).map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
        setFormData(prev => ({ ...prev, photos: files }));
    };
    
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 bg-light-background dark:bg-dark-background rounded-lg shadow-lg">
            {step === 1 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Incident Details</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Incident Date">
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" required />
                            </FormField>
                            <FormField label="Incident Time">
                                <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" required />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Mine Name">
                                <CustomSelect 
                                    name="mine"
                                    value={formData.mine}
                                    onChange={handleChange}
                                    options={activeMines}
                                    placeholder="Select Mine"
                                    required
                                />
                            </FormField>
                            <FormField label="Section">
                                <CustomSelect
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    options={activeSections}
                                    placeholder="Select Section"
                                    required
                                />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Incident Type">
                                <CustomSelect
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    options={INCIDENT_TYPES}
                                    placeholder="Select Incident Type"
                                    required
                                />
                            </FormField>
                            <FormField label="Reporter Name">
                                <input type="text" name="reporterName" value={formData.reporterName} onChange={handleChange} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" required />
                            </FormField>
                        </div>
                        <FormField label="Location of Incident">
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="e.g., Conveyor Belt 3, Quarry Face" required />
                        </FormField>
                        <FormField label="Incident Description">
                             <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="Describe the incident in detail..." required></textarea>
                        </FormField>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleNextStep} className="bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-6 py-2 rounded-md text-sm flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
            
            {step === 2 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Involved Persons & Photos</h3>
                    <div className="space-y-6">
                        
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-light-text dark:text-dark-text">Victim Details</h4>
                                </div>
                                <div className="space-y-4">
                                    {victims.map((victim, index) => (
                                        <div key={index} className="p-4 border dark:border-dark-border rounded-md relative">
                                            {victims.length > 1 && (
                                                <button onClick={() => handleRemoveVictim(index)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded-full">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField label="Name">
                                                    <input type="text" name="name" value={victim.name} onChange={(e) => handleVictimChange(index, e)} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" required />
                                                </FormField>
                                                <FormField label="Category">
                                                    <CustomSelect
                                                        name="category"
                                                        value={victim.category}
                                                        onChange={(e) => handleVictimChange(index, e)}
                                                        options={['Regular', 'Contractual']}
                                                        required
                                                    />
                                                </FormField>
                                                {victim.category === 'Regular' && (
                                                    <FormField label="Employee No.">
                                                        <input type="text" name="employeeNo" value={victim.employeeNo} onChange={(e) => handleVictimChange(index, e)} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                                    </FormField>
                                                )}
                                                {victim.category === 'Contractual' && (
                                                    <>
                                                        <FormField label="Contractor Name">
                                                            <input type="text" name="contractorName" value={victim.contractorName} onChange={(e) => handleVictimChange(index, e)} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                                        </FormField>
                                                        <FormField label="PO Number">
                                                             <input type="text" name="poNumber" value={victim.poNumber} onChange={(e) => handleVictimChange(index, e)} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                                        </FormField>
                                                        <FormField label="Form B No.">
                                                             <input type="text" name="formB" value={victim.formB} onChange={(e) => handleVictimChange(index, e)} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                                        </FormField>
                                                    </>
                                                )}
                                            </div>
                                            <FormField label="Nature of Injury">
                                                <textarea name="natureOfInjury" value={victim.natureOfInjury} onChange={(e) => handleVictimChange(index, e)} rows="2" className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" required></textarea>
                                            </FormField>
                                        </div>
                                    ))}
                                    <button onClick={handleAddVictim} className="flex items-center gap-2 text-sm text-light-primary font-semibold hover:text-light-primary/80">
                                        <UserPlus size={16} /> Add Another Person
                                    </button>
                                </div>
                             </div>
                        
                        <FormField label="Attached Photos">
                            <div className="flex items-center gap-2 p-2 rounded-md border border-dashed dark:border-dark-border">
                                <input type="file" name="photos" multiple onChange={handlePhotoUpload} className="text-sm w-full" accept="image/*" />
                                <Upload size={16} className="text-light-subtle-text flex-shrink-0" />
                            </div>
                            {formData.photos.length > 0 && (
                                <div className="mt-2 text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                    <p>{formData.photos.length} files selected: {formData.photos.map(p => p.name).join(', ')}</p>
                                </div>
                            )}
                        </FormField>
                        <FormField label="Enquiry Report Details (Optional)">
                            <div className="space-y-2 p-2 border dark:border-dark-border rounded-md">
                                <textarea name="rootCause" value={formData.enquiryReport.rootCause} onChange={(e) => setFormData(p => ({ ...p, enquiryReport: { ...p.enquiryReport, rootCause: e.target.value } }))} rows="2" className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="Root Cause of the Accident"></textarea>
                                <textarea name="actionTaken" value={formData.enquiryReport.actionTaken} onChange={(e) => setFormData(p => ({ ...p, enquiryReport: { ...p.enquiryReport, actionTaken: e.target.value } }))} rows="2" className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="Action Taken"></textarea>
                                <textarea name="measuresSuggested" value={formData.enquiryReport.measuresSuggested} onChange={(e) => setFormData(p => ({ ...p, enquiryReport: { ...p.enquiryReport, measuresSuggested: e.target.value } }))} rows="2" className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="Measures Suggested"></textarea>
                                <input type="text" name="responsibility" value={formData.enquiryReport.responsibility} onChange={(e) => setFormData(p => ({ ...p, enquiryReport: { ...p.enquiryReport, responsibility: e.target.value } }))} className="w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" placeholder="Responsibility" />
                            </div>
                        </FormField>
                    </div>
                    <div className="mt-6 flex justify-between">
                        <button onClick={handlePrevStep} className="bg-slate-200 dark:bg-slate-600 font-semibold px-6 py-2 rounded-md text-sm">Previous</button>
                        <button onClick={handleNextStep} className="bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-6 py-2 rounded-md text-sm">Next</button>
                    </div>
                </div>
            )}
            
            {step === 3 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Preview Report</h3>
                    <div className="border border-light-border dark:border-dark-border rounded-lg max-h-[70vh] overflow-y-auto">
                        <IncidentReportPDF incident={newIncident || formData} isPreview={true} />
                    </div>
                    <div className="mt-6 flex justify-between">
                        <button onClick={handlePrevStep} className="bg-slate-200 dark:bg-slate-600 font-semibold px-6 py-2 rounded-md text-sm">Previous</button>
                        <button onClick={handleSubmit} className="bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-6 py-2 rounded-md text-sm flex items-center gap-2">
                            <FileText size={16} /><span>Submit Report</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportIncidentPage;