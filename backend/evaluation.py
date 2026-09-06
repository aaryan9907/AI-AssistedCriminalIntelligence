"""
Ground Truth Evaluation Engine for Hidden Relationship Recovery
SIH26189 – AI-Powered Criminal Network Analysis System
"""

import os
import csv
from typing import Dict, List, Any
try:
    from graph_engine import IntelGraphEngine
except ImportError:
    from backend.graph_engine import IntelGraphEngine

def evaluate_ground_truth(engine: IntelGraphEngine, gt_path: str = None) -> Dict[str, Any]:
    """
    Evaluates the hidden relationship discovery engine against ground-truth hidden relationships.
    Strictly reads ground truth for evaluation only (no leakage into search algorithm).
    """
    if not gt_path:
        gt_path = os.path.join(os.path.dirname(__file__), 'data', 'ground_truth_hidden_relationships.csv')

    if not os.path.exists(gt_path):
        return {
            "error": "Ground truth file not found",
            "total_relationships": 0,
            "recovered": 0,
            "recovery_rate": 0.0,
            "top1_recovery": 0,
            "top3_recovery": 0,
            "top5_recovery": 0,
            "results": []
        }

    with open(gt_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        gt_records = list(reader)

    total_count = len(gt_records)
    recovered_count = 0
    top1_count = 0
    top3_count = 0
    top5_count = 0
    detailed_results = []

    for gt in gt_records:
        rel_id = gt.get('ground_truth_id') or gt.get('id')
        src_id = gt['source_entity_id']
        tgt_id = gt['target_entity_id']
        expected_hops = int(gt.get('expected_hops') or 3)
        expected_path_str = gt.get('expected_path', '')
        supp_raw = gt.get('supporting_record_ids') or gt.get('expected_supporting_records', '')
        expected_records = [r.strip() for r in supp_raw.replace('"', '').split(',') if r.strip()]

        src_ent = engine.entities.get(src_id, {})
        tgt_ent = engine.entities.get(tgt_id, {})
        src_name = gt.get('source_name') or src_ent.get('name', src_id)
        tgt_name = gt.get('target_name') or tgt_ent.get('name', tgt_id)
        cat = gt.get('expected_relationship') or gt.get('relationship_category', 'UNKNOWN')

        # Run production discovery algorithm from source entity (Max 5 hops, Top 5 leads)
        discovery_result = engine.find_hidden_relationships(src_id, max_hops=5, limit=5)
        leads = discovery_result.get('leads', [])

        recovered = False
        rank = None
        matched_lead = None

        for idx, lead in enumerate(leads):
            candidate_tgt = lead['target_entity']['id']
            if candidate_tgt == tgt_id:
                recovered = True
                rank = idx + 1
                matched_lead = lead
                break

        if recovered:
            recovered_count += 1
            if rank == 1:
                top1_count += 1
            if rank <= 3:
                top3_count += 1
            if rank <= 5:
                top5_count += 1

        detailed_results.append({
            "id": rel_id,
            "source_id": src_id,
            "source_name": src_name,
            "target_id": tgt_id,
            "target_name": tgt_name,
            "category": cat,
            "difficulty": gt.get('difficulty', 'medium'),
            "expected_hops": expected_hops,
            "expected_path": expected_path_str,
            "recovered": recovered,
            "rank": rank,
            "discovered_path": " -> ".join([s["entityName"] for s in matched_lead["path"]]) if matched_lead else None,
            "discovered_hops": matched_lead["path_length"] if matched_lead else None,
            "discovered_score": matched_lead["path_score"] if matched_lead else None,
            "discovered_category": matched_lead.get("category") if matched_lead else None,
            "supporting_records": matched_lead["supporting_records"] if matched_lead else [],
            "why_flagged": matched_lead["why_flagged"] if matched_lead else []
        })

    recovery_rate = (recovered_count / total_count) if total_count > 0 else 0.0

    return {
        "total_relationships": total_count,
        "recovered": recovered_count,
        "recovery_rate": round(recovery_rate, 4),
        "recovery_percentage": f"{round(recovery_rate * 100, 1)}%",
        "top1_recovery": top1_count,
        "top1_rate": round(top1_count / total_count, 4) if total_count > 0 else 0.0,
        "top3_recovery": top3_count,
        "top3_rate": round(top3_count / total_count, 4) if total_count > 0 else 0.0,
        "top5_recovery": top5_count,
        "top5_rate": round(top5_count / total_count, 4) if total_count > 0 else 0.0,
        "results": detailed_results
    }

if __name__ == "__main__":
    eng = IntelGraphEngine()
    eval_res = evaluate_ground_truth(eng)
    print("\n========================================================")
    print(" GROUND TRUTH HIDDEN RELATIONSHIP EVALUATION REPORT")
    print("========================================================")
    print(f"Total Tested Relationships: {eval_res['total_relationships']}")
    print(f"Recovered:                  {eval_res['recovered']} / {eval_res['total_relationships']} ({eval_res['recovery_percentage']})")
    print(f"Top-1 Recovery:             {eval_res['top1_recovery']} / {eval_res['total_relationships']}")
    print(f"Top-3 Recovery:             {eval_res['top3_recovery']} / {eval_res['total_relationships']}")
    print(f"Top-5 Recovery:             {eval_res['top5_recovery']} / {eval_res['total_relationships']}")
    print("--------------------------------------------------------")
    for r in eval_res['results']:
        status = f"✓ RECOVERED (Rank #{r['rank']})" if r['recovered'] else "✗ MISSED"
        print(f"[{r['id']}] {r['source_name']} -> {r['target_name']}: {status}")
        if r['recovered']:
            print(f"      Discovered Path: {r['discovered_path']} ({r['discovered_hops']} hops, Score: {r['discovered_score']})")
        else:
            print(f"      Expected Path:   {r['expected_path']}")
    print("========================================================\n")
