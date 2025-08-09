import React from 'react';
import { format } from 'date-fns';

const IncidentReportPDF = ({ incident, isPreview = false }) => {
    const submissionDate = format(new Date(), 'PPP p');
    
    const DetailItem = ({ label, value, fullWidth = false }) => (
        <div className={fullWidth ? 'col-span-2' : ''}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-slate-800 break-words">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className={`bg-white text-slate-800 p-6 font-sans ${isPreview ? '' : 'w-[210mm] min-h-[297mm]'}`}>
            <div className="flex justify-between items-start pb-3 border-b-2 border-slate-700 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Incident Report</h1>
                    <p className="text-xs text-slate-500">Confidential | For Internal Use Only</p>
                </div>
                <div className="text-right flex-shrink-0 pl-4">
                    <p className="font-mono bg-slate-100 px-2 py-1 rounded text-base text-slate-700">{incident.id || 'N/A'}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 border-b border-slate-200 pb-4">
                <DetailItem label="Date of Incident" value={format(new Date(incident.date), 'PPP')} />
                <DetailItem label="Time of Incident" value={incident.time} />
                <DetailItem label="Mine" value={incident.mine} />
                <DetailItem label="Section" value={incident.sectionName === 'Other' ? incident.otherSection : incident.sectionName} />
                <DetailItem label="Incident Type" value={incident.type} />
                <DetailItem label="Reported By" value={incident.reporterName} />
                <DetailItem label="Specific Location" value={incident.location} fullWidth={true} />
            </div>

            <div className="space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-1 mb-2">Description of Incident</h2>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{incident.description}</p>
                </div>

                {incident.incidentCause && (
                     <div>
                        <h2 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-1 mb-2">Cause of Incident</h2>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{incident.incidentCause}</p>
                    </div>
                )}

                {incident.immediateAction && (
                     <div>
                        <h2 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-1 mb-2">Immediate Action Taken</h2>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{incident.immediateAction}</p>
                    </div>
                )}

                {incident.victims && incident.victims.length > 0 && (
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-1 mb-2">Victim Details</h2>
                        {incident.victims.map((v, i) => (
                            <div key={i} className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm p-2 mb-2 bg-slate-50 rounded-md border border-slate-200">
                                <p><span className="font-semibold">Name:</span> {v.name}</p>
                                <p><span className="font-semibold">Category:</span> {v.category}</p>
                                {v.category === 'Regular' ? (
                                    <p><span className="font-semibold">Form B:</span> {v.formB}</p>
                                ) : (
                                    <>
                                        <p><span className="font-semibold">Contractor:</span> {v.contractorName}</p>
                                        <p><span className="font-semibold">PO No:</span> {v.poNumber}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {incident.photos && incident.photos.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold text-slate-600 border-b border-slate-300 pb-1 mb-2">Attached Photos</h2>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {incident.photos.map((photo, index) => (
                                <div key={index} style={{ pageBreakInside: 'avoid' }}>
                                    <img src={photo.url} alt={`Attachment ${index + 1}`} className="w-full h-auto border rounded" style={{maxWidth: '100%'}} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center text-xs text-slate-400 pt-4 mt-6 border-t">
                <p>Report Submitted: {submissionDate}</p>
            </div>
        </div>
    );
};

export default IncidentReportPDF;
