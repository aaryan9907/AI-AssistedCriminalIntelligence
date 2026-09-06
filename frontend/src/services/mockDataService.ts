import { Entity, Relationship, EvidenceRecord, InvestigativeLead, TimelineEvent, SystemStats } from '../types/intel';

export const INITIAL_STATS: SystemStats = {
  totalRecords: 428,
  totalEntities: 173,
  totalRelationships: 812,
  activeCases: 14,
  potentialLeads: 23,
  anomalousPatterns: 7,
  systemStatus: 'ONLINE',
  datasetName: 'SYNTHETIC INTEL DB v2.4 (OP AEGIS)',
  lastUpdated: '05 Sep 2026 23:40 IST',
};

export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'P-014',
    name: 'Rahul Sharma',
    type: 'PERSON',
    aliases: ['RS', 'The Architect', 'Sharma-ji'],
    riskScore: 84,
    details: {
      phone: '+91 98110-23491',
      organization: 'Falcon Logistics (Unofficial Consultant)',
      classification: 'Subject of Interest',
      knownUsers: ['Vikram Singh', 'Priya Verma'],
      cases: ['CR-2026-0142', 'CR-2025-0891'],
      address: 'A-42, Defence Colony, New Delhi',
      communicationCount: 142,
    },
    metrics: {
      connectionCount: 12,
      caseCount: 4,
      anomalyFlag: true,
      lastActive: '12 Mar 2026 14:32',
    }
  },
  {
    id: 'PH-092',
    name: 'Phone X (+91 98110-23491)',
    type: 'PHONE',
    aliases: ['Encrypted Endpoint X', 'IMEI: 864902041189201'],
    riskScore: 78,
    details: {
      phone: '+91 98110-23491',
      knownUsers: ['Rahul Sharma', 'Vikram Singh'],
      communicationCount: 42,
      cases: ['CR-2026-0142'],
      status: 'Active / Roaming',
    },
    metrics: {
      connectionCount: 8,
      caseCount: 2,
      anomalyFlag: true,
      lastActive: '12 Mar 2026 14:32',
    }
  },
  {
    id: 'P-089',
    name: 'Vikram Singh',
    type: 'PERSON',
    aliases: ['Vicky', 'Transport In-charge'],
    riskScore: 68,
    details: {
      phone: '+91 98721-00412',
      vehicleReg: 'DL-01-AB-4491',
      organization: 'Falcon Logistics Ltd',
      classification: 'Fleet Operations Supervisor',
      cases: ['CR-2026-0142'],
      address: 'Flat 304, Green Park Extension, New Delhi',
    },
    metrics: {
      connectionCount: 11,
      caseCount: 2,
      anomalyFlag: false,
      lastActive: '12 Mar 2026 15:45',
    }
  },
  {
    id: 'VH-0231',
    name: 'Vehicle V (DL-01-AB-4491)',
    type: 'VEHICLE',
    aliases: ['Scorpio Black Special Edition', 'CHASSIS: MA1TA2...992'],
    riskScore: 76,
    details: {
      vehicleReg: 'DL-01-AB-4491',
      vehicleType: 'Mahindra Scorpio SUV (Dark Blue)',
      owner: 'Falcon Logistics Ltd (Commercial Fleet)',
      knownUsers: ['Vikram Singh', 'Amit Kumar'],
      cases: ['CR-2026-0142', 'CR-2026-0304'],
    },
    metrics: {
      connectionCount: 7,
      caseCount: 2,
      anomalyFlag: true,
      lastActive: '12 Mar 2026 16:12',
    }
  },
  {
    id: 'P-102',
    name: 'Amit Kumar',
    type: 'PERSON',
    aliases: ['AK', 'The Auditor', 'Dr. Kumar'],
    riskScore: 89,
    details: {
      phone: '+91 99104-55829',
      organization: 'Shadow FinTech LLP',
      accountNumber: 'ACC-098 (Axis Bank)',
      classification: 'Financial Layering Subject',
      cases: ['CR-2026-0142', 'CR-2026-0304'],
      address: 'Villa 18, Nirvana Country, Gurugram',
    },
    metrics: {
      connectionCount: 15,
      caseCount: 3,
      anomalyFlag: true,
      lastActive: '13 Mar 2026 09:42',
    }
  },
  {
    id: 'LOC-004',
    name: 'Safehouse Sector 42',
    type: 'LOCATION',
    aliases: ['Site Alpha', 'Basement Unit 4'],
    riskScore: 72,
    details: {
      address: 'Plot 104, Sector 42, Gurugram, Haryana',
      coordinates: [28.4595, 77.0266],
      classification: 'Frequent Rendezvous Point',
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 6,
      caseCount: 2,
      anomalyFlag: true,
      lastActive: '11 Mar 2026 22:15',
    }
  },
  {
    id: 'LOC-009',
    name: 'Terminal 3 Cargo Hub',
    type: 'LOCATION',
    aliases: ['IGI Cargo Gate 4', 'Depot Bay 12'],
    riskScore: 55,
    details: {
      address: 'Cargo Complex, Terminal 3, IGI Airport, New Delhi',
      coordinates: [28.5562, 77.0999],
      classification: 'Logistics Transfer Terminal',
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 9,
      caseCount: 3,
      anomalyFlag: false,
      lastActive: '12 Mar 2026 16:12',
    }
  },
  {
    id: 'ORG-008',
    name: 'Shadow FinTech LLP',
    type: 'ORGANIZATION',
    aliases: ['SF Services', 'CIN: U72900DL2024PTC112233'],
    riskScore: 91,
    details: {
      organization: 'Shadow FinTech LLP',
      status: 'Active (Dormant Filing)',
      address: 'Office 702, Barakhamba Road, Connaught Place, New Delhi',
      accountNumber: 'Axis-9812',
      cases: ['CR-2026-0142', 'CR-2026-0304'],
    },
    metrics: {
      connectionCount: 10,
      caseCount: 2,
      anomalyFlag: true,
      lastActive: '13 Mar 2026 09:42',
    }
  },
  {
    id: 'ORG-015',
    name: 'Falcon Logistics Ltd',
    type: 'ORGANIZATION',
    aliases: ['FL Transways', 'Fleet Reg: 881-DL'],
    riskScore: 64,
    details: {
      organization: 'Falcon Logistics Ltd',
      status: 'Active Commercial Carrier',
      address: 'Transport Nagar Yard 3, Delhi',
      cases: ['CR-2026-0142', 'CR-2025-0891'],
    },
    metrics: {
      connectionCount: 14,
      caseCount: 3,
      anomalyFlag: false,
      lastActive: '12 Mar 2026 16:12',
    }
  },
  {
    id: 'ACC-098',
    name: 'Axis Bank A/c 91902008849812',
    type: 'BANK ACCOUNT',
    aliases: ['Axis-9812', 'Shadow FinTech Op A/c'],
    riskScore: 88,
    details: {
      accountNumber: '91902008849812',
      bankName: 'Axis Bank - CP Branch',
      knownSignatories: ['Amit Kumar', 'Priya Verma'],
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 5,
      caseCount: 2,
      anomalyFlag: true,
      lastActive: '13 Mar 2026 09:42',
    }
  },
  {
    id: 'CASE-0142',
    name: 'Case CR-2026-0142',
    type: 'CASE',
    aliases: ['Operation Aegis', 'FIR 142/2026 Special Cell'],
    riskScore: 95,
    details: {
      openingDate: '02 Feb 2026',
      status: 'Active Investigation',
      classification: 'Interstate Cargo Smuggling & Hawala Nexus',
      location: 'National Capital Region',
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 18,
      caseCount: 1,
      anomalyFlag: true,
      lastActive: '13 Mar 2026 11:10',
    }
  },
  {
    id: 'P-044',
    name: 'Priya Verma',
    type: 'PERSON',
    aliases: ['PV', 'The Signatory'],
    riskScore: 61,
    details: {
      phone: '+91 98101-77211',
      organization: 'Shadow FinTech LLP',
      classification: 'Corporate Nominee',
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 7,
      caseCount: 1,
      anomalyFlag: false,
      lastActive: '13 Mar 2026 09:40',
    }
  },
  {
    id: 'EVT-001',
    name: 'Aerocity Hotel Conclave',
    type: 'EVENT',
    aliases: ['Logistics Strategy Dinner', 'SURV-CONCLAVE-11'],
    riskScore: 74,
    details: {
      address: 'Hotel Grand, Aerocity Hospitality District, New Delhi',
      openingDate: '11 Mar 2026 20:30',
      classification: 'Suspected Coordination Meet',
      cases: ['CR-2026-0142'],
    },
    metrics: {
      connectionCount: 5,
      caseCount: 1,
      anomalyFlag: true,
      lastActive: '11 Mar 2026 22:00',
    }
  }
];

export const MOCK_RELATIONSHIPS: Relationship[] = [
  // 4-Hop Chain Relationships
  {
    id: 'REL-001',
    source: 'P-014', // Rahul Sharma
    target: 'PH-092', // Phone X
    type: 'USES',
    confidence: 0.94,
    evidenceRecordId: 'CDR-0087',
    timestamp: '12 Mar 2026 14:32',
    caseId: 'CR-2026-0142',
    description: 'Subject Rahul Sharma identified using handset linked to Phone X via IMSI capture and tower logs',
  },
  {
    id: 'REL-002',
    source: 'PH-092', // Phone X
    target: 'P-089', // Vikram Singh
    type: 'COMMUNICATED_WITH',
    confidence: 0.89,
    evidenceRecordId: 'CDR-0087',
    timestamp: '12 Mar 2026 14:32',
    caseId: 'CR-2026-0142',
    description: '184-second outgoing call from Phone X to Vikram Singh prior to cargo gate departure',
  },
  {
    id: 'REL-003',
    source: 'P-089', // Vikram Singh
    target: 'VH-0231', // Vehicle V
    type: 'USES',
    confidence: 0.92,
    evidenceRecordId: 'VEH-0231',
    timestamp: '12 Mar 2026 15:45',
    caseId: 'CR-2026-0142',
    description: 'Vikram Singh recorded driving Vehicle V (DL-01-AB-4491) leaving Transport Yard',
  },
  {
    id: 'REL-004',
    source: 'VH-0231', // Vehicle V
    target: 'P-102', // Amit Kumar
    type: 'OBSERVED_AT',
    confidence: 0.87,
    evidenceRecordId: 'VEH-0231',
    timestamp: '12 Mar 2026 16:12',
    caseId: 'CR-2026-0142',
    description: 'Amit Kumar observed entering Vehicle V at Terminal 3 Cargo Hub gate area',
  },

  // Supporting & Contextual Relationships
  {
    id: 'REL-005',
    source: 'P-014',
    target: 'CASE-0142',
    type: 'INVOLVED_IN',
    confidence: 0.95,
    evidenceRecordId: 'CASE-0142',
    timestamp: '02 Feb 2026',
    caseId: 'CR-2026-0142',
    description: 'Primary person of interest in Case CR-2026-0142 investigation docket',
  },
  {
    id: 'REL-006',
    source: 'P-089',
    target: 'ORG-015',
    type: 'MEMBER_OF',
    confidence: 0.98,
    evidenceRecordId: 'CASE-0142',
    timestamp: '15 Jan 2025',
    caseId: 'CR-2026-0142',
    description: 'Fleet operations supervisor on payroll of Falcon Logistics Ltd',
  },
  {
    id: 'REL-007',
    source: 'VH-0231',
    target: 'ORG-015',
    type: 'OWNS',
    confidence: 1.0,
    evidenceRecordId: 'VEH-0231',
    timestamp: '10 Nov 2024',
    caseId: 'CR-2026-0142',
    description: 'Vehicle registered to Falcon Logistics Ltd under commercial permit',
  },
  {
    id: 'REL-008',
    source: 'P-102',
    target: 'ORG-008',
    type: 'MEMBER_OF',
    confidence: 0.96,
    evidenceRecordId: 'TXN-9912',
    timestamp: '04 Jan 2024',
    caseId: 'CR-2026-0142',
    description: 'Designated partner and primary corporate authorized signatory for Shadow FinTech LLP',
  },
  {
    id: 'REL-009',
    source: 'ORG-008',
    target: 'ACC-098',
    type: 'OWNS',
    confidence: 1.0,
    evidenceRecordId: 'TXN-9912',
    timestamp: '14 Feb 2024',
    caseId: 'CR-2026-0142',
    description: 'Corporate bank account held in the name of Shadow FinTech LLP',
  },
  {
    id: 'REL-010',
    source: 'P-102',
    target: 'CASE-0142',
    type: 'INVOLVED_IN',
    confidence: 0.86,
    evidenceRecordId: 'CASE-0142',
    timestamp: '12 Mar 2026',
    caseId: 'CR-2026-0142',
    description: 'Named in financial intelligence annexure to Case CR-2026-0142',
  },
  {
    id: 'REL-011',
    source: 'P-014',
    target: 'LOC-004',
    type: 'VISITED',
    confidence: 0.91,
    evidenceRecordId: 'TOWER-772',
    timestamp: '11 Mar 2026 22:15',
    caseId: 'CR-2026-0142',
    description: 'Cell tower triangulation places Rahul Sharma at Safehouse Sector 42',
  },
  {
    id: 'REL-012',
    source: 'P-089',
    target: 'LOC-004',
    type: 'VISITED',
    confidence: 0.88,
    evidenceRecordId: 'TOWER-772',
    timestamp: '11 Mar 2026 22:30',
    caseId: 'CR-2026-0142',
    description: 'Vikram Singh mobile location overlaps with Safehouse Sector 42 site',
  },
  {
    id: 'REL-013',
    source: 'VH-0231',
    target: 'LOC-009',
    type: 'LOCATED_AT',
    confidence: 0.97,
    evidenceRecordId: 'VEH-0231',
    timestamp: '12 Mar 2026 16:12',
    caseId: 'CR-2026-0142',
    description: 'Scorpio SUV observed at Terminal 3 Cargo Hub bay entrance',
  },
  {
    id: 'REL-014',
    source: 'P-044',
    target: 'ORG-008',
    type: 'MEMBER_OF',
    confidence: 0.95,
    evidenceRecordId: 'TXN-9912',
    timestamp: '10 Feb 2025',
    caseId: 'CR-2026-0142',
    description: 'Priya Verma registered co-signatory for corporate filings',
  },
  {
    id: 'REL-015',
    source: 'P-014',
    target: 'EVT-001',
    type: 'PRESENT_AT',
    confidence: 0.82,
    evidenceRecordId: 'SURV-041',
    timestamp: '11 Mar 2026 20:30',
    caseId: 'CR-2026-0142',
    description: 'Surveillance operative logged Rahul Sharma entering Aerocity Hotel conclave',
  }
];

export const MOCK_EVIDENCE_RECORDS: Record<string, EvidenceRecord> = {
  'CDR-0087': {
    id: 'CDR-0087',
    recordType: 'CDR',
    title: 'Cellular Intercept & Call Data Record - Phone X to Vikram Singh',
    timestamp: '12 Mar 2026 14:32:10 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.94,
    description: 'Direct cellular communication between Phone X (+91 98110-23491) and Vikram Singh (+91 98721-00412). Duration: 184 seconds. Azimuth: 120°. Connected via Sector 42 Tower DL-OKH-772.',
    sourceSystem: 'Telecomm Gateway Intercept System (TGIS)',
    classification: 'Confidential / Investigative',
    rawDetails: {
      primaryEntities: ['Rahul Sharma', 'Phone X', 'Vikram Singh'],
      location: 'Sector 42, Gurugram (Cell Sector DL-OKH-772-B)',
      durationSeconds: 184,
      officerNotes: 'Call initiated exactly 40 minutes prior to Vehicle V departure towards Terminal 3 Cargo Hub. High operational relevance.',
      metadata: {
        callingIMEI: '864902041189201',
        receivingIMEI: '358902019401294',
        signalQuality: 'Strong (-72 dBm)',
        callType: 'Voice - Encrypted App fallback to VoLTE'
      }
    },
    verifiedByHuman: false,
  },
  'VEH-0231': {
    id: 'VEH-0231',
    recordType: 'VEHICLE_LOG',
    title: 'ANPR Gate Log & Physical Surveillance Sighting #231',
    timestamp: '12 Mar 2026 16:12:45 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.92,
    description: 'Automated Number Plate Recognition (ANPR) and photographic observation of Vehicle V (DL-01-AB-4491, Dark Blue Scorpio) entering Terminal 3 Cargo Hub Gate 4. Driver identified as Vikram Singh; subject Amit Kumar entered passenger side 2 minutes later.',
    sourceSystem: 'SafeCity ANPR & Surveillance Grid',
    classification: 'Confidential / Surveillance',
    rawDetails: {
      primaryEntities: ['Vikram Singh', 'Vehicle V (DL-01-AB-4491)', 'Amit Kumar', 'Terminal 3 Cargo Hub'],
      location: 'Terminal 3 Cargo Complex, IGI Airport, New Delhi',
      officerNotes: 'Clear photographic match of Amit Kumar entering passenger seat. Vehicle stayed stationary for 14 minutes before departing onto Western Peripheral Expressway.',
      metadata: {
        cameraUnitId: 'CAM-IGI-CARGO-G4-IN',
        plateConfidence: '99.4%',
        vehicleColor: 'Dark Blue',
        occupantsObserved: 2
      }
    },
    verifiedByHuman: true,
  },
  'CASE-0142': {
    id: 'CASE-0142',
    recordType: 'CASE_FILE',
    title: 'Investigation Docket FIR 142/2026 - Operation Aegis',
    timestamp: '02 Feb 2026 10:00:00 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.98,
    description: 'Central docket initiating Operation Aegis into syndicated logistics diversion, illicit cargo clearance, and associated layered remittances across Delhi-NCR and Mumbai.',
    sourceSystem: 'Crime Intelligence Case Management System (CICMS)',
    classification: 'Secret / Active Docket',
    rawDetails: {
      primaryEntities: ['Rahul Sharma', 'Falcon Logistics Ltd', 'Shadow FinTech LLP'],
      location: 'Special Cell Headquarters, New Delhi',
      officerNotes: 'Fragmented intelligence indicated Falcon Logistics vehicles were being leveraged for non-manifested transit without direct paper trail to masterminds.',
    },
    verifiedByHuman: true,
  },
  'SURV-041': {
    id: 'SURV-041',
    recordType: 'SURVEILLANCE',
    title: 'Surveillance Field Note #041 - Aerocity Hotel Conclave',
    timestamp: '11 Mar 2026 20:30:00 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.85,
    description: 'Visual observation of Subject Rahul Sharma arriving at Hotel Grand Aerocity for an unscheduled meeting in private dining suite 3.',
    sourceSystem: 'Special Operations Field Observation Log',
    classification: 'Confidential',
    rawDetails: {
      primaryEntities: ['Rahul Sharma', 'Aerocity Hotel Conclave'],
      location: 'Aerocity Hospitality District, New Delhi',
      officerNotes: 'Subject departed at 22:10 in a commercial cab, subsequently traced to Safehouse Sector 42.',
    },
    verifiedByHuman: false,
  },
  'TXN-9912': {
    id: 'TXN-9912',
    recordType: 'FINANCIAL_TXN',
    title: 'Suspicious Remittance Alert STR-9912 - Axis Bank A/c 9812',
    timestamp: '13 Mar 2026 09:42:15 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.91,
    description: 'Immediate RTGS outbound transfer of INR 45,00,000 from Shadow FinTech LLP corporate account (Axis-9812) executed less than 18 hours following cargo terminal observation.',
    sourceSystem: 'Financial Intelligence Unit Gateway (FIU-IND Sync)',
    classification: 'Restricted / Financial Data',
    rawDetails: {
      primaryEntities: ['Shadow FinTech LLP', 'Amit Kumar', 'Axis Bank A/c 91902008849812'],
      amount: 4500000,
      currency: 'INR',
      officerNotes: 'Pattern demonstrates rapid settlement immediately following logistics movements. Authorizing digital token signed by Amit Kumar.',
    },
    verifiedByHuman: false,
  },
  'TOWER-772': {
    id: 'TOWER-772',
    recordType: 'CELL_TOWER',
    title: 'Cellular Tower Co-location Dump - DL-OKH-772 Sector 42',
    timestamp: '11 Mar 2026 22:15:00 IST',
    caseId: 'CR-2026-0142',
    confidence: 0.88,
    description: 'Co-location analysis showing handset of Rahul Sharma and mobile of Vikram Singh registering concurrently on Sector 42 cell antenna for 45 minutes.',
    sourceSystem: 'Cellular Density & Triangulation Engine',
    classification: 'Confidential',
    rawDetails: {
      primaryEntities: ['Rahul Sharma', 'Vikram Singh', 'Safehouse Sector 42'],
      location: 'Sector 42, Gurugram',
      officerNotes: 'Physical proximity confirmed despite no direct calls between both numbers in the prior 30 days.',
    },
    verifiedByHuman: false,
  }
};

export const MOCK_LEADS: InvestigativeLead[] = [
  {
    id: 'LEAD-001',
    title: 'Rahul Sharma ↔ Amit Kumar',
    sourceEntityId: 'P-014',
    targetEntityId: 'P-102',
    relationshipType: 'Indirect multi-hop relationship',
    pathLength: 4,
    confidenceScore: 0.87,
    supportingRecordCount: 6,
    relatedCaseCount: 2,
    whyFlagged: [
      'Shared communication link across intermediate operative',
      'Vehicle association bridging logistics fleet to financial coordinator',
      'Cross-case relationship linking Case CR-2026-0142 and CR-2026-0304',
      'Temporal proximity: Comm sequence (14:32) followed by vehicle meetup (16:12) and next-day wire transfer (09:42)'
    ],
    path: [
      {
        entityId: 'P-014',
        entityName: 'Rahul Sharma',
        entityType: 'PERSON',
        stepEdge: {
          relationshipType: 'USES',
          evidenceId: 'CDR-0087',
          confidence: 0.94
        }
      },
      {
        entityId: 'PH-092',
        entityName: 'Phone X (+91 98110-23491)',
        entityType: 'PHONE',
        stepEdge: {
          relationshipType: 'COMMUNICATED_WITH',
          evidenceId: 'CDR-0087',
          confidence: 0.89
        }
      },
      {
        entityId: 'P-089',
        entityName: 'Vikram Singh',
        entityType: 'PERSON',
        stepEdge: {
          relationshipType: 'USES',
          evidenceId: 'VEH-0231',
          confidence: 0.92
        }
      },
      {
        entityId: 'VH-0231',
        entityName: 'Vehicle V (DL-01-AB-4491)',
        entityType: 'VEHICLE',
        stepEdge: {
          relationshipType: 'OBSERVED_AT',
          evidenceId: 'VEH-0231',
          confidence: 0.87
        }
      },
      {
        entityId: 'P-102',
        entityName: 'Amit Kumar',
        entityType: 'PERSON'
      }
    ],
    evidenceRecordIds: ['CDR-0087', 'VEH-0231', 'CASE-0142', 'SURV-041', 'TXN-9912', 'TOWER-772'],
    timestamp: '12 Mar 2026 14:32 IST',
    status: 'PENDING_REVIEW',
    investigatorNotes: 'Critical lead: Reveals previously concealed nexus between logistics planner (Rahul) and financial settlement coordinator (Amit) via driver Vikram Singh and commercial fleet vehicle.'
  },
  {
    id: 'LEAD-002',
    title: 'Falcon Logistics ↔ Shadow FinTech Layering Flow',
    sourceEntityId: 'ORG-015',
    targetEntityId: 'ORG-008',
    relationshipType: 'Corporate Cross-Ownership & Asset Transit',
    pathLength: 3,
    confidenceScore: 0.81,
    supportingRecordCount: 4,
    relatedCaseCount: 2,
    whyFlagged: [
      'Dual entity participation in Terminal 3 Cargo incident',
      'Wire transfers coinciding with fleet transit timestamps',
      'Overlapping shell addresses in NCR regulatory filings'
    ],
    path: [
      {
        entityId: 'ORG-015',
        entityName: 'Falcon Logistics Ltd',
        entityType: 'ORGANIZATION',
        stepEdge: {
          relationshipType: 'OWNS',
          evidenceId: 'VEH-0231',
          confidence: 1.0
        }
      },
      {
        entityId: 'VH-0231',
        entityName: 'Vehicle V (DL-01-AB-4491)',
        entityType: 'VEHICLE',
        stepEdge: {
          relationshipType: 'OBSERVED_AT',
          evidenceId: 'VEH-0231',
          confidence: 0.87
        }
      },
      {
        entityId: 'P-102',
        entityName: 'Amit Kumar',
        entityType: 'PERSON',
        stepEdge: {
          relationshipType: 'MEMBER_OF',
          evidenceId: 'TXN-9912',
          confidence: 0.96
        }
      },
      {
        entityId: 'ORG-008',
        entityName: 'Shadow FinTech LLP',
        entityType: 'ORGANIZATION'
      }
    ],
    evidenceRecordIds: ['VEH-0231', 'TXN-9912', 'CASE-0142'],
    timestamp: '13 Mar 2026 09:42 IST',
    status: 'PENDING_REVIEW',
  }
];

export const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'EVT-T1',
    timestamp: '2026-03-11T20:30:00Z',
    displayDate: '11 MAR 2026',
    displayTime: '20:30',
    category: 'Event',
    title: 'Aerocity Hospitality Rendezvous',
    description: 'Rahul Sharma observed meeting undisclosed associates at Aerocity Hotel private dining room',
    sourceEntityId: 'P-014',
    targetEntityId: 'EVT-001',
    evidenceRecordId: 'SURV-041',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T2',
    timestamp: '2026-03-11T22:15:00Z',
    displayDate: '11 MAR 2026',
    displayTime: '22:15',
    category: 'Location',
    title: 'Sector 42 Safehouse Co-location',
    description: 'Cell tower triangulation confirms Rahul Sharma and Vikram Singh devices at Sector 42 safehouse',
    sourceEntityId: 'P-014',
    targetEntityId: 'LOC-004',
    evidenceRecordId: 'TOWER-772',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T3',
    timestamp: '2026-03-12T14:32:00Z',
    displayDate: '12 MAR 2026',
    displayTime: '14:32',
    category: 'Communication',
    title: 'Handset Dispatch Call (184s)',
    description: 'Rahul Sharma initiates cellular dispatch from Phone X to Vikram Singh prior to vehicle departure',
    sourceEntityId: 'P-014',
    targetEntityId: 'P-089',
    evidenceRecordId: 'CDR-0087',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T4',
    timestamp: '2026-03-12T15:45:00Z',
    displayDate: '12 MAR 2026',
    displayTime: '15:45',
    category: 'Vehicle',
    title: 'Scorpio Fleet Dispatch',
    description: 'Vikram Singh drives Vehicle V (DL-01-AB-4491) from Falcon Logistics Transport Nagar Depot',
    sourceEntityId: 'P-089',
    targetEntityId: 'VH-0231',
    evidenceRecordId: 'VEH-0231',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T5',
    timestamp: '2026-03-12T16:12:00Z',
    displayDate: '12 MAR 2026',
    displayTime: '16:12',
    category: 'Location',
    title: 'Cargo Hub Rendezvous & Pickup',
    description: 'Vehicle V observed at Terminal 3 Cargo Hub Gate 4; Amit Kumar enters passenger compartment',
    sourceEntityId: 'VH-0231',
    targetEntityId: 'P-102',
    evidenceRecordId: 'VEH-0231',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T6',
    timestamp: '2026-03-13T09:42:00Z',
    displayDate: '13 MAR 2026',
    displayTime: '09:42',
    category: 'Transaction',
    title: 'Layered RTGS Wire Settlement',
    description: 'Shadow FinTech LLP authorizes INR 45,00,000 outbound wire via Axis Bank A/c 9812 to shell recipient',
    sourceEntityId: 'P-102',
    targetEntityId: 'ACC-098',
    evidenceRecordId: 'TXN-9912',
    caseId: 'CR-2026-0142'
  },
  {
    id: 'EVT-T7',
    timestamp: '2026-03-13T11:10:00Z',
    displayDate: '13 MAR 2026',
    displayTime: '11:10',
    category: 'Case',
    title: 'Case CR-2026-0142 Intelligence Dossier Updated',
    description: 'Investigative team updates docket with cross-border linkages and cell co-location evidence',
    sourceEntityId: 'CASE-0142',
    evidenceRecordId: 'CASE-0142',
    caseId: 'CR-2026-0142'
  }
];

export const SAMPLE_DATASET_PACKS = [
  {
    id: 'pack-aegis',
    name: 'Operation Aegis - Synthetic CDR & Surveillance Pack',
    description: '428 CDR records, 173 entities, ANPR gate logs, cell tower dumps, and financial transactions from Delhi-NCR region',
    recordCount: 428,
    fileSize: '3.4 MB',
    format: 'JSON / CSV'
  },
  {
    id: 'pack-cargo',
    name: 'Hawala Cargo & Financial Flow Records (Synthetic)',
    description: 'Cross-border container logs, RTGS swift transfers, shell company registrar filings, and burner IMEI clusters',
    recordCount: 612,
    fileSize: '5.1 MB',
    format: 'CSV'
  }
];

export const DEFAULT_DATABASE_FILES = [
  {
    id: 'db-file-1',
    name: 'TGIS_Cellular_CDR_Tower_Okhla_Sec42.csv',
    type: 'CSV',
    size: '3.8 MB',
    recordCategory: 'Telecom CDR Logs',
    recordsCount: 428,
    status: 'PENDING' as const,
  },
  {
    id: 'db-file-2',
    name: 'SafeCity_ANPR_Surveillance_Gate4_T3.json',
    type: 'JSON',
    size: '2.4 MB',
    recordCategory: 'ANPR Vehicle Gate Sighting',
    recordsCount: 312,
    status: 'PENDING' as const,
  },
  {
    id: 'db-file-3',
    name: 'FIU_IND_RTGS_CrossBorder_Remittances.csv',
    type: 'CSV',
    size: '1.8 MB',
    recordCategory: 'Financial Layering Ledger',
    recordsCount: 196,
    status: 'PENDING' as const,
  },
  {
    id: 'db-file-4',
    name: 'SpecialCell_FIR_Docket_CR-2026-0142.txt',
    type: 'TXT',
    size: '740 KB',
    recordCategory: 'Case Investigation Docket',
    recordsCount: 68,
    status: 'PENDING' as const,
  },
];
