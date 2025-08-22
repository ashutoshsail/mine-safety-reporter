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

    const sectionHeaderClass = isPreview ? 'text-lg font-bold text-slate-800' : 'border-b-2 border-slate-800 pb-1 mb-2 font-bold text-slate-800';
    const sectionBodyClass = isPreview ? 'mt-2' : 'pt-1';
    
    return (
        <div className={`bg-white text-slate-800 p-8 font-sans text-sm ${isPreview ? 'h-full w-full' : 'w-[210mm] min-h-[297mm]'}`}>
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Incident Report</h1>
                    <p className="text-slate-600">Confidential | For Internal Use Only</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">Incident ID:</p>
                    <p className="font-mono bg-slate-100 inline-block px-2 py-1 rounded-md">{incident.id || 'N/A'}</p>
                </div>
            </div>

            <ReportSection title="Incident Details">
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <DetailRow label="Date" value={incident.date ? formatDate(incident.date) : ''} />
                    <DetailRow label="Time" value={incident.time} />
                    <DetailRow label="Mine" value={incident.mine} />
                    <DetailRow label="Section" value={incident.section} />
                    <DetailRow label="Type" value={incident.type} />
                    <DetailRow label="Reporter" value={incident.reporterName} />
                    <div className="col-span-2">
                        <p className="font-semibold text-slate-600">Location:</p>
                        <p>{incident.location || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="font-semibold text-slate-600">Description:</p>
                        <p className="whitespace-pre-wrap">{incident.description || 'N/A'}</p>
                    </div>
                </div>
            </ReportSection>
            
            {incident.victims && incident.victims.length > 0 && (
                <ReportSection title="Involved Person(s)">
                    <div className="space-y-2">
                        {incident.victims.map((victim, index) => (
                            <div key={index} className="border-l-2 border-slate-300 pl-2">
                                <p><strong>Name:</strong> {victim.name}</p>
                                <p><strong>Category:</strong> {victim.category}</p>
                                <p><strong>Injury:</strong> {victim.natureOfInjury}</p>
                                <p><strong>Designation:</strong> {victim.designation || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                </ReportSection>
            )}

            {incident.enquiryReport && (incident.enquiryReport.rootCause || incident.enquiryReport.actionTaken || incident.enquiryReport.measuresSuggested || incident.enquiryReport.responsibility) && (
                <ReportSection title="Enquiry Report">
                    <p><strong>Root Cause:</strong> {incident.enquiryReport.rootCause || 'N/A'}</p>
                    <p><strong>Action Taken:</strong> {incident.enquiryReport.actionTaken || 'N/A'}</p>
                    <p><strong>Measures Suggested:</strong> {incident.enquiryReport.measuresSuggested || 'N/A'}</p>
                    <p><strong>Responsibility:</strong> {incident.enquiryReport.responsibility || 'N/A'}</p>
                </ReportSection>
            )}
            
            {incident.comments && incident.comments.length > 0 && (
                <ReportSection title="Comments">
                    <ul className="list-disc list-inside space-y-1">
                        {incident.comments.map((comment, index) => (
                            <li key={index}>
                                <span className="font-semibold">{comment.text}</span> by {comment.user} on {format(parseISO(comment.timestamp), 'dd/MM/yyyy, hh:mm a')}
                            </li>
                        ))}
                    </ul>
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
