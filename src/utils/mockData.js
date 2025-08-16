import { subDays, format, subMonths, startOfMonth, addDays } from 'date-fns';

const VICTIM_NAMES = ["Ramesh Kumar", "Suresh Patel", "Anita Desai", "Vijay Singh", "Priya Sharma"];
const CONTRACTOR_NAMES = ["Excel Mining Co.", "Rockdrill Services", "Heavy Earthmovers Ltd."];
const LOCATIONS = ["Main Haul Road", "Workshop Bay 3", "Processing Plant Sector A", "Mine Face 7", "Conveyor Belt Junction"];
const DESCRIPTIONS = [
    "Minor slip and fall on a wet surface near the wash plant.",
    "A hydraulic hose on excavator EX-102 burst during operation.",
    "Employee reported feeling a sharp pain in their back while manually lifting.",
    "A truck driver reported a near miss with a light vehicle.",
    "During routine inspection, a frayed wire was discovered on a motor."
];

let incidentCounter = 1000;

export const generateIncidentId = (mine, type, date) => {
    const acronym = type.split(' ').map(word => word[0]).join('').toUpperCase();
    const dateStr = format(date, 'yyyyMMdd');
    incidentCounter++;
    return `${mine}-${acronym}-${dateStr}-${incidentCounter}`;
};

const createIncident = (type, mine, section, referenceDate) => {
    const incidentDate = subDays(referenceDate, Math.floor(Math.random() * 730));
    const lowerCaseType = type.toLowerCase();
    const isInjuryIncident = !lowerCaseType.includes('near miss') && !lowerCaseType.includes('high potential');
    const status = Math.random() > 0.3 ? 'Closed' : 'Open';
    
    // MODIFIED: This block now runs for EVERY incident, ensuring victims are always present.
    let victims = [];
    const victimCategory = Math.random() > 0.5 ? 'Regular' : 'Contractual';
    victims.push({
        name: VICTIM_NAMES[Math.floor(Math.random() * VICTIM_NAMES.length)],
        age: isInjuryIncident ? Math.floor(Math.random() * 40) + 22 : '', // Age is only relevant for injuries
        category: victimCategory,
        formB: `FB-${Math.floor(Math.random() * 900) + 100}`,
        contractorName: victimCategory === 'Contractual' ? CONTRACTOR_NAMES[Math.floor(Math.random() * CONTRACTOR_NAMES.length)] : '',
        poNumber: victimCategory === 'Contractual' ? `PO-${Math.floor(Math.random() * 9000) + 1000}` : '',
    });

    // DaysLost are still only calculated for actual injuries.
    let daysLost = 0;
    if (isInjuryIncident) {
        daysLost = Math.floor(Math.random() * 45) + 1;
    }
    if (lowerCaseType.includes('fatality')) {
        daysLost = 6000;
    }

    let comments = [];
    if (status === 'Closed') {
        comments.push({
            user: "System",
            text: "Investigation complete. Root cause identified and corrective actions implemented. Case closed.",
            timestamp: addDays(incidentDate, daysLost > 5 ? 5 : daysLost).toISOString(),
            tags: ["Action Taken", "Enquiry Report"]
        });
    }

    return {
        id: generateIncidentId(mine, type, incidentDate),
        reporterName: "Demo User",
        mine: mine,
        sectionName: section,
        date: format(incidentDate, 'yyyy-MM-dd'),
        time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        type: type,
        reason: Math.random() > 0.5 ? 'Unsafe Act' : 'Unsafe Condition',
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
        victims: victims,
        status: status,
        daysLost: daysLost,
        photos: [],
        comments: comments,
        history: [{ user: "System", action: "Created Demo Report", timestamp: incidentDate.toISOString() }],
        createdAt: incidentDate,
    };
};

const generateHoursWorked = (mines, referenceDate) => {
    const hoursData = {};
    mines.forEach(mine => {
        hoursData[mine] = {};
        for (let i = 0; i < 24; i++) {
            const monthDate = subMonths(startOfMonth(referenceDate), i);
            const monthKey = format(monthDate, 'yyyy-MM');
            const baseHours = 45000;
            const variance = (Math.random() - 0.5) * 10000;
            hoursData[mine][monthKey] = Math.round(baseHours + variance);
        }
    });
    return hoursData;
};

export const generateMockData = (liveConfigs) => {
    const referenceDate = new Date();
    let incidents = [];
    const { mines, sections, incidentTypes } = liveConfigs;

    if (!mines || mines.length === 0 || !sections || sections.length === 0 || !incidentTypes || incidentTypes.length === 0) {
        return { incidents: [], hoursWorked: {} };
    }

    for (let i = 0; i < 350; i++) {
        const type = incidentTypes[i % incidentTypes.length];
        const mine = mines[i % mines.length];
        const section = sections[i % sections.length];
        incidents.push(createIncident(type, mine, section, referenceDate));
    }

    const hoursWorked = generateHoursWorked(mines, referenceDate);

    return { incidents, hoursWorked };
};