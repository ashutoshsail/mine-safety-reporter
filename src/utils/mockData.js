import { subDays, format, subMonths, startOfMonth, addDays, eachDayOfInterval, subYears } from 'date-fns';

const VICTIM_NAMES = ["Ramesh Kumar", "Suresh Patel", "Anita Desai", "Vijay Singh", "Priya Sharma", "Rajesh Das", "Gopal Verma", "Kiran Yadav"];
const CONTRACTOR_NAMES = ["Excel Mining Co.", "Rockdrill Services", "Heavy Earthmovers Ltd.", "Secure Logistics Inc."];
const LOCATIONS = ["Main Haul Road", "Workshop Bay 3", "Processing Plant Sector A", "Mine Face 7", "Conveyor Belt Junction", "Substation 2", "Explosives Storage", "Administration Block"];
const DESCRIPTIONS = [
    "Minor slip and fall on a wet surface near the wash plant.",
    "A hydraulic hose on excavator EX-102 burst during operation.",
    "Employee reported feeling a sharp pain in their back while manually lifting.",
    "A truck driver reported a near miss with a light vehicle.",
    "During routine inspection, a frayed wire was discovered on a motor.",
    "A small rockfall occurred from the highwall in Quarry B. The area was immediately cordoned off.",
    "A gas leak was detected in an underground shaft, triggering the alarm system.",
    "Operator of a heavy vehicle reported a malfunction in the braking system.",
    "A maintenance worker's hand was grazed by a rotating part after a safety guard was improperly secured.",
    "A flash fire occurred in the workshop due to welding sparks near a fuel container."
];

const INCIDENT_TYPES_FOR_DEMO = ['First Aid', 'Reportable', 'Lost Time Injury (LTI)', 'Fatality', 'Near Miss', 'High Potential Incident'];

let incidentCounter = 1000;
export const generateIncidentId = (mine, type) => {
    const acronym = type.split(' ').map(word => word[0]).join('').toUpperCase();
    incidentCounter++;
    return `${mine}-${acronym}-${format(new Date(), 'ddMMyy')}-${incidentCounter}`;
};

const createIncident = (type, mine, section, date, isCurrentYear) => {
    const lowerCaseType = type.toLowerCase();
    const isInjuryIncident = !lowerCaseType.includes('miss') && !lowerCaseType.includes('accident');
    const isLTI = type === 'Lost Time Injury (LTI)';
    const isFatal = type === 'Fatality';
    const isSBI = type === 'Serious Bodily Injury';

    const victimDetails = isInjuryIncident ? [{
        name: VICTIM_NAMES[Math.floor(Math.random() * VICTIM_NAMES.length)],
        category: Math.random() > 0.5 ? 'Regular' : 'Contractual',
        poNumber: Math.random() > 0.5 ? `PO-${Math.floor(Math.random() * 1000)}` : '',
        contractorName: Math.random() > 0.5 ? CONTRACTOR_NAMES[Math.floor(Math.random() * CONTRACTOR_NAMES.length)] : '',
        formB: `FB-${Math.floor(Math.random() * 900) + 100}`,
        age: Math.floor(Math.random() * 40) + 20,
        natureOfInjury: isFatal ? 'Fatal Injury' : isSBI ? 'Serious Injury' : 'Minor Injury',
        designation: 'Worker'
    }] : [];

    const closureDate = new Date(date);
    closureDate.setDate(closureDate.getDate() + Math.floor(Math.random() * 60));

    return {
        id: generateIncidentId(mine, type),
        date: format(date, 'yyyy-MM-dd'),
        time: format(date, 'HH:mm'),
        type: type,
        mine: mine,
        section: section,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
        reporterName: VICTIM_NAMES[Math.floor(Math.random() * VICTIM_NAMES.length)],
        status: Math.random() > 0.7 ? 'Closed' : 'Open',
        closureDate: closureDate.toISOString(),
        victims: victimDetails,
        photos: Math.random() > 0.5 ? [{ url: 'https://placehold.co/600x400', name: 'site_photo.jpg' }] : [],
        comments: [],
        history: [{ user: "System", action: "Created Demo Report", timestamp: date.toISOString() }],
        isDemo: true,
        daysLost: isLTI ? Math.floor(Math.random() * 30) : 0,
    };
};

export const generateMockData = (liveConfigs) => {
    let incidents = [];
    const { mines, sections, incidentTypes } = liveConfigs;
    const today = new Date();
    const twoYearsAgo = subYears(today, 2);
    const allDates = eachDayOfInterval({ start: twoYearsAgo, end: today });
    
    let fatalityCountPrevYear = 0;
    let seriousInjuryCount = 0;
    const maxSeriousInjuries = 400 * 0.25;

    for (let i = 0; i < 400; i++) {
        const randomDate = allDates[Math.floor(Math.random() * allDates.length)];
        const isCurrentYear = randomDate.getFullYear() === today.getFullYear();
        
        let type;
        if (isCurrentYear) {
            const nonFatalTypes = incidentTypes.filter(t => t !== 'Fatal');
            type = nonFatalTypes[Math.floor(Math.random() * nonFatalTypes.length)];
        } else {
            if (fatalityCountPrevYear >= 2) {
                const nonFatalTypes = incidentTypes.filter(t => t !== 'Fatal');
                type = nonFatalTypes[Math.floor(Math.random() * nonFatalTypes.length)];
            } else {
                type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
            }
        }

        if (seriousInjuryCount >= maxSeriousInjuries && type === 'Serious Bodily Injury') {
            const nonSbiTypes = incidentTypes.filter(t => t !== 'Serious Bodily Injury');
            type = nonSbiTypes[Math.floor(Math.random() * nonSbiTypes.length)];
        }

        const mine = mines[Math.floor(Math.random() * mines.length)];
        const section = sections[Math.floor(Math.random() * sections.length)];
        
        const newIncident = createIncident(type, mine, section, randomDate, isCurrentYear);
        incidents.push(newIncident);

        if (newIncident.type === 'Fatal') fatalityCountPrevYear++;
        if (newIncident.type === 'Serious Bodily Injury') seriousInjuryCount++;
    }

    const hoursWorked = {};
    mines.forEach(mine => {
        hoursWorked[mine] = {};
        for (let i = 0; i < 24; i++) {
            const monthDate = subMonths(startOfMonth(today), i);
            const monthKey = format(monthDate, 'yyyy-MM');
            const baseHours = 45000;
            const variance = (Math.random() - 0.5) * 10000;
            hoursWorked[mine][monthKey] = Math.round(baseHours + variance);
        }
    });

    return { incidents, hoursWorked };
};

export const generateSingleMockIncident = (liveConfigs) => {
    const { mines, sections, incidentTypes } = liveConfigs;
    const randomDate = new Date();
    
    const mine = mines[Math.floor(Math.random() * mines.length)];
    const section = sections[Math.floor(Math.random() * sections.length)];
    const type = 'High Potential Incident';
    
    const newIncident = createIncident(type, mine, section, randomDate, true);
    newIncident.description = "This is a pre-filled mock incident for testing the submission flow.";
    
    return newIncident;
};
