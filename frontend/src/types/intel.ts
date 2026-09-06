export type EntityType = 
  | 'PERSON'
  | 'PHONE'
  | 'VEHICLE'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'CASE'
  | 'BANK ACCOUNT'
  | 'EVENT';

export type RelationshipType =
  | 'USES'
  | 'OWNS'
  | 'COMMUNICATED_WITH'
  | 'VISITED'
  | 'LOCATED_AT'
  | 'MEMBER_OF'
  | 'INVOLVED_IN'
  | 'TRANSFERRED_MONEY_TO'
  | 'PRESENT_AT'
  | 'OBSERVED_AT';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases?: string[];
  riskScore?: number; // 0-100 anomalous score
  details: {
    phone?: string;
    vehicleReg?: string;
    vehicleType?: string;
    owner?: string;
    organization?: string;
    accountNumber?: string;
    bankName?: string;
    address?: string;
    coordinates?: [number, number];
    status?: string;
    openingDate?: string;
    classification?: string;
    knownUsers?: string[];
    communicationCount?: number;
    cases?: string[];
    [key: string]: any;
  };
  metrics: {
    connectionCount: number;
    caseCount: number;
    anomalyFlag?: boolean;
    lastActive?: string;
  };
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number; // 0.00 - 1.00
  evidenceRecordId: string;
  timestamp: string;
  caseId: string;
  description: string;
  properties?: Record<string, any>;
}

export interface EvidenceRecord {
  id: string; // e.g. CDR-0087, VEH-0231, CASE-0142
  recordType: 'CDR' | 'SURVEILLANCE' | 'VEHICLE_LOG' | 'FINANCIAL_TXN' | 'CASE_FILE' | 'CELL_TOWER';
  title: string;
  timestamp: string;
  caseId: string;
  confidence: number;
  description: string;
  sourceSystem: string;
  classification: string;
  rawDetails: {
    primaryEntities: string[];
    location?: string;
    durationSeconds?: number;
    amount?: number;
    currency?: string;
    officerNotes?: string;
    metadata?: Record<string, any>;
  };
  verifiedByHuman: boolean;
}

export interface InvestigativeLead {
  id: string;
  title: string; // e.g. "Rahul Sharma ↔ Amit Kumar"
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string; // e.g. "Indirect multi-hop relationship"
  pathLength: number; // e.g. 4 hops
  confidenceScore: number; // 87% -> 0.87
  supportingRecordCount: number;
  relatedCaseCount: number;
  whyFlagged: string[];
  path: Array<{
    entityId: string;
    entityName: string;
    entityType: EntityType;
    stepEdge?: {
      relationshipType: RelationshipType;
      evidenceId: string;
      confidence: number;
    };
  }>;
  evidenceRecordIds: string[];
  timestamp: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'DISMISSED';
  investigatorNotes?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  displayDate: string;
  displayTime: string;
  category: 'Communication' | 'Vehicle' | 'Transaction' | 'Location' | 'Case' | 'Event';
  title: string;
  description: string;
  sourceEntityId: string;
  targetEntityId?: string;
  evidenceRecordId: string;
  caseId: string;
}

export interface SystemStats {
  totalRecords: number;
  totalEntities: number;
  totalRelationships: number;
  activeCases: number;
  potentialLeads: number;
  anomalousPatterns: number;
  systemStatus: 'ONLINE' | 'DEGRADED' | 'PROCESSING';
  datasetName: string;
  lastUpdated: string;
}

export interface IngestionStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metric?: string;
}

export interface FilterState {
  searchQuery: string;
  entityTypes: EntityType[];
  relationshipTypes: RelationshipType[];
  minConfidence: number;
  maxHops: number;
  selectedCaseId: string | 'ALL';
  dateRange: [string, string];
}

export interface IngestionBatchFile {
  id: string;
  name: string;
  type: string;
  size: string;
  recordCategory: string;
  recordsCount: number;
  status: 'PENDING' | 'VALIDATING' | 'EXTRACTING' | 'RESOLVED' | 'COMPLETE';
}
