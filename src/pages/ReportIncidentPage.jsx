import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronRight, FileText, Download, Edit, CheckCircle, Upload, X } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportIncidentPage = () => {
    const { user, MINES, SECTIONS, INCIDENT_TYPES, addIncident, currentDate } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        reporterName: user.fullName,
        mine: MINES[0],
        sectionName: SECTIONS[0],
        otherSection: '',
        date: new Date(currentDate).toISOString().split('T')[0],
        time: new Date(currentDate).toTimeString().slice(0, 5),
        type: INCIDENT_TYPES[0],
        location: '',
        description: '',
        victimDetails: '',
        photos: [],
    });
    const [newIncident, setNewIncident] = useState(null);
    const [isEditActive, setIsEditActive] = useState(false);
    const pdfRef = useRef();

    // This state is to fix the input focus bug.
    // We hold the input value here while typing.
    const [inputValue, setInputValue] = useState({
        location: '',
        description: '',
        victimDetails: '',
        otherSection: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Update the temporary state first
        setInputValue(prev => ({ ...prev, [name]: value }));
        // Then update the main form data
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const photoPreviews = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...photoPreviews] }));
    };

    const removePhoto = (index) => {
        const updatedPhotos = [...formData.photos];
        URL.revokeObjectURL(updatedPhotos[index].url); // Clean up memory
        updatedPhotos.splice(index, 1);
        setFormData(prev => ({ ...prev, photos: updatedPhotos }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            const finalData = { ...formData };
            if (formData.sectionName === 'Other') {
                finalData.sectionName = formData.otherSection;
            }
            const createdIncident = addIncident(finalData);
            setNewIncident(createdIncident);
            setIsEditActive(true);
            setTimeout(() => setIsEditActive(false), 10 * 60 * 1000); // 10 minutes
            setStep(3);
        }
    };

    const downloadPDF = async () => {
        const pdfContainer = pdfRef.current;
        if (!pdfContainer) return;
    
        // Temporarily make it visible for rendering
        pdfContainer.style.display = 'block';
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.top = '-9999px';

        const canvas = await html2canvas(pdfContainer, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const imgHeightOnPdf = pdfWidth / ratio;
        
        let heightLeft = imgHeightOnPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeightOnPdf;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;
        }

        pdf.save(`Incident-Report-${newIncident.id}.pdf`);

        // Hide it again
        pdfContainer.style.display = 'none';
        pdfContainer.style.position = 'static';
    };

    const handleEdit = () => {
        setStep(1);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold mb-2 text-light-text dark:text-dark-text">Report New Incident</h1>
            <p className="text-light-subtle-text dark:text-dark-subtle-text mb-6">Follow the steps to submit your report.</p>

            {/* Stepper */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${step >= 1 ? 'text-light-primary dark:text-dark-primary' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-light-primary dark:border-dark-primary' : ''}`}>{step > 1 ? <CheckCircle size={20}/> : '1'}</div>
                    <span className="ml-2 font-semibold">Fill Details</span>
                </div>
                <ChevronRight className="mx-4 text-light-subtle-text dark:text-dark-subtle-text" />
                <div className={`flex items-center ${step >= 2 ? 'text-light-primary dark:text-dark-primary' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-light-primary dark:border-dark-primary' : ''}`}>{step > 2 ? <CheckCircle size={20}/> : '2'}</div>
                    <span className="ml-2 font-semibold">Preview</span>
                </div>
                <ChevronRight className="mx-4 text-light-subtle-text dark:text-dark-subtle-text" />
                <div className={`flex items-center ${step >= 3 ? 'text-light-primary dark:text-dark-primary' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-light-primary dark:border-dark-primary' : ''}`}><CheckCircle size={20}/></div>
                    <span className="ml-2 font-semibold">Confirmation</span>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-8 rounded-lg shadow-md">
                {step === 1 && (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {/* Column 1 */}
                            <div>
                                <label className="block text-sm font-semibold mb-1">Reporter Name</label>
                                <input type="text" value={formData.reporterName} readOnly className="w-full bg-slate-200 dark:bg-slate-800 p-2 rounded-md cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Mine</label>
                                <select name="mine" value={formData.mine} onChange={handleSelectChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600">
                                    {MINES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Section</label>
                                <select name="sectionName" value={formData.sectionName} onChange={handleSelectChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600">
                                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {formData.sectionName === 'Other' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Other Section Name</label>
                                    <input type="text" name="otherSection" value={inputValue.otherSection} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600" required />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-1">Date of Incident</label>
                                <input type="date" name="date" value={formData.date} onChange={handleSelectChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Time of Incident</label>
                                <input type="time" name="time" value={formData.time} onChange={handleSelectChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Incident Type</label>
                                <select name="type" value={formData.type} onChange={handleSelectChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600">
                                    {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">Location of Incident</label>
                                <input type="text" name="location" value={inputValue.location} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600" required />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">Brief Description</label>
                                <textarea name="description" value={inputValue.description} onChange={handleInputChange} rows="4" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600" required></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">Victim Details (if any)</label>
                                <textarea name="victimDetails" value={inputValue.victimDetails} onChange={handleInputChange} rows="3" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">Upload Photos</label>
                                <div className="flex items-center">
                                    <label className="cursor-pointer bg-light-secondary hover:bg-light-secondary/90 text-white font-semibold px-4 py-2 rounded-md transition-colors flex items-center gap-2">
                                        <Upload size={16} />
                                        <span>Choose Files</span>
                                        <input type="file" multiple onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                    </label>
                                </div>
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {formData.photos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img src={photo.url} alt={photo.name} className="w-full h-24 object-cover rounded-md" />
                                            <button onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                                <X size={14} />
                                            </button>
                                            <p className="text-xs truncate mt-1">{photo.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-right">
                            <button type="submit" className="bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white dark:text-slate-900 font-semibold px-6 py-2 rounded-md transition-colors flex items-center gap-2 float-right">
                                <span>Next: Preview</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Preview Incident Report</h3>
                        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
                            <IncidentReportPDF incident={formData} isPreview={true} />
                        </div>
                        <div className="mt-8 flex justify-between">
                            <button onClick={() => setStep(1)} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-light-text dark:text-dark-text font-semibold px-6 py-2 rounded-md transition-colors">
                                Back to Edit
                            </button>
                            <button onClick={handleSubmit} className="bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white dark:text-slate-900 font-semibold px-6 py-2 rounded-md transition-colors flex items-center gap-2">
                                <FileText size={18} />
                                <span>Submit Report</span>
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && newIncident && (
                    <div className="text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                        <h3 className="text-2xl font-semibold mb-2">Report Submitted Successfully!</h3>
                        <p className="text-light-subtle-text dark:text-dark-subtle-text mb-4">Your incident has been logged with the following ID:</p>
                        <p className="text-lg font-mono bg-slate-100 dark:bg-slate-800 inline-block px-4 py-2 rounded-md mb-8">{newIncident.id}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={downloadPDF} className="bg-light-secondary hover:bg-light-secondary/90 text-white font-semibold px-4 py-2 rounded-md transition-colors flex items-center gap-2">
                                <Download size={18} />
                                <span>Download PDF</span>
                            </button>
                            <button onClick={handleEdit} disabled={!isEditActive} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-light-text dark:text-dark-text font-semibold px-4 py-2 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Edit size={18} />
                                <span>Edit Report {isEditActive ? '(10m timer)' : ''}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Hidden container for PDF generation */}
            <div ref={pdfRef} style={{ display: 'none' }}>
                {newIncident && <IncidentReportPDF incident={newIncident} />}
            </div>
        </div>
    );
};

export default ReportIncidentPage;
