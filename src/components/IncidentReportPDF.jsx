import React from 'react';
import { format, parseISO } from 'date-fns';
import { formatDate } from '../utils/formatters';

const ReportSection = ({ title, children }) => (
    <div className="mb-4 break-inside-avoid">
        <h2 className="text-sm font-bold bg-slate-200 p-1 mb-2">{title}</h2>
        <div className="px-1 text-xs space-y-2">
            {children}
        </div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className="flex">
        <p className="w-1/3 font-semibold text-slate-600">{label}:</p>
        <p className="w-2/3">{value || 'N/A'}</p>
    </div>
);

const IncidentReportPDF = ({ incident, isPreview = false, includeHistory = false }) => {
    if (!incident) return null;

    // Use the creation timestamp from history for the "Reported on" date
    const creationRecord = incident.history ? incident.history[0] : null;
    const reportedDate = creationRecord ? parseISO(creationRecord.timestamp) : new Date();

    // Dynamically find other details that are not empty and should be displayed
    const otherDetailsToExclude = [
        'id', 'docId', 'createdAt', 'history', 'comments', 'photos', 
        'victims', 'daysLost', 'isDemo', 'status', 'reporterName', 
        'mine', 'sectionName', 'date', 'time', 'type', 'reason', 
        'location', 'description', 'incidentCause', 'immediateAction'
    ];

    const otherDetails = Object.entries(incident).filter(([key, value]) => 
        !otherDetailsToExclude.includes(key) && value
    ).map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        return { label, value };
    });

    return (
        <div className="bg-white text-black p-6 font-sans">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Incident Report</h1>
                <p className="text-sm">{incident.id}</p>
            </div>

            <div className="text-xs text-slate-600 mb-4 text-right">
                <p>
                    <span className="font-semibold">Reported by:</span> {incident.reporterName}
                </p>
                <p>
                    <span className="font-semibold">on</span> {format(reportedDate, 'dd/MM/yyyy, hh:mm a')}
                </p>
            </div>

            <ReportSection title="Incident Details">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <DetailRow label="Mine" value={incident.mine} />
                    <DetailRow label="Section" value={incident.sectionName} />
                    <DetailRow label="Date of Incident" value={formatDate(incident.date)} />
                    <DetailRow label="Time of Incident" value={incident.time} />
                    <DetailRow label="Incident Type" value={incident.type} />
                    <DetailRow label="Reason" value={incident.reason} />
                </div>
                <div className="mt-2">
                    <DetailRow label="Location" value={incident.location} />
                </div>
                <div className="mt-2">
                    <p className="font-semibold text-slate-600">Description:</p>
                    <p className="whitespace-pre-wrap">{incident.description}</p>
                </div>
            </ReportSection>

            {incident.victims && incident.victims.length > 0 && (
                <ReportSection title="Involved Person(s)">
                    {incident.victims.map((victim, index) => (
                        <div key={index} className="grid grid-cols-2 gap-x-4 gap-y-1 py-1 border-b last:border-b-0">
                            <DetailRow label="Name" value={victim.name} />
                            <DetailRow label="Age" value={victim.age} />
                            <DetailRow label="Category" value={victim.category} />
                            <DetailRow label="Form B No." value={victim.formB} />
                            {victim.category === 'Contractual' && (
                                <>
                                    <DetailRow label="Contractor" value={victim.contractorName} />
                                    <DetailRow label="PO No." value={victim.poNumber} />
                                </>
                            )}
                        </div>
                    ))}
                </ReportSection>
            )}

            <ReportSection title="Outcome & Actions">
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <DetailRow label="Status" value={incident.status} />
                    <DetailRow label="Days Lost" value={incident.daysLost?.toString() || '0'} />
                 </div>
                 {incident.incidentCause && (
                    <div className="mt-2">
                        <p className="font-semibold text-slate-600">Cause of Incident:</p>
                        <p className="whitespace-pre-wrap">{incident.incidentCause}</p>
                    </div>
                 )}
                 {incident.immediateAction && (
                    <div className="mt-2">
                        <p className="font-semibold text-slate-600">Immediate Action Taken:</p>
                        <p className="whitespace-pre-wrap">{incident.immediateAction}</p>
                    </div>
                 )}
                 {otherDetails.map(({ label, value }) => (
                    <div key={label} className="mt-2">
                        <p className="font-semibold text-slate-600">{label}:</p>
                        <p className="whitespace-pre-wrap">{value}</p>
                    </div>
                 ))}
            </ReportSection>

            {incident.comments && incident.comments.length > 0 && (
                 <ReportSection title="Comments Log">
                    {incident.comments.map((comment, index) => (
                        <div key={index} className="border-b last:border-b-0 py-1">
                            <p className="whitespace-pre-wrap">{comment.text}</p>
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex flex-wrap gap-1">
                                    {comment.tags && comment.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full font-semibold">{tag}</span>
                                    ))}
                                </div>
                                <p className="text-slate-500 text-[10px]">- {comment.user} on {format(parseISO(comment.timestamp), 'dd/MM/yyyy, hh:mm a')}</p>
                            </div>
                        </div>
                    ))}
                </ReportSection>
            )}
            
            {includeHistory && incident.history && incident.history.length > 0 && (
                 <ReportSection title="Incident History">
                    <ul className="list-disc list-inside space-y-1">
                        {incident.history.map((item, index) => (
                            <li key={index}>
                                <span className="font-semibold">{item.action}</span> by {item.user} on {format(parseISO(item.timestamp), 'dd/MM/yyyy, hh:mm a')}
                            </li>
                        ))}
                    </ul>
                </ReportSection>
            )}
            
        </div>
    );
};

export default IncidentReportPDF;