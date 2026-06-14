"""
Standalone deterministic fallback functions for every Ascent agent.
These are called when both Gemini and Groq fail, and must return the exact
same Pydantic schema as the corresponding real agent's run() method.
"""
from typing import Dict, Any, List, Optional
import networkx as nx

from models.report import (
    OrchestratorStep,
    OrchestratorResponse,
    LatencyPerturbationDetails,
    LatencyAdversaryResponse,
    UpstreamRetrier,
    RetryStormResponse,
    DataIntegrityResponse,
    CascadeFinding,
    CascadeAnalyzerResponse,
    BlueprintPatch,
)


# ---------------------------------------------------------------------------
# 1. Orchestrator Fallback
# Real agent returns: OrchestratorResponse(test_plan, adaptive_rule, ...)
# ---------------------------------------------------------------------------

def orchestrator_fallback(blueprint_dict: Dict[str, Any]) -> OrchestratorResponse:
    """
    Deterministic fallback: compute centrality via networkx, select top nodes,
    assign latency_adversary to highest centrality, data_integrity to a shared
    database node (in_degree > 1), retry_storm to node with upstream retries > 0.
    Returns the same OrchestratorResponse schema as the real orchestrator.
    """
    nodes = blueprint_dict.get("nodes", [])
    edges = blueprint_dict.get("edges", [])

    G = nx.DiGraph()
    for edge in edges:
        from_n = edge.get("from") or edge.get("from_node")
        to_n = edge.get("to") or edge.get("to_node")
        if from_n and to_n:
            G.add_edge(from_n, to_n)

    centrality = nx.betweenness_centrality(G)

    # Sort nodes by centrality descending
    nodes_sorted = sorted(
        nodes,
        key=lambda x: centrality.get(x.get("id") or x.get("node_id"), 0.0),
        reverse=True
    )

    if not nodes_sorted:
        return OrchestratorResponse(
            test_plan=[],
            adaptive_rule="No nodes available â€” cannot plan tests.",
            used_fallback=True,
            provider="deterministic"
        )

    top_node_id = nodes_sorted[0].get("id") or nodes_sorted[0].get("node_id")

    # 1. Latency Adversary target: highest centrality node
    latency_target = top_node_id

    # 2. Data Integrity target: database node with in_degree > 1; else any db; else second node
    in_degree_map = dict(G.in_degree())
    db_nodes = [n for n in nodes if n.get("type") == "database"]
    db_shared = [n for n in db_nodes if in_degree_map.get(n.get("id") or n.get("node_id"), 0) > 1]
    if db_shared:
        data_target = max(db_shared, key=lambda n: in_degree_map.get(n.get("id") or n.get("node_id"), 0))
        data_target = data_target.get("id") or data_target.get("node_id")
    elif db_nodes:
        data_target = db_nodes[0].get("id") or db_nodes[0].get("node_id")
    elif len(nodes_sorted) > 1:
        data_target = nodes_sorted[1].get("id") or nodes_sorted[1].get("node_id")
    else:
        data_target = top_node_id

    # 3. Retry Storm target: highest-centrality node that has upstream callers with retries > 0
    callers: Dict[str, List[str]] = {}
    for edge in edges:
        u = edge.get("from") or edge.get("from_node")
        v = edge.get("to") or edge.get("to_node")
        if u and v:
            callers.setdefault(v, []).append(u)

    node_map = {(n.get("id") or n.get("node_id")): n for n in nodes}
    retry_target = None
    for n in nodes_sorted:
        nid = n.get("id") or n.get("node_id")
        if any(node_map.get(c, {}).get("retries", 0) > 0 for c in callers.get(nid, [])):
            retry_target = nid
            break

    if not retry_target:
        nodes_with_retries = [n for n in nodes_sorted if n.get("retries", 0) > 0]
        retry_target = (nodes_with_retries[0].get("id") or nodes_with_retries[0].get("node_id")) if nodes_with_retries else top_node_id

    # Build OrchestratorStep list (same schema as real orchestrator)
    step_defs = [
        (latency_target, "latency_adversary", f"latency_adversary_{latency_target}",
         f"Highest centrality node '{latency_target}' targeted for latency injection."),
        (data_target, "data_integrity", f"data_integrity_{data_target}",
         f"Shared database node '{data_target}' (in_degree > 1) targeted for corruption."),
        (retry_target, "retry_storm", f"retry_storm_{retry_target}",
         f"Node '{retry_target}' targeted for retry amplification storm."),
    ]

    test_plan = []
    for i, (target, agent, scenario, reason) in enumerate(step_defs, start=1):
        test_plan.append(OrchestratorStep(
            step=i,
            agent=agent,
            target_node=target,
            priority_score=round(centrality.get(target, 0.0), 4),
            reason_deterministic=reason,
            reason_natural_language=reason,
            scenario_type=agent,
        ))

    return OrchestratorResponse(
        test_plan=test_plan,
        adaptive_rule="if cascade_impact < 0.2 after step 1, run compound test",
        used_fallback=True,
        provider="deterministic"
    )


# ---------------------------------------------------------------------------
# 2. Latency Adversary Fallback
# Real agent returns: LatencyAdversaryResponse(target_node, perturbation, hypothesis_text, ...)
# ---------------------------------------------------------------------------

def latency_adversary_fallback(blueprint_dict: Dict[str, Any], target_node: str) -> LatencyAdversaryResponse:
    """
    Deterministic fallback: multiplier=15, error_rate=0.6, ticks 20-60.
    """
    return LatencyAdversaryResponse(
        target_node=target_node,
        perturbation=LatencyPerturbationDetails(
            latency_multiplier=15.0,
            error_rate_override=0.6,
            start_tick=20,
            end_tick=60,
        ),
        hypothesis_text=(
            f"Deterministic Fallback: A 15x latency spike on '{target_node}' "
            f"(error_rate=0.6) is expected to propagate upstream timeouts through "
            f"all synchronous callers, degrading entry-node success rates."
        ),
        used_fallback=True,
        provider="deterministic"
    )


# ---------------------------------------------------------------------------
# 3. Data Integrity Fallback
# Real agent returns: DataIntegrityResponse(target_node, corruption_rate,
#                    detection_delay_ticks, silent_failure, description_text, ...)
# ---------------------------------------------------------------------------

def data_integrity_fallback(blueprint_dict: Dict[str, Any], target_node: Optional[str] = None) -> DataIntegrityResponse:
    """
    Deterministic fallback: target database node with highest in_degree,
    corruption_rate=0.3, detection_delay_ticks=10, silent_failure=True.
    """
    nodes = blueprint_dict.get("nodes", [])
    edges = blueprint_dict.get("edges", [])

    if not target_node:
        in_deg: Dict[str, int] = {}
        for edge in edges:
            to_n = edge.get("to") or edge.get("to_node")
            if to_n:
                in_deg[to_n] = in_deg.get(to_n, 0) + 1

        db_nodes = [n for n in nodes if n.get("type") == "database"]
        if db_nodes:
            best = max(db_nodes, key=lambda n: in_deg.get(n.get("id") or n.get("node_id"), 0))
            target_node = best.get("id") or best.get("node_id")
        elif nodes:
            best = max(nodes, key=lambda n: in_deg.get(n.get("id") or n.get("node_id"), 0))
            target_node = best.get("id") or best.get("node_id")
        else:
            target_node = "unknown"

    return DataIntegrityResponse(
        target_node=target_node,
        corruption_rate=0.3,
        detection_delay_ticks=10,
        silent_failure=True,
        description_text=(
            f"Deterministic Fallback: Silent data corruption of 30% on node "
            f"'{target_node}' propagates to all callers without raising exceptions, "
            f"leading to stale or invalid downstream application state after ~10 ticks."
        ),
        used_fallback=True,
        provider="deterministic"
    )


# ---------------------------------------------------------------------------
# 4. Retry Storm Fallback
# Real agent returns: RetryStormResponse(target_node, upstream_retriers,
#                    amplification_factor, effective_load_multiplier,
#                    explanation_text, ...)
# ---------------------------------------------------------------------------

def retry_storm_fallback(blueprint_dict: Dict[str, Any], target_node: str) -> RetryStormResponse:
    """
    Deterministic fallback: compute amplification as product of upstream retry
    counts (retries+1), cap effective load at 50, ticks 25-65.
    """
    nodes = blueprint_dict.get("nodes", [])
    edges = blueprint_dict.get("edges", [])

    node_map = {(n.get("id") or n.get("node_id")): n for n in nodes}

    upstream_retriers: List[UpstreamRetrier] = []
    for edge in edges:
        to_n = edge.get("to") or edge.get("to_node")
        from_n = edge.get("from") or edge.get("from_node")
        if to_n == target_node and from_n:
            caller = node_map.get(from_n)
            if caller and caller.get("retries", 0) > 0:
                upstream_retriers.append(UpstreamRetrier(
                    node_id=from_n,
                    retries=caller["retries"]
                ))

    amp = 1.0
    for ur in upstream_retriers:
        amp *= (ur.retries + 1)
    if not upstream_retriers:
        amp = 2.0

    effective = min(50.0, amp)

    return RetryStormResponse(
        target_node=target_node,
        upstream_retriers=upstream_retriers,
        amplification_factor=round(amp, 4),
        effective_load_multiplier=round(effective, 4),
        explanation_text=(
            f"Deterministic Fallback: {len(upstream_retriers)} upstream node(s) "
            f"with retries amplify effective load on '{target_node}' by "
            f"{amp:.1f}x (capped at {effective:.1f}x)."
        ),
        used_fallback=True,
        provider="deterministic"
    )


# ---------------------------------------------------------------------------
# 5. Cascade Analyzer Fallback
# Real agent returns: CascadeAnalyzerResponse(resilience_score, confidence,
#                    score_breakdown, overall_summary, ...)
# Multiplier: 1300 (matching cascade_analyzer.py)
# ---------------------------------------------------------------------------

def cascade_analyzer_fallback(
    blueprint_dict: Dict[str, Any],
    simulation_results: List[Dict[str, Any]]
) -> CascadeAnalyzerResponse:
    """
    Deterministic fallback: severity * blast_radius * 0.5 (fixed likelihood),
    score = max(0, round(100 - (sum(impacts) * 1300))).
    """
    nodes = blueprint_dict.get("nodes", [])
    total_nodes_count = max(len(nodes), 1)
    node_map = {(n.get("id") or n.get("node_id")): n for n in nodes}

    raw_findings = []

    for idx, sim_res in enumerate(simulation_results, start=1):
        target_node = sim_res.get("target_node", f"node_{idx}")
        scenario = sim_res.get("scenario", f"scenario_{idx}")

        total_reqs = sim_res.get("total_requests", 1)
        failed_reqs = sim_res.get("requests_failed", 0)
        severity = failed_reqs / total_reqs if total_reqs > 0 else 0.0

        # Collect affected nodes from cascade_tree
        affected: set = {target_node}
        for event in sim_res.get("cascade_tree", []):
            if hasattr(event, "affected_node"):
                affected.add(event.affected_node)
            elif isinstance(event, dict):
                if event.get("affected_node"):
                    affected.add(event["affected_node"])
                if event.get("source_node"):
                    affected.add(event["source_node"])

        blast_radius = len(affected) / total_nodes_count
        likelihood = 0.5  # fixed in fallback
        impact = severity * blast_radius * likelihood

        # Patch discount if already fixed
        node_obj = node_map.get(target_node)
        if node_obj:
            if node_obj.get("circuit_breaker"):
                impact *= 0.05
            elif node_obj.get("has_dlq"):
                impact *= 0.05

        # Patch suggestion
        if node_obj and node_obj.get("type") == "queue" and not node_obj.get("has_dlq"):
            patch_template = "add_dlq"
            patch_params = BlueprintPatch(
                node_id=target_node,
                changes={"has_dlq": True}
            )
        elif "retry" in scenario:
            patch_template = "adjust_retries"
            patch_params = BlueprintPatch(
                node_id=target_node,
                changes={"retries": 1}
            )
        else:
            patch_template = "add_circuit_breaker"
            patch_params = BlueprintPatch(
                node_id=target_node,
                changes={"circuit_breaker": True}
            )

        raw_findings.append({
            "finding_id": f"F{idx}",
            "scenario": scenario,
            "title": f"Resilience bottleneck at {target_node} under {scenario}",
            "severity": round(severity, 4),
            "blast_radius": round(blast_radius, 4),
            "likelihood": likelihood,
            "likelihood_breakdown": "fixed fallback baseline (0.5)",
            "impact": round(impact, 4),
            "affected_nodes": sorted(affected),
            "cascade_tree": sim_res.get("cascade_tree", []),
            "patch_template": patch_template,
            "patch_params": patch_params,
        })

    # Deduplication: 0.7x penalty if >50% affected nodes overlap a higher-priority finding
    raw_findings.sort(key=lambda x: x["impact"], reverse=True)
    for i in range(len(raw_findings)):
        set_i = set(raw_findings[i]["affected_nodes"])
        for j in range(i):
            set_j = set(raw_findings[j]["affected_nodes"])
            if set_i and len(set_i & set_j) > 0.5 * len(set_i):
                raw_findings[i]["impact"] = round(raw_findings[i]["impact"] * 0.7, 4)
                break

    # Score formula: matches cascade_analyzer.py exactly (multiplier = 1300)
    total_impact = sum(f["impact"] for f in raw_findings)
    resilience_score = max(0, round(100 - (total_impact * 1300)))

    score_breakdown = [
        CascadeFinding(
            finding_id=f["finding_id"],
            scenario=f["scenario"],
            title=f["title"],
            severity=f["severity"],
            blast_radius=f["blast_radius"],
            likelihood=f["likelihood"],
            likelihood_breakdown=f["likelihood_breakdown"],
            impact=f["impact"],
            affected_nodes=f["affected_nodes"],
            cascade_tree=f["cascade_tree"],
            remediation_text=(
                f"Deterministic Fallback: Address vulnerabilities on '{f['patch_params'].get('node_id', 'unknown')}' "
                f"using the '{f['patch_template']}' remediation pattern."
            ),
            patch_template=f["patch_template"],
            patch_params=f["patch_params"],
        )
        for f in raw_findings
    ]

    return CascadeAnalyzerResponse(
        resilience_score=resilience_score,
        confidence=70,
        score_breakdown=score_breakdown,
        overall_summary=(
            "Deterministic Fallback: System resilience analysis complete. "
            "Primary bottlenecks exist in synchronous dependency paths and "
            "un-isolated shared databases, leading to elevated failure propagation rates."
        ),
        used_fallback=True,
        provider="deterministic"
    )
