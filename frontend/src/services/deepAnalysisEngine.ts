/**
 * Deep Multi-Dimensional Hidden Relationship Analysis Engine
 * SIH26189 – AI-Assisted Criminal Network Link Discovery Platform
 *
 * Implements graph algorithms for:
 * 1. Multi-Hop Indirect Suspect Trails (2 to 5 hops)
 * 2. Shared Conduit & Intermediary Detection (Burner Phones, Bank Accounts, Vehicles, Co-Locations)
 * 3. Critical Nexus Bridge / Broker Identification
 * 4. Targeted Deep Entity-to-Entity Pathfinding
 */

import { NexusNode, NexusEdge, NexusEvidence } from './nexusData';

export type HiddenRelationshipCategory = 
  | 'MULTI_HOP_TRAIL'
  | 'SHARED_PHONE'
  | 'FINANCIAL_CONDUIT'
  | 'CO_LOCATION'
  | 'SHARED_VEHICLE'
  | 'CRITICAL_BROKER';

export interface PathStep {
  entityId: string;
  entityName: string;
  entityType: string;
  viaEdgeLabel?: string;
  viaCategory?: string;
  viaEvidenceId?: string;
  confidence?: number;
}

export interface DiscoveredHiddenRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  sourceNodeName?: string;
  targetNodeName?: string;
  sourceType: string;
  targetType: string;
  category: HiddenRelationshipCategory;
  categoryLabel: string;
  categoryTitle?: string;
  title: string;
  narrative: string;
  discoverySummary?: string;
  confidence: number;
  hops: number;
  hopCount?: number;
  pathNodeIds: string[];
  pathEdgeIds: string[];
  pathSteps: PathStep[];
  pathBreadcrumb?: PathStep[];
  intermediaryEntities: Array<{
    id: string;
    name: string;
    type: string;
    role: string;
  }>;
  intermediaryValue?: string;
  corroboratingEvidenceCount?: number;
  evidenceRecordIds: string[];
  evidenceSnippets: string[];
  caseDocket: string;
  riskRating: 'HIGH' | 'MEDIUM' | 'ELEVATED';
  detectedAt: string;
}

export const HIDDEN_CATEGORY_METADATA: Record<
  HiddenRelationshipCategory,
  { label: string; tone: 'warn' | 'signal' | 'safe' | 'azure'; icon: string }
> = {
  MULTI_HOP_TRAIL: { label: 'MULTI-HOP TRAIL', tone: 'warn', icon: '⚡' },
  SHARED_PHONE: { label: 'SHARED PHONE', tone: 'azure', icon: '◇' },
  FINANCIAL_CONDUIT: { label: 'FINANCIAL FLOW', tone: 'safe', icon: '◌' },
  CO_LOCATION: { label: 'CO-LOCATION', tone: 'signal', icon: '◎' },
  SHARED_VEHICLE: { label: 'SHARED VEHICLE', tone: 'safe', icon: '◈' },
  CRITICAL_BROKER: { label: 'CRITICAL BROKER', tone: 'warn', icon: '▤' },
};

export const CATEGORY_META: Record<
  HiddenRelationshipCategory,
  { title: string; tone: 'warn' | 'signal' | 'safe' | 'azure'; icon: string }
> = {
  MULTI_HOP_TRAIL: { title: 'MULTI-HOP TRAIL', tone: 'warn', icon: '⚡' },
  SHARED_PHONE: { title: 'SHARED PHONE SIM', tone: 'azure', icon: '◇' },
  FINANCIAL_CONDUIT: { title: 'FINANCIAL CONDUIT', tone: 'safe', icon: '◌' },
  CO_LOCATION: { title: 'CO-LOCATION POINT', tone: 'signal', icon: '◎' },
  SHARED_VEHICLE: { title: 'SHARED VEHICLE ASSET', tone: 'safe', icon: '◈' },
  CRITICAL_BROKER: { title: 'CRITICAL BROKER NEXUS', tone: 'warn', icon: '▤' },
};

/**
 * Discovers all hidden relationships across a graph topology.
 */
export function discoverAllHiddenRelationships(
  nodes: NexusNode[],
  edges: NexusEdge[],
  evidence: NexusEvidence[] = []
): DiscoveredHiddenRelationship[] {
  if (nodes.length < 2 || edges.length === 0) {
    return [];
  }

  const nodeMap = new Map<string, NexusNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build Adjacency List & Edge Lookup
  const adj = new Map<string, Array<{ neighborId: string; edge: NexusEdge }>>();
  const directEdgeSet = new Set<string>();

  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push({ neighborId: e.target, edge: e });
    adj.get(e.target)!.push({ neighborId: e.source, edge: e });

    directEdgeSet.add(`${e.source}::${e.target}`);
    directEdgeSet.add(`${e.target}::${e.source}`);
  });

  const discovered: DiscoveredHiddenRelationship[] = [];
  const discoveredKeySet = new Set<string>();

  const addDiscovered = (rel: DiscoveredHiddenRelationship) => {
    const key1 = `${rel.sourceId}::${rel.targetId}::${rel.category}`;
    const key2 = `${rel.targetId}::${rel.sourceId}::${rel.category}`;
    if (!discoveredKeySet.has(key1) && !discoveredKeySet.has(key2)) {
      discoveredKeySet.add(key1);
      discoveredKeySet.add(key2);
      discovered.push(rel);
    }
  };

  // -------------------------------------------------------------
  // 1. Common Intermediary Detection (2-hop shared conduits)
  // -------------------------------------------------------------
  nodes.forEach((intermediary) => {
    // Case dockets are formal case files, not covert intelligence intermediaries
    if (intermediary.type === 'CASE') return;

    const connected = adj.get(intermediary.id) || [];
    if (connected.length < 2) return;

    // Pairs of entities connected to this intermediary
    for (let i = 0; i < connected.length; i++) {
      for (let j = i + 1; j < connected.length; j++) {
        const u = connected[i].neighborId;
        const v = connected[j].neighborId;
        if (u === v) continue;

        // Only interested if they DO NOT have a direct connection (truly hidden link!)
        if (directEdgeSet.has(`${u}::${v}`)) continue;

        const nodeU = nodeMap.get(u);
        const nodeV = nodeMap.get(v);
        if (!nodeU || !nodeV) continue;

        // Case files, phones, and locations cannot be endpoints in hidden intelligence leads
        if (nodeU.type === 'CASE' || nodeV.type === 'CASE') continue;
        if (nodeU.type === 'PHONE' || nodeV.type === 'PHONE') continue;
        if (nodeU.type === 'LOCATION' || nodeV.type === 'LOCATION') continue;

        const isUPerson = nodeU.type === 'PERSON';
        const isVPerson = nodeV.type === 'PERSON';

        // 1. For PHONE, VEHICLE, LOCATION, and PERSON intermediaries:
        // BOTH endpoints must be PERSON suspects (e.g. 2 suspects sharing a vehicle or phone)
        if (
          (intermediary.type === 'PHONE' || intermediary.type === 'VEHICLE' || intermediary.type === 'LOCATION' || intermediary.type === 'PERSON') &&
          (!isUPerson || !isVPerson)
        ) {
          continue;
        }

        // 2. For FINANCIAL (BANK ACCOUNT or ORGANIZATION) intermediaries:
        // At least one endpoint must be PERSON
        if (intermediary.type === 'BANK ACCOUNT' || intermediary.type === 'ORGANIZATION') {
          if (!isUPerson && !isVPerson) continue;
        }

        const edge1 = connected[i].edge;
        const edge2 = connected[j].edge;

        let cat: HiddenRelationshipCategory = 'MULTI_HOP_TRAIL';
        let title = `Shared Intermediary: ${nodeU.name} ↔ ${nodeV.name}`;
        let narrative = `Indirect link discovered between ${nodeU.name} and ${nodeV.name} through common intermediary ${intermediary.name}.`;

        if (intermediary.type === 'PHONE') {
          cat = 'SHARED_PHONE';
          title = `Shared Communications Conduit: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `Both ${nodeU.name} and ${nodeV.name} have indirect communications through proxy phone ${intermediary.name} (${intermediary.subtitle}), indicating a shared burner device or communications relay.`;
        } else if (intermediary.type === 'VEHICLE') {
          cat = 'SHARED_VEHICLE';
          title = `Shared Transit Asset: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `Surveillance logs link both ${nodeU.name} and ${nodeV.name} to vehicle asset ${intermediary.name} (${intermediary.subtitle}) without direct communication on record.`;
        } else if (intermediary.type === 'BANK ACCOUNT') {
          cat = 'FINANCIAL_CONDUIT';
          title = `Financial Money Conduit: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `Financial transaction convergence: both ${nodeU.name} and ${nodeV.name} routed capital flows through account ${intermediary.name} (${intermediary.subtitle}).`;
        } else if (intermediary.type === 'ORGANIZATION') {
          cat = 'FINANCIAL_CONDUIT';
          title = `Corporate Shell Conduit: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `Corporate registry intelligence links ${nodeU.name} and ${nodeV.name} to commercial entity ${intermediary.name} (${intermediary.subtitle}) as a common operational shell.`;
        } else if (intermediary.type === 'LOCATION') {
          cat = 'CO_LOCATION';
          title = `Spatial-Temporal Convergence: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `Both ${nodeU.name} and ${nodeV.name} were observed or intercepted within surveillance sector ${intermediary.name} (${intermediary.subtitle}).`;
        } else if (intermediary.type === 'PERSON') {
          cat = 'CRITICAL_BROKER';
          title = `Critical Broker Liaison: ${nodeU.name} ↔ ${nodeV.name}`;
          narrative = `${intermediary.name} acts as a key intermediary liaison bridging ${nodeU.name} and ${nodeV.name} without direct contact between them.`;
        }

        const compositeConfidence = Math.min(
          0.96,
          (edge1.confidence + edge2.confidence) / 2 * 0.98
        );

        const steps = [
          { entityId: u, entityName: nodeU.name, entityType: nodeU.type, viaEdgeLabel: edge1.label, viaCategory: edge1.category, viaEvidenceId: edge1.recordId, confidence: edge1.confidence },
          { entityId: intermediary.id, entityName: intermediary.name, entityType: intermediary.type, viaEdgeLabel: edge2.label, viaCategory: edge2.category, viaEvidenceId: edge2.recordId, confidence: edge2.confidence },
          { entityId: v, entityName: nodeV.name, entityType: nodeV.type }
        ];

        addDiscovered({
          id: `HIDDEN-2HOP-${discovered.length + 1}`,
          sourceId: u,
          targetId: v,
          sourceNodeId: u,
          targetNodeId: v,
          sourceName: nodeU.name,
          targetName: nodeV.name,
          sourceNodeName: nodeU.name,
          targetNodeName: nodeV.name,
          sourceType: nodeU.type,
          targetType: nodeV.type,
          category: cat,
          categoryLabel: HIDDEN_CATEGORY_METADATA[cat].label,
          categoryTitle: CATEGORY_META[cat].title,
          title,
          narrative,
          discoverySummary: narrative,
          confidence: Number(compositeConfidence.toFixed(2)),
          hops: 2,
          hopCount: 2,
          pathNodeIds: [u, intermediary.id, v],
          pathEdgeIds: [edge1.id, edge2.id],
          pathSteps: steps,
          pathBreadcrumb: steps,
          intermediaryEntities: [
            { id: intermediary.id, name: intermediary.name, type: intermediary.type, role: intermediary.subtitle }
          ],
          intermediaryValue: intermediary.name,
          corroboratingEvidenceCount: 2,
          evidenceRecordIds: [edge1.recordId, edge2.recordId],
          evidenceSnippets: [
            `${edge1.label}: ${nodeU.name} ↔ ${intermediary.name} (${edge1.sourceType || 'Record'})`,
            `${edge2.label}: ${intermediary.name} ↔ ${nodeV.name} (${edge2.sourceType || 'Record'})`
          ],
          caseDocket: edge1.caseId || edge2.caseId || 'CR-2026-0142',
          riskRating: compositeConfidence > 0.85 ? 'HIGH' : 'MEDIUM',
          detectedAt: edge1.date || '2026-03-12'
        });
      }
    }
  });

  // -------------------------------------------------------------
  // 2. Multi-Hop Indirect Suspect Trails (3 to 4 hops)
  // -------------------------------------------------------------
  // Focus multi-hop trails strictly between Persons or Person ↔ Financial Target
  const personNodes = nodes.filter((n) => n.type === 'PERSON');
  const candidateNodes = personNodes.length >= 2 
    ? personNodes.slice(0, 8) 
    : nodes.filter((n) => n.type === 'PERSON' || n.type === 'ORGANIZATION' || n.type === 'BANK ACCOUNT').slice(0, 8);

  for (let i = 0; i < candidateNodes.length; i++) {
    for (let j = i + 1; j < candidateNodes.length; j++) {
      const srcNode = candidateNodes[i];
      const tgtNode = candidateNodes[j];

      // At least one must be a person, and neither can be phone/location/case
      if (srcNode.type !== 'PERSON' && tgtNode.type !== 'PERSON') continue;
      if (directEdgeSet.has(`${srcNode.id}::${tgtNode.id}`)) continue;

      const pathResult = findDeepPathsBetween(srcNode.id, tgtNode.id, nodes, edges, 4);
      if (pathResult.length > 0) {
        const bestPath = pathResult[0];
        if (bestPath.hops >= 3) {
          addDiscovered(bestPath);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Fallback / Guarantee: If graph is sparse, generate meaningful trail
  // -------------------------------------------------------------
  if (discovered.length === 0 && nodes.length >= 3 && edges.length >= 2) {
    const p1 = nodes[0];
    const pEnd = nodes[nodes.length - 1];
    const fallbackPath = findDeepPathsBetween(p1.id, pEnd.id, nodes, edges, 4);
    if (fallbackPath.length > 0) {
      addDiscovered(fallbackPath[0]);
    }
  }

  // Sort by confidence & importance descending
  return discovered.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Finds all simple paths up to `maxHops` between two specific entities.
 */
export function findDeepPathsBetween(
  sourceId: string,
  targetId: string,
  nodes: NexusNode[],
  edges: NexusEdge[],
  maxHops: number = 4
): DiscoveredHiddenRelationship[] {
  if (sourceId === targetId) return [];

  const nodeMap = new Map<string, NexusNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const srcNode = nodeMap.get(sourceId);
  const tgtNode = nodeMap.get(targetId);
  if (!srcNode || !tgtNode) return [];

  const adj = new Map<string, Array<{ neighborId: string; edge: NexusEdge }>>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push({ neighborId: e.target, edge: e });
    adj.get(e.target)!.push({ neighborId: e.source, edge: e });
  });

  const discoveredPaths: DiscoveredHiddenRelationship[] = [];

  // BFS with path tracking
  interface QueueItem {
    currentId: string;
    pathNodes: string[];
    pathEdges: NexusEdge[];
  }

  const queue: QueueItem[] = [{ currentId: sourceId, pathNodes: [sourceId], pathEdges: [] }];

  while (queue.length > 0 && discoveredPaths.length < 5) {
    const { currentId, pathNodes, pathEdges } = queue.shift()!;

    if (currentId === targetId && pathNodes.length >= 3) {
      // Reached target via 2+ hops
      const hops = pathNodes.length - 1;
      
      // Calculate composite confidence
      let confProduct = 1.0;
      pathEdges.forEach((e) => {
        confProduct *= e.confidence || 0.85;
      });
      const hopDiscount = 1 - (hops - 1) * 0.04;
      const finalConfidence = Math.max(0.65, Math.min(0.98, confProduct * hopDiscount));

      // Build path steps
      const steps: PathStep[] = [];
      for (let s = 0; s < pathNodes.length; s++) {
        const nId = pathNodes[s];
        const n = nodeMap.get(nId)!;
        const step: PathStep = {
          entityId: n.id,
          entityName: n.name,
          entityType: n.type
        };
        if (s < pathEdges.length) {
          const e = pathEdges[s];
          step.viaEdgeLabel = e.label;
          step.viaCategory = e.category;
          step.viaEvidenceId = e.recordId;
          step.confidence = e.confidence;
        }
        steps.push(step);
      }

      // Intermediaries
      const intermediaries = pathNodes.slice(1, -1).map((id) => {
        const n = nodeMap.get(id)!;
        return {
          id: n.id,
          name: n.name,
          type: n.type,
          role: n.subtitle
        };
      });

      const trailName = intermediaries.map((i) => i.name).join(' ➔ ');
      const title = `${hops}-Hop Hidden Trail: ${srcNode.name} ↔ ${tgtNode.name}`;
      const narrative = `Discovered indirect link across ${hops} hops via [${trailName}]. No direct record links these two subjects, but cross-referencing multi-modal intelligence establishes an investigative connection.`;

      discoveredPaths.push({
        id: `DEEP-PATH-${sourceId}-${targetId}-${discoveredPaths.length + 1}`,
        sourceId,
        targetId,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        sourceName: srcNode.name,
        targetName: tgtNode.name,
        sourceNodeName: srcNode.name,
        targetNodeName: tgtNode.name,
        sourceType: srcNode.type,
        targetType: tgtNode.type,
        category: 'MULTI_HOP_TRAIL',
        categoryLabel: `${hops}-HOP TRAIL`,
        categoryTitle: `${hops}-HOP INDIRECT TRAIL`,
        title,
        narrative,
        discoverySummary: narrative,
        confidence: Number(finalConfidence.toFixed(2)),
        hops,
        hopCount: hops,
        pathNodeIds: [...pathNodes],
        pathEdgeIds: pathEdges.map((e) => e.id),
        pathSteps: steps,
        pathBreadcrumb: steps,
        intermediaryEntities: intermediaries,
        intermediaryValue: intermediaries[0]?.name,
        corroboratingEvidenceCount: pathEdges.length,
        evidenceRecordIds: pathEdges.map((e) => e.recordId),
        evidenceSnippets: pathEdges.map((e, idx) => {
          const sName = nodeMap.get(pathNodes[idx])?.name || pathNodes[idx];
          const tName = nodeMap.get(pathNodes[idx + 1])?.name || pathNodes[idx + 1];
          return `${e.label}: ${sName} ↔ ${tName} (${e.sourceType || 'Intelligence Log'})`;
        }),
        caseDocket: pathEdges[0]?.caseId || 'CR-2026-0142',
        riskRating: finalConfidence > 0.8 ? 'HIGH' : 'MEDIUM',
        detectedAt: pathEdges[pathEdges.length - 1]?.date || '2026-03-12'
      });
      continue;
    }

    if (pathNodes.length - 1 >= maxHops) continue;

    const neighbors = adj.get(currentId) || [];
    for (const { neighborId, edge } of neighbors) {
      if (!pathNodes.includes(neighborId)) {
        queue.push({
          currentId: neighborId,
          pathNodes: [...pathNodes, neighborId],
          pathEdges: [...pathEdges, edge]
        });
      }
    }
  }

  return discoveredPaths;
}

/**
 * Pre-computed high-fidelity baseline hidden relationships for default demo data
 */
export const BASELINE_HIDDEN_RELATIONSHIPS: DiscoveredHiddenRelationship[] = [
  {
    id: 'HIDDEN-BASE-01',
    sourceId: 'P-014',
    targetId: 'P-052',
    sourceNodeId: 'P-014',
    targetNodeId: 'P-052',
    sourceName: 'Rahul Sharma',
    targetName: 'Amit Kumar',
    sourceNodeName: 'Rahul Sharma',
    targetNodeName: 'Amit Kumar',
    sourceType: 'PERSON',
    targetType: 'PERSON',
    category: 'MULTI_HOP_TRAIL',
    categoryLabel: '4-HOP MULTI-MODAL TRAIL',
    categoryTitle: '4-HOP INDIRECT SUSPECT TRAIL',
    title: 'Primary Coordination Conduit: Rahul Sharma ↔ Amit Kumar',
    narrative: 'Cross-docket link discovered across 4 distinct intelligence hops: Rahul Sharma contacted Burner Phone X, which communicated with Vikram Singh, who operates Vehicle V co-occupied by Amit Kumar. No direct communication exists between Rahul and Amit.',
    discoverySummary: 'Cross-docket link discovered across 4 distinct intelligence hops: Rahul Sharma contacted Burner Phone X, which communicated with Vikram Singh, who operates Vehicle V co-occupied by Amit Kumar. No direct communication exists between Rahul and Amit.',
    confidence: 0.94,
    hops: 4,
    hopCount: 4,
    pathNodeIds: ['P-014', 'PH-021', 'P-037', 'V-009', 'P-052'],
    pathEdgeIds: ['e1', 'e2', 'e3', 'e4'],
    pathSteps: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0087', confidence: 0.94 },
      { entityId: 'PH-021', entityName: 'Phone X', entityType: 'PHONE', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0112', confidence: 0.91 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'OBSERVED_WITH', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0240', confidence: 0.86 },
      { entityId: 'P-052', entityName: 'Amit Kumar', entityType: 'PERSON' }
    ],
    pathBreadcrumb: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0087', confidence: 0.94 },
      { entityId: 'PH-021', entityName: 'Phone X', entityType: 'PHONE', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0112', confidence: 0.91 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'OBSERVED_WITH', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0240', confidence: 0.86 },
      { entityId: 'P-052', entityName: 'Amit Kumar', entityType: 'PERSON' }
    ],
    intermediaryEntities: [
      { id: 'PH-021', name: 'Phone X', type: 'PHONE', role: '+91 98••• 0421 (Burner SIM)' },
      { id: 'P-037', name: 'Vikram Singh', type: 'PERSON', role: 'Syndicate Intermediary' },
      { id: 'V-009', name: 'Vehicle V', type: 'VEHICLE', role: 'MH 04 KX 231 (Transit Asset)' }
    ],
    intermediaryValue: 'Phone X (Burner SIM)',
    corroboratingEvidenceCount: 4,
    evidenceRecordIds: ['CDR-0087', 'CDR-0112', 'VEH-0231', 'VEH-0240'],
    evidenceSnippets: [
      'CDR-0087: Telecom CDR logs voice call between Rahul Sharma and Phone X',
      'CDR-0112: Telecom CDR logs secondary voice call between Phone X and Vikram Singh',
      'VEH-0231: Field observation confirms Vikram Singh operating Vehicle V',
      'VEH-0240: ANPR / CCTV sighting captures Amit Kumar occupying Vehicle V'
    ],
    caseDocket: 'CR-2026-0142',
    riskRating: 'HIGH',
    detectedAt: '2026-03-12'
  },
  {
    id: 'HIDDEN-BASE-02',
    sourceId: 'P-014',
    targetId: 'P-037',
    sourceNodeId: 'P-014',
    targetNodeId: 'P-037',
    sourceName: 'Rahul Sharma',
    targetName: 'Vikram Singh',
    sourceNodeName: 'Rahul Sharma',
    targetNodeName: 'Vikram Singh',
    sourceType: 'PERSON',
    targetType: 'PERSON',
    category: 'SHARED_PHONE',
    categoryLabel: 'SHARED PHONE',
    categoryTitle: 'SHARED PHONE CONDUIT',
    title: 'Shared Communications Conduit: Rahul Sharma ↔ Vikram Singh',
    narrative: 'Both Rahul Sharma and Vikram Singh communicate through burner phone device Phone X (+91 98••• 0421). No direct communication exists between the two suspects, pointing to a covert communication proxy relay.',
    discoverySummary: 'Both Rahul Sharma and Vikram Singh communicate through burner phone device Phone X (+91 98••• 0421). No direct communication exists between the two suspects, pointing to a covert communication proxy relay.',
    confidence: 0.93,
    hops: 2,
    hopCount: 2,
    pathNodeIds: ['P-014', 'PH-021', 'P-037'],
    pathEdgeIds: ['e1', 'e2'],
    pathSteps: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0087', confidence: 0.94 },
      { entityId: 'PH-021', entityName: 'Phone X', entityType: 'PHONE', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0112', confidence: 0.91 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON' }
    ],
    pathBreadcrumb: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0087', confidence: 0.94 },
      { entityId: 'PH-021', entityName: 'Phone X', entityType: 'PHONE', viaEdgeLabel: 'COMMUNICATED_WITH', viaCategory: 'COMMUNICATION', viaEvidenceId: 'CDR-0112', confidence: 0.91 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON' }
    ],
    intermediaryEntities: [
      { id: 'PH-021', name: 'Phone X', type: 'PHONE', role: '+91 98••• 0421 (Burner SIM)' }
    ],
    intermediaryValue: 'Phone X (+91 98••• 0421)',
    corroboratingEvidenceCount: 2,
    evidenceRecordIds: ['CDR-0087', 'CDR-0112'],
    evidenceSnippets: [
      'CDR-0087: Rahul Sharma voice call to Phone X at 23:41 IST',
      'CDR-0112: Phone X relay communication to Vikram Singh at 23:48 IST'
    ],
    caseDocket: 'CR-2026-0142',
    riskRating: 'HIGH',
    detectedAt: '2026-03-12'
  },
  {
    id: 'HIDDEN-BASE-03',
    sourceId: 'P-037',
    targetId: 'P-052',
    sourceNodeId: 'P-037',
    targetNodeId: 'P-052',
    sourceName: 'Vikram Singh',
    targetName: 'Amit Kumar',
    sourceNodeName: 'Vikram Singh',
    targetNodeName: 'Amit Kumar',
    sourceType: 'PERSON',
    targetType: 'PERSON',
    category: 'SHARED_VEHICLE',
    categoryLabel: 'SHARED VEHICLE',
    categoryTitle: 'SHARED VEHICLE ASSET',
    title: 'Shared Transit Asset: Vikram Singh ↔ Amit Kumar',
    narrative: 'Surveillance and ANPR logs link both Vikram Singh and Amit Kumar to transit vehicle Vehicle V (MH 04 KX 231) without any direct phone call recorded between them.',
    discoverySummary: 'Surveillance and ANPR logs link both Vikram Singh and Amit Kumar to transit vehicle Vehicle V (MH 04 KX 231) without any direct phone call recorded between them.',
    confidence: 0.90,
    hops: 2,
    hopCount: 2,
    pathNodeIds: ['P-037', 'V-009', 'P-052'],
    pathEdgeIds: ['e3', 'e4'],
    pathSteps: [
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'OBSERVED_WITH', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0240', confidence: 0.86 },
      { entityId: 'P-052', entityName: 'Amit Kumar', entityType: 'PERSON' }
    ],
    pathBreadcrumb: [
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'OBSERVED_WITH', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0240', confidence: 0.86 },
      { entityId: 'P-052', entityName: 'Amit Kumar', entityType: 'PERSON' }
    ],
    intermediaryEntities: [
      { id: 'V-009', name: 'Vehicle V', type: 'VEHICLE', role: 'MH 04 KX 231 (Transit Asset)' }
    ],
    intermediaryValue: 'Vehicle V (MH 04 KX 231)',
    corroboratingEvidenceCount: 2,
    evidenceRecordIds: ['VEH-0231', 'VEH-0240'],
    evidenceSnippets: [
      'VEH-0231: Field observation confirms Vikram Singh operating Vehicle V',
      'VEH-0240: ANPR / CCTV sighting captures Amit Kumar occupying Vehicle V'
    ],
    caseDocket: 'CR-2026-0142',
    riskRating: 'HIGH',
    detectedAt: '2026-03-12'
  },
  {
    id: 'HIDDEN-BASE-04',
    sourceId: 'P-037',
    targetId: 'BA-11',
    sourceNodeId: 'P-037',
    targetNodeId: 'BA-11',
    sourceName: 'Vikram Singh',
    targetName: 'Account A',
    sourceNodeName: 'Vikram Singh',
    targetNodeName: 'Account A',
    sourceType: 'PERSON',
    targetType: 'BANK ACCOUNT',
    category: 'FINANCIAL_CONDUIT',
    categoryLabel: 'FINANCIAL FLOW',
    categoryTitle: 'FINANCIAL CONDUIT',
    title: 'Financial Money Conduit: Vikram Singh ↔ Account A',
    narrative: 'Corporate filings and banking wire transfers connect Vikram Singh to Account A via commercial shell entity Organization N, indicating corporate fund diversion and money mule routing.',
    discoverySummary: 'Corporate filings and banking wire transfers connect Vikram Singh to Account A via commercial shell entity Organization N, indicating corporate fund diversion and money mule routing.',
    confidence: 0.88,
    hops: 2,
    hopCount: 2,
    pathNodeIds: ['P-037', 'O-003', 'BA-11'],
    pathEdgeIds: ['e6', 'e9'],
    pathSteps: [
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'MEMBER_OF', viaCategory: 'ORGANIZATION', viaEvidenceId: 'ORG-0022', confidence: 0.77 },
      { entityId: 'O-003', entityName: 'Organization N', entityType: 'ORGANIZATION', viaEdgeLabel: 'TRANSFERRED_MONEY_TO', viaCategory: 'FINANCIAL', viaEvidenceId: 'FIN-0192', confidence: 0.83 },
      { entityId: 'BA-11', entityName: 'Account A', entityType: 'BANK ACCOUNT' }
    ],
    pathBreadcrumb: [
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON', viaEdgeLabel: 'MEMBER_OF', viaCategory: 'ORGANIZATION', viaEvidenceId: 'ORG-0022', confidence: 0.77 },
      { entityId: 'O-003', entityName: 'Organization N', entityType: 'ORGANIZATION', viaEdgeLabel: 'TRANSFERRED_MONEY_TO', viaCategory: 'FINANCIAL', viaEvidenceId: 'FIN-0192', confidence: 0.83 },
      { entityId: 'BA-11', entityName: 'Account A', entityType: 'BANK ACCOUNT' }
    ],
    intermediaryEntities: [
      { id: 'O-003', name: 'Organization N', type: 'ORGANIZATION', role: 'Commercial Shell Entity' }
    ],
    intermediaryValue: 'Organization N (Commercial Shell Entity)',
    corroboratingEvidenceCount: 2,
    evidenceRecordIds: ['ORG-0022', 'FIN-0192'],
    evidenceSnippets: [
      'ORG-0022: Corporate registry lists Vikram Singh as key managing director of Organization N',
      'FIN-0192: Banking wire log records transfers from Account A to Organization N'
    ],
    caseDocket: 'CR-2026-0142',
    riskRating: 'MEDIUM',
    detectedAt: '2026-02-10'
  },
  {
    id: 'HIDDEN-BASE-05',
    sourceId: 'P-014',
    targetId: 'P-037',
    sourceNodeId: 'P-014',
    targetNodeId: 'P-037',
    sourceName: 'Rahul Sharma',
    targetName: 'Vikram Singh',
    sourceNodeName: 'Rahul Sharma',
    targetNodeName: 'Vikram Singh',
    sourceType: 'PERSON',
    targetType: 'PERSON',
    category: 'CO_LOCATION',
    categoryLabel: 'CO-LOCATION',
    categoryTitle: 'CO-LOCATION POINT',
    title: 'Spatial-Temporal Convergence: Rahul Sharma ↔ Vikram Singh',
    narrative: 'Tower dump logs register Rahul Sharma at Location Z (Andheri East), where vehicle Vehicle V was logged by ANPR toll sensors, which is operated by Vikram Singh.',
    discoverySummary: 'Tower dump logs register Rahul Sharma at Location Z (Andheri East), where vehicle Vehicle V was logged by ANPR toll sensors, which is operated by Vikram Singh.',
    confidence: 0.84,
    hops: 3,
    hopCount: 3,
    pathNodeIds: ['P-014', 'L-008', 'V-009', 'P-037'],
    pathEdgeIds: ['e5', 'e10', 'e3'],
    pathSteps: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'VISITED', viaCategory: 'LOCATION', viaEvidenceId: 'LOC-0041', confidence: 0.79 },
      { entityId: 'L-008', entityName: 'Location Z', entityType: 'LOCATION', viaEdgeLabel: 'LOCATED_AT', viaCategory: 'LOCATION', viaEvidenceId: 'LOC-0052', confidence: 0.75 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON' }
    ],
    pathBreadcrumb: [
      { entityId: 'P-014', entityName: 'Rahul Sharma', entityType: 'PERSON', viaEdgeLabel: 'VISITED', viaCategory: 'LOCATION', viaEvidenceId: 'LOC-0041', confidence: 0.79 },
      { entityId: 'L-008', entityName: 'Location Z', entityType: 'LOCATION', viaEdgeLabel: 'LOCATED_AT', viaCategory: 'LOCATION', viaEvidenceId: 'LOC-0052', confidence: 0.75 },
      { entityId: 'V-009', entityName: 'Vehicle V', entityType: 'VEHICLE', viaEdgeLabel: 'USES', viaCategory: 'VEHICLE', viaEvidenceId: 'VEH-0231', confidence: 0.88 },
      { entityId: 'P-037', entityName: 'Vikram Singh', entityType: 'PERSON' }
    ],
    intermediaryEntities: [
      { id: 'L-008', name: 'Location Z', type: 'LOCATION', role: 'Andheri East Surveillance Sector' },
      { id: 'V-009', name: 'Vehicle V', type: 'VEHICLE', role: 'MH 04 KX 231 (Transit Asset)' }
    ],
    intermediaryValue: 'Location Z / Vehicle V',
    corroboratingEvidenceCount: 3,
    evidenceRecordIds: ['LOC-0041', 'LOC-0052', 'VEH-0231'],
    evidenceSnippets: [
      'LOC-0041: Tower dump verifies Rahul Sharma in Location Z sector',
      'LOC-0052: Toll plaza ANPR registers Vehicle V entering Location Z',
      'VEH-0231: Field observation confirms Vikram Singh operating Vehicle V'
    ],
    caseDocket: 'CR-2026-0142',
    riskRating: 'MEDIUM',
    detectedAt: '2026-03-12'
  }
];
