"""
Score-only diagnostic — bypasses all LLM calls by forcing deterministic fallbacks.
Tests the adaptive clamping formula in cascade_analyzer.py.
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))

import networkx as nx
from backend.models.blueprint import SystemBlueprint
from backend.models.report import BlueprintPatch

# --- Inline the deterministic score math from cascade_analyzer.py ---
def compute_score(bp: SystemBlueprint, sim_logs: list[dict]) -> dict:
    G = nx.DiGraph()
    node_map = {}
    for n in bp.nodes:
        G.add_node(n.id)
        node_map[n.id] = n
    for edge in bp.edges:
        G.add_edge(edge.from_node, edge.to_node, sync=edge.sync)

    try:
        centrality_map = nx.betweenness_centrality(G)
    except Exception:
        centrality_map = {n.id: 0.0 for n in bp.nodes}

    G_sync = nx.DiGraph()
    for node in bp.nodes:
        G_sync.add_node(node.id)
    for edge in bp.edges:
        if edge.sync:
            G_sync.add_edge(edge.from_node, edge.to_node)

    def get_longest_downstream_sync_depth(node_id, visited):
        if node_id in visited:
            return 0
        visited.add(node_id)
        max_depth = 0
        for neighbor in G_sync.successors(node_id):
            depth = 1 + get_longest_downstream_sync_depth(neighbor, visited)
            max_depth = max(max_depth, depth)
        visited.remove(node_id)
        return max_depth

    total_nodes_count = len(bp.nodes) if bp.nodes else 1
    raw_findings = []

    for idx, log in enumerate(sim_logs, start=1):
        target_node = log.get("target_node") or f"node_{idx}"
        scenario_name = log.get("scenario", f"scenario_{target_node}")

        total_reqs = log.get("total_requests", 1)
        failed_reqs = log.get("requests_failed", 0)
        severity = failed_reqs / total_reqs if total_reqs > 0 else 0.0

        affected_nodes_set = {target_node} if target_node else set()
        cascade_events = log.get("cascade_tree", [])
        for event in cascade_events:
            source = getattr(event, "source_node", None) or (event.get("source_node") if isinstance(event, dict) else None)
            affected = getattr(event, "affected_node", None) or (event.get("affected_node") if isinstance(event, dict) else None)
            if source: affected_nodes_set.add(source)
            if affected: affected_nodes_set.add(affected)

        affected_nodes_list = sorted(list(affected_nodes_set))
        blast_radius = len(affected_nodes_list) / total_nodes_count

        likelihood_val = 0.0
        breakdowns = []
        node_obj = node_map.get(target_node)
        if node_obj:
            if node_obj.retries == 0:
                likelihood_val += 0.25; breakdowns.append("retries=0")
            if not node_obj.circuit_breaker:
                likelihood_val += 0.25; breakdowns.append("no_cb")
            t_centrality = centrality_map.get(target_node, 0.0)
            if t_centrality > 0.5:
                likelihood_val += 0.20; breakdowns.append(f"centrality>{t_centrality:.2f}")
            sync_depth = get_longest_downstream_sync_depth(target_node, set())
            if sync_depth > 3:
                likelihood_val += 0.15; breakdowns.append(f"sync_depth={sync_depth}")
            node_in_degree = G.in_degree(target_node)
            if node_obj.type == "database" and node_in_degree > 2:
                likelihood_val += 0.10; breakdowns.append(f"db_indegree={node_in_degree}")
            if node_obj.type == "queue" and not node_obj.has_dlq:
                likelihood_val += 0.05; breakdowns.append("no_dlq")

        likelihood = min(1.0, likelihood_val) if breakdowns else 0.10
        initial_impact = severity * blast_radius * likelihood

        # is_patched check
        patch_template = "add_circuit_breaker"
        if node_obj:
            if node_obj.type == "queue" and not node_obj.has_dlq:
                patch_template = "add_dlq"
            elif "retry_storm" in scenario_name:
                patch_template = "adjust_retries"
        is_patched = False
        if node_obj:
            if patch_template == "add_circuit_breaker" and node_obj.circuit_breaker: is_patched = True
            elif patch_template == "add_dlq" and node_obj.has_dlq: is_patched = True
            elif patch_template == "adjust_retries" and node_obj.retries == 1: is_patched = True
        if is_patched:
            initial_impact *= 0.05

        raw_findings.append({
            "finding_id": f"F{idx}",
            "target_node": target_node,
            "severity": round(severity, 4),
            "blast_radius": round(blast_radius, 4),
            "likelihood": round(likelihood, 4),
            "likelihood_factors": breakdowns,
            "initial_impact": initial_impact,
            "affected_nodes": affected_nodes_list,
        })

    # Deduplication
    raw_findings.sort(key=lambda x: x["initial_impact"], reverse=True)
    for i in range(len(raw_findings)):
        cur = raw_findings[i]
        set_cur = set(cur["affected_nodes"])
        apply_penalty = False
        for j in range(i):
            hi = raw_findings[j]
            set_hi = set(hi["affected_nodes"])
            if set_cur and len(set_cur.intersection(set_hi)) > 0.5 * len(set_cur):
                apply_penalty = True; break
        cur["impact"] = round(cur["initial_impact"] * (0.7 if apply_penalty else 1.0), 4)

    # Adaptive score
    raw_total_impact = sum(f["impact"] for f in raw_findings)
    if raw_total_impact > 0:
        deduction = raw_total_impact * 1300
        deduction = min(deduction, 65)
        if len(raw_findings) >= 2:
            deduction = max(deduction, 30)
        resilience_score = max(0, round(100 - deduction))
    else:
        resilience_score = 85

    return {
        "score": resilience_score,
        "findings": raw_findings,
        "raw_total_impact": round(raw_total_impact, 5),
        "deduction_raw": round(raw_total_impact * 1300, 2),
    }


# --- Deterministic fallback sim logs (replicate what agents produce) ---
from backend.simulation.engine import SimulationEngine
from backend.simulation.perturbation import Perturbation, PerturbationType

def make_fallback_logs(bp: SystemBlueprint) -> list[dict]:
    """
    Produce simulation logs using hardcoded deterministic perturbations
    (no LLM agents needed) — mirrors the fallback agent behavior.
    """
    logs = []
    for i, node in enumerate(bp.nodes[:4]):  # cap at 4 to match typical orchestrator output
        target = node.id
        perts = [
            Perturbation(target_node=target, start_tick=10, end_tick=50,
                         perturbation_type=PerturbationType.LATENCY, magnitude=3.0),
            Perturbation(target_node=target, start_tick=10, end_tick=50,
                         perturbation_type=PerturbationType.FAILURE, magnitude=0.4),
        ]
        engine = SimulationEngine(bp)
        result = engine.run(perts, duration_ticks=100)
        result["target_node"] = target
        result["scenario"] = f"latency_adversary_{target}"
        logs.append(result)
    return logs


if __name__ == "__main__":
    for name in ["ecommerce", "ridesharing", "banking"]:
        with open(f"backend/samples/{name}.json") as f:
            bp = SystemBlueprint.model_validate(json.load(f))

        logs = make_fallback_logs(bp)
        result = compute_score(bp, logs)

        score = result["score"]
        in_range = "[OK]" if 35 <= score <= 70 else "[OUT OF RANGE]"
        print(f"\n{'='*50}")
        print(f"{name}: score={score}  {in_range}")
        print(f"  raw_total_impact={result['raw_total_impact']}  deduction_before_clamp={result['deduction_raw']}")
        print(f"  findings={len(result['findings'])}")
        for f in result["findings"]:
            print(f"  {f['finding_id']} [{f['target_node']}]: "
                  f"sev={f['severity']:.3f} blast={f['blast_radius']:.3f} "
                  f"lik={f['likelihood']:.3f} impact={f['impact']:.4f} "
                  f"factors={f['likelihood_factors']}")
