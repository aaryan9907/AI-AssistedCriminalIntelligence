export interface NexusNode {
  id: string;
  type: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  connections: number;
  cases: number;
  riskScore?: number;
}

export interface NexusEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  recordId: string;
  category: 'COMMUNICATION' | 'VEHICLE' | 'LOCATION' | 'FINANCIAL' | 'CASE' | 'ORGANIZATION';
  sourceType: string;
  date: string;
  caseId: string;
  active?: boolean;
}

export interface NexusEvidence {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  caseId: string;
  confidence: number;
  source: string;
}

export interface NexusSuggestion {
  id: string;
  title: string;
  category: 'LEAD' | 'ANOMALY' | 'QUERY' | 'VERIFY';
  description: string;
  confidence: number;
  actionLabel: string;
  targetNodeId?: string;
  activeCategories?: Array<'COMMUNICATION' | 'VEHICLE' | 'LOCATION' | 'FINANCIAL' | 'CASE' | 'ORGANIZATION'>;
  searchFilter?: string;
  stepAnimation?: boolean;
}

export const NEXUS_ENTITY_ICONS: Record<string, string> = {
  PERSON: '▣',
  PHONE: '◇',
  VEHICLE: '◈',
  LOCATION: '◎',
  ORGANIZATION: '▤',
  CASE: '▦',
  'BANK ACCOUNT': '◌',
  EVENT: '✦',
};

export const NEXUS_ENTITY_TONES: Record<string, 'signal' | 'azure' | 'safe' | 'warn' | 'muted'> = {
  PERSON: 'signal',
  PHONE: 'azure',
  VEHICLE: 'safe',
  LOCATION: 'azure',
  ORGANIZATION: 'muted',
  CASE: 'warn',
  'BANK ACCOUNT': 'safe',
  EVENT: 'signal',
};

export const NEXUS_STATS = [
  { label: 'RECORDS', value: '428', hint: 'ingested', tone: 'safe' as const },
  { label: 'ENTITIES', value: '173', hint: 'resolved', tone: 'signal' as const },
  { label: 'RELATIONSHIPS', value: '812', hint: 'edges', tone: 'azure' as const },
  { label: 'ACTIVE CASES', value: '14', hint: 'open', tone: 'muted' as const },
  { label: 'POTENTIAL LEADS', value: '23', hint: 'verify', tone: 'warn' as const },
  { label: 'ANOMALIES', value: '7', hint: 'patterns', tone: 'signal' as const },
];

export const NEXUS_NODES: NexusNode[] = [
  { id: 'P-014', type: 'PERSON', name: 'Rahul Sharma', subtitle: 'Selected subject', x: 50, y: 45, connections: 12, cases: 4, riskScore: 78 },
  { id: 'PH-021', type: 'PHONE', name: '+91 98201-00421 (Rahul\'s Phone)', subtitle: '+91 98201-00421 (Burner SIM)', x: 26, y: 23, connections: 8, cases: 2, riskScore: 65 },
  { id: 'P-037', type: 'PERSON', name: 'Vikram Singh', subtitle: 'Syndicate Intermediary', x: 50, y: 18, connections: 9, cases: 3, riskScore: 82 },
  { id: 'V-009', type: 'VEHICLE', name: 'Mahindra Scorpio (MH-04-KX-2311)', subtitle: 'MH 04 KX 2311 (Transit Asset)', x: 74, y: 23, connections: 6, cases: 2, riskScore: 54 },
  { id: 'P-052', type: 'PERSON', name: 'Amit Kumar', subtitle: 'Syndicate Operator', x: 82, y: 51, connections: 11, cases: 3, riskScore: 88 },
  { id: 'L-008', type: 'LOCATION', name: 'Andheri East Transit Terminal (LOC-08)', subtitle: 'Andheri East Transit Hub', x: 23, y: 73, connections: 14, cases: 5, riskScore: 40 },
  { id: 'O-003', type: 'ORGANIZATION', name: 'Apex Global Logistics (ORG-03)', subtitle: 'Commercial Shell Entity', x: 52, y: 77, connections: 7, cases: 2, riskScore: 60 },
  { id: 'C-142', type: 'CASE', name: 'Narcotics Trafficking Case (CR-2026-0142)', subtitle: 'Active Investigation Docket', x: 79, y: 77, connections: 18, cases: 1, riskScore: 95 },
  { id: 'BA-11', type: 'BANK ACCOUNT', name: 'HDFC Bank (Vikram - Current)', subtitle: 'Account •••• 7712', x: 14, y: 49, connections: 5, cases: 1, riskScore: 70 },
];

export const NEXUS_EDGES: NexusEdge[] = [
  { 
    id: 'e1', 
    source: 'P-014', 
    target: 'PH-021', 
    label: 'COMMUNICATED_WITH', 
    confidence: 0.94, 
    recordId: 'CDR-0087', 
    category: 'COMMUNICATION', 
    sourceType: 'Telecom CDR',
    date: '2026-03-12',
    caseId: 'CR-2026-0142',
    active: true 
  },
  { 
    id: 'e2', 
    source: 'PH-021', 
    target: 'P-037', 
    label: 'COMMUNICATED_WITH', 
    confidence: 0.91, 
    recordId: 'CDR-0112', 
    category: 'COMMUNICATION', 
    sourceType: 'Telecom CDR',
    date: '2026-03-12',
    caseId: 'CR-2026-0142',
    active: true 
  },
  { 
    id: 'e3', 
    source: 'P-037', 
    target: 'V-009', 
    label: 'USES', 
    confidence: 0.88, 
    recordId: 'VEH-0231', 
    category: 'VEHICLE', 
    sourceType: 'Field observation',
    date: '2026-03-12',
    caseId: 'CR-2026-0142',
    active: true 
  },
  { 
    id: 'e4', 
    source: 'V-009', 
    target: 'P-052', 
    label: 'OBSERVED_WITH', 
    confidence: 0.86, 
    recordId: 'VEH-0240', 
    category: 'VEHICLE', 
    sourceType: 'ANPR / CCTV',
    date: '2026-03-12',
    caseId: 'CR-2026-0142',
    active: true 
  },
  { 
    id: 'e5', 
    source: 'P-014', 
    target: 'L-008', 
    label: 'VISITED', 
    confidence: 0.79, 
    recordId: 'LOC-0041', 
    category: 'LOCATION', 
    sourceType: 'Tower dump',
    date: '2026-03-11',
    caseId: 'CR-2026-0142' 
  },
  { 
    id: 'e6', 
    source: 'P-037', 
    target: 'O-003', 
    label: 'MEMBER_OF', 
    confidence: 0.77, 
    recordId: 'ORG-0022', 
    category: 'ORGANIZATION', 
    sourceType: 'Corporate register',
    date: '2026-02-10',
    caseId: 'CR-2026-0142' 
  },
  { 
    id: 'e7', 
    source: 'P-052', 
    target: 'C-142', 
    label: 'INVOLVED_IN', 
    confidence: 0.91, 
    recordId: 'CASE-0142', 
    category: 'CASE', 
    sourceType: 'Case docket',
    date: '2026-03-13',
    caseId: 'CR-2026-0142' 
  },
  { 
    id: 'e8', 
    source: 'P-014', 
    target: 'C-142', 
    label: 'INVOLVED_IN', 
    confidence: 0.84, 
    recordId: 'CASE-0142', 
    category: 'CASE', 
    sourceType: 'Case docket',
    date: '2026-03-13',
    caseId: 'CR-2026-0142' 
  },
  { 
    id: 'e9', 
    source: 'BA-11', 
    target: 'O-003', 
    label: 'TRANSFERRED_MONEY_TO', 
    confidence: 0.83, 
    recordId: 'FIN-0192', 
    category: 'FINANCIAL', 
    sourceType: 'Banking / Wire',
    date: '2026-03-13',
    caseId: 'CR-2026-0142' 
  },
  { 
    id: 'e10', 
    source: 'L-008', 
    target: 'V-009', 
    label: 'LOCATED_AT', 
    confidence: 0.75, 
    recordId: 'LOC-0052', 
    category: 'LOCATION', 
    sourceType: 'Toll plaza ANPR',
    date: '2026-03-12',
    caseId: 'CR-2026-0142' 
  },
];

export const NEXUS_EVIDENCE: NexusEvidence[] = [
  { id: 'CDR-0087', type: 'Communication', title: 'Rahul Sharma → Phone X', description: 'Call detail record connecting P-014 with PH-021.', date: '12 MAR 2026', time: '14:32', caseId: 'CR-2026-0142', confidence: 0.94, source: 'Telecom CDR export' },
  { id: 'CDR-0112', type: 'Communication', title: 'Phone X → Vikram Singh', description: 'Telecom metadata confirming frequent bidirectional voice calls and encrypted burst communications.', date: '12 MAR 2026', time: '15:10', caseId: 'CR-2026-0142', confidence: 0.91, source: 'Telecom CDR export' },
  { id: 'VEH-0231', type: 'Vehicle observation', title: 'Vehicle V → Location Z', description: 'Observation record associates Vehicle V with a known location window.', date: '12 MAR 2026', time: '16:12', caseId: 'CR-2026-0142', confidence: 0.88, source: 'Field observation log' },
  { id: 'VEH-0240', type: 'Vehicle observation', title: 'Vehicle V → Amit Kumar', description: 'Surveillance footage correlates Vehicle V arrival with Amit Kumar sighting at logistics warehouse.', date: '12 MAR 2026', time: '18:45', caseId: 'CR-2026-0142', confidence: 0.86, source: 'ANPR & CCTV log' },
  { id: 'CASE-0142', type: 'Case event', title: 'Case CR-2026-0142', description: 'Case association recorded across fragmented investigation material.', date: '13 MAR 2026', time: '11:10', caseId: 'CR-2026-0142', confidence: 0.91, source: 'Case management export' },
  { id: 'FIN-0192', type: 'Transaction', title: 'Account A → Organization N', description: 'Synthetic transaction relationship retained for analyst review.', date: '13 MAR 2026', time: '09:42', caseId: 'CR-2026-0142', confidence: 0.83, source: 'Financial activity extract' },
  { id: 'LOC-0041', type: 'Location trace', title: 'Rahul Sharma → Location Z', description: 'Cell tower triangulation placing subject in vicinity of Andheri East transit hub.', date: '11 MAR 2026', time: '20:15', caseId: 'CR-2026-0142', confidence: 0.79, source: 'Tower dump analysis' },
  { id: 'ORG-0022', type: 'Corporate register', title: 'Vikram Singh → Organization N', description: 'Corporate registry records indicating beneficial ownership and executive advisory role.', date: '10 FEB 2026', time: '10:00', caseId: 'CR-2026-0142', confidence: 0.77, source: 'Registrar of Companies' },
  { id: 'LOC-0052', type: 'Location trace', title: 'Location Z → Vehicle V', description: 'Toll plaza automated number plate recognition capture at Andheri junction.', date: '12 MAR 2026', time: '16:30', caseId: 'CR-2026-0142', confidence: 0.75, source: 'Highway toll system' }
];

export const NEXUS_HIDDEN_PATH = ['P003', 'PH003', 'PH010', 'P011', 'VH05', 'P020'];

export const NEXUS_SUGGESTIONS: NexusSuggestion[] = [
  {
    id: 'sug-1',
    title: 'Trace Multi-Hop Link: Garima ↔ Shailesh',
    category: 'LEAD',
    description: 'Discovered 5-hop indirect connection connecting Garima (P003) with Shailesh (P020) through burner phones and vehicle registry.',
    confidence: 0.94,
    actionLabel: 'Analyze 5-Hop Path',
    targetNodeId: 'P003',
    activeCategories: ['COMMUNICATION', 'VEHICLE'],
    stepAnimation: true,
  },
  {
    id: 'sug-2',
    title: 'Isolate Vehicle UP16 Bridge Nexus',
    category: 'ANOMALY',
    description: 'Vehicle VH02 (UP 16 AA 1646) bridges Rashi & Deepak across disjoint surveillance logs and Case 04 docket.',
    confidence: 0.89,
    actionLabel: 'Focus Vehicle Bridge',
    targetNodeId: 'VH02',
    activeCategories: ['VEHICLE', 'CASE'],
    searchFilter: 'UP16',
  },
  {
    id: 'sug-3',
    title: 'Inspect Proxy Wire Transfers (ACC05)',
    category: 'LEAD',
    description: 'Account ACC05 (Metro Bank) executed recurring wire transfers linking Monika to Ritu via intermediary proxy accounts.',
    confidence: 0.88,
    actionLabel: 'Filter Financial Ties',
    targetNodeId: 'ACC05',
    activeCategories: ['FINANCIAL'],
    searchFilter: 'ACC05',
  },
  {
    id: 'sug-4',
    title: 'Co-Location Rendezvous at Bus Terminal',
    category: 'VERIFY',
    description: 'Location LOC09 (Interstate Bus Terminal) logs concurrent sightings connecting Sonali and Vikram.',
    confidence: 0.91,
    actionLabel: 'Filter Physical Presence',
    targetNodeId: 'LOC09',
    activeCategories: ['LOCATION'],
    searchFilter: 'LOC09',
  }
];

// Analytical Datasets for Graphs
export const NETWORK_CENTRALITY_DATA = [
  { name: 'Case CR-0142', id: 'C-142', type: 'CASE', degree: 18, risk: 95 },
  { name: 'Location Z', id: 'L-008', type: 'LOCATION', degree: 14, risk: 40 },
  { name: 'Rahul Sharma', id: 'P-014', type: 'PERSON', degree: 12, risk: 78 },
  { name: 'Amit Kumar', id: 'P-052', type: 'PERSON', degree: 11, risk: 88 },
  { name: 'Vikram Singh', id: 'P-037', type: 'PERSON', degree: 9, risk: 82 },
  { name: 'Phone X', id: 'PH-021', type: 'PHONE', degree: 8, risk: 65 },
  { name: 'Organization N', id: 'O-003', type: 'ORGANIZATION', degree: 7, risk: 60 },
  { name: 'Vehicle V', id: 'V-009', type: 'VEHICLE', degree: 6, risk: 54 },
  { name: 'Account A', id: 'BA-11', type: 'BANK ACCOUNT', degree: 5, risk: 70 },
];

export const ENTITY_TYPE_DISTRIBUTION = [
  { type: 'PERSON', count: 3, percent: 33, color: 'var(--signal)' },
  { type: 'PHONE', count: 1, percent: 11, color: 'var(--azure)' },
  { type: 'VEHICLE', count: 1, percent: 11, color: 'var(--safe)' },
  { type: 'LOCATION', count: 1, percent: 11, color: 'var(--azure)' },
  { type: 'ORGANIZATION', count: 1, percent: 11, color: 'var(--muted-foreground)' },
  { type: 'CASE', count: 1, percent: 11, color: 'var(--warn)' },
  { type: 'BANK ACCOUNT', count: 1, percent: 11, color: 'var(--safe)' },
];

export const TIMELINE_ACTIVITY_DATA = [
  { date: '10 Feb', count: 1, type: 'Corporate register', label: 'Org affiliation' },
  { date: '11 Mar', count: 2, type: 'Location / Tower', label: 'Cell tower trace' },
  { date: '12 Mar (AM)', count: 4, type: 'Telecom CDR', label: 'Call bursts' },
  { date: '12 Mar (PM)', count: 6, type: 'Vehicular sighting', label: 'ANPR capture' },
  { date: '13 Mar', count: 3, type: 'Financial & Case', label: 'Wire transfer & filing' },
];
