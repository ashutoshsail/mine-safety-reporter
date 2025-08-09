import { subDays, format } from 'date-fns';

export const MINES = ["DMM", "JMM", "RMM", "DIOM", "Mahamaya", "Kalwar", "Rowghat", "Nandini", "Hirri", "Koteshwar"];
export const SECTIONS = ["Quarry", "HEME", "EMM", "Civil", "Mechanical", "Electrical", "MSDS", "Plant", "Crusher", "Tipper Garage", "Other"];
export const INCIDENT_TYPES = ['First Aid', 'Reportable', 'Lost Time Injury (LTI)', 'Fatality', 'Near Miss', 'High Potential Incident'];

const reporters = ["Rakesh Sharma", "Sunita Williams", "Kalpana Chawla", "Vikram Sarabhai", "Homi Bhabha"];
const locations = ["Main Haul Road", "Workshop Bay 3", "Processing Plant Sector A", "Mine Face 7", "Conveyor Belt Junction", "Substation 2"];
const descriptions = [
    "Minor slip and fall on a wet surface near the wash plant. Employee reported slight ankle pain.",
    "A hydraulic hose on excavator EX-102 burst during operation, spraying fluid. No injuries reported.",
    "Employee reported feeling a sharp pain in their back while manually lifting a heavy component.",
    "A truck driver reported a near miss with a light vehicle that failed to yield at an intersection.",
    "During routine inspection, a frayed wire was discovered on the primary crusher's motor.",
    "A small rockfall occurred from the highwall in Quarry B. The area was immediately cordoned off.",
    "Employee received a small cut on their hand while handling a metal sheet. First aid was administered on site."
];
const victimDetails = [
    "Victim: John Doe, Contractor. Sustained a minor abrasion on the left forearm. Returned to work after first aid.",
    "Victim: Jane Smith, Operator. Complained of dust inhalation. Sent for medical observation as a precaution.",
    "Victim: Anand Kumar, Electrician. Experienced a mild electric shock from a faulty hand tool. No visible injuries.",
    "Not applicable, property damage only. The front bumper of the light vehicle was dented.",
    "Not applicable, equipment failure."
];

let incidentCounter = 481;

export const generateIncidentId = (mine, type, date) => {
    const typeAcronyms = {
        'First Aid': 'FA',
        'Reportable': 'REP',
        'Lost Time Injury (LTI)': 'LTI',
        'Fatality': 'FAT',
        'Near Miss': 'NM',
        'High Potential Incident': 'HPI'
    };
    const acronym = typeAcronyms[type] || 'GEN';
    const dateStr = format(date, 'yyyyMMdd');
    incidentCounter++;
    return `${mine}-${acronym}-${dateStr}-${incidentCounter}`;
};

const createRandomIncident = (referenceDate, daysAgo) => {
    const incidentDate = subDays(referenceDate, daysAgo);
    const mine = MINES[Math.floor(Math.random() * MINES.length)];
    const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
    
    return {
        id: generateIncidentId(mine, type, incidentDate),
        reporterName: reporters[Math.floor(Math.random() * reporters.length)],
        mine: mine,
        sectionName: SECTIONS[Math.floor(Math.random() * (SECTIONS.length -1))],
        date: format(incidentDate, 'yyyy-MM-dd'),
        time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        type: type,
        location: locations[Math.floor(Math.random() * locations.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        victims: [],
        status: Math.random() > 0.3 ? 'Closed' : 'Open',
        mandaysLost: type === 'Lost Time Injury (LTI)' ? Math.floor(Math.random() * 30) : null,
        photos: [],
        comments: Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
            user: reporters[Math.floor(Math.random() * reporters.length)],
            text: "Following up on this. Corrective actions have been implemented.",
            timestamp: subDays(new Date(), Math.floor(Math.random() * daysAgo)).toISOString()
        })),
        history: [
            { user: "Rakesh Sharma", action: "Created Report", timestamp: incidentDate.toISOString() },
            { user: "Sunita Williams", action: "Updated status to Closed", timestamp: subDays(new Date(), Math.floor(Math.random() * (daysAgo -1))).toISOString() }
        ]
    };
};

const fixedReferenceDate = new Date('2025-08-05T10:00:00Z');
export const mockIncidents = Array.from({ length: 250 }, (_, i) => 
    createRandomIncident(fixedReferenceDate, Math.floor(Math.random() * 365))
).sort((a, b) => new Date(b.date) - new Date(a.date));

const lastLtiIndex = mockIncidents.findIndex(inc => inc.type === 'Lost Time Injury (LTI)');
if (lastLtiIndex !== -1) {
    mockIncidents[lastLtiIndex].date = format(subDays(fixedReferenceDate, 15), 'yyyy-MM-dd');
} else {
    const ltiIncident = createRandomIncident(fixedReferenceDate, 15);
    ltiIncident.type = 'Lost Time Injury (LTI)';
    mockIncidents.push(ltiIncident);
}
