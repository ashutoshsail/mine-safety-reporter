import { subDays, format } from 'date-fns';

// These lists are no longer exported, as the app now gets this data from Firestore.
const REPORTERS = ["Rakesh Sharma", "Sunita Williams", "Kalpana Chawla", "Vikram Sarabhai", "Homi Bhabha"];
const LOCATIONS = ["Main Haul Road", "Workshop Bay 3", "Processing Plant Sector A", "Mine Face 7", "Conveyor Belt Junction", "Substation 2"];
const DESCRIPTIONS = [
    "Minor slip and fall on a wet surface near the wash plant.",
    "A hydraulic hose on excavator EX-102 burst during operation.",
    "Employee reported feeling a sharp pain in their back while manually lifting.",
    "A truck driver reported a near miss with a light vehicle.",
    "During routine inspection, a frayed wire was discovered on a motor.",
    "A small rockfall occurred from the highwall in Quarry B.",
    "Employee received a small cut on their hand while handling a metal sheet."
];

let incidentCounter = 1000;

export const generateIncidentId = (mine, type, date) => {
    const acronym = type.split(' ').map(word => word[0]).join('').toUpperCase();
    const dateStr = format(date, 'yyyyMMdd');
    incidentCounter++;
    return `${mine}-${acronym}-${dateStr}-${incidentCounter}`;
};

// This function now receives the live config from the Admin Panel
const createIncident = (type, mine, section, referenceDate) => {
    const incidentDate = subDays(referenceDate, Math.floor(Math.random() * 365));
    
    return {
        id: generateIncidentId(mine, type, incidentDate),
        reporterName: "Demo User",
        mine: mine,
        sectionName: section,
        date: format(incidentDate, 'yyyy-MM-dd'),
        time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        type: type,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
        victims: [],
        status: Math.random() > 0.3 ? 'Closed' : 'Open',
        mandaysLost: type.toLowerCase().includes('lost') ? Math.floor(Math.random() * 30) : null,
        photos: [],
        comments: [],
        history: [{ user: "System", action: "Created Demo Report", timestamp: incidentDate.toISOString() }],
        createdAt: incidentDate,
    };
};

export const generateMockData = (liveConfigs) => {
    const referenceDate = new Date();
    let incidents = [];
    const { mines, sections, incidentTypes } = liveConfigs;

    if (!mines || mines.length === 0 || !sections || sections.length === 0 || !incidentTypes || incidentTypes.length === 0) {
        return [];
    }

    // Generate 250 incidents, distributed across the available types
    for (let i = 0; i < 250; i++) {
        const type = incidentTypes[i % incidentTypes.length];
        const mine = mines[i % mines.length];
        const section = sections[i % sections.length];
        incidents.push(createIncident(type, mine, section, referenceDate));
    }
    
    return incidents;
};
