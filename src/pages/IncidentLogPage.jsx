import React from 'react';
import { format } from 'date-fns';

const IncidentReportPDF = ({ incident, isPreview = false }) => {
    // ... (DetailItem component and header remain the same) ...

    return (
        <div className={`bg-white text-slate-800 p-6 font-sans ${isPreview ? '' : 'w-[210mm] min-h-[297mm]'}`}>
            {/* ... (Header and Meta Info sections are the same) ... */}

            <div className="space-y-4">
                {/* ... (Description, Cause, Action sections) ... */}

                {/* Updated Victims Section */}
                {incident.victims && incident.victims.length > 0 && (
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-sm font-bold text-slate-600 border-b pb-1 mb-2">Victim Details</h2>
                        {incident.victims.map((v, i) => (
                            <div key={i} className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm p-2 mb-2 bg-slate-50 rounded">
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

                {/* Updated Photos Section */}
                {incident.photos && incident.photos.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold text-slate-600 border-b pb-1 mb-2">Attached Photos</h2>
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

            {/* ... (Footer remains the same) ... */}
        </div>
    );
};

export default IncidentReportPDF;
