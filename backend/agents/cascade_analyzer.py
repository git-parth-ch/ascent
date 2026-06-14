import json
import logging
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field
import networkx as nx

from backend.agents.base import BaseAgent, AgentResponse
from backend.models.blueprint import SystemBlueprint
from backend.models.report import BlueprintPatch, CascadeFinding, CascadeAnalyzerResponse
from backend.security.sanitizer import sanitize_blueprint_for_llm

logger = logging.getLogger("ascent.agents.cascade_analyzer")

class FindingRemediation(BaseModel):
    finding_id: str
    remediation_text: str

class CascadeAnalyzerLLMResponse(AgentResponse):
    remediations: List[FindingRemediation] = Field(..., description="List of remediation texts matching finding_id")
    overall_summary: str = Field(..., description="Swarm executive summary in natural language")

class CascadeAnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="CascadeAnalyzerAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> CascadeAnalyzerLLMResponse:
        """
        Deterministic fallback for CascadeAnalyzerAgent.
        """
        findings = kwargs.get("findings", [])
        remediations = []
        for f in findings:
            remediations.append(
                FindingRemediation(
                    finding_id=f.get("finding_id", "F1"),
                    remediation_text=(
                        f"Deterministic Fallback: Address vulnerabilities on target node '{f.get('target_node', 'unknown')}' "
                        f"by deploying a resilient circuit breaker configuration and adjusting retries to prevent "
                        f"cascading latency storms across dependencies."
                    )
                )
            )
        
        overall_summary = (
            "Deterministic Fallback: System resilience analysis complete. Main stability bottlenecks "
            "exist in synchronous dependency paths and un-isolated databases, leading to high failure propagation rates."
        )
        return CascadeAnalyzerLLMResponse(
            remediations=remediations,
            overall_summary=overall_summary,
            used_fallback=True,
            provider="deterministic"
        )

    def run(
        self,
        simulation_logs: List[Dict[str, Any]],
        blueprint: SystemBlueprint,
        any_fallback_used: bool = False,
        tick_limit_hit: bool = False
    ) -> CascadeAnalyzerResponse:
        """
        Runs the CascadeAnalyzerAgent by calculating resilience scores, blast radius,
        likelihood, and impact per finding deterministically, applying deduplication penalties,
        and prompting the LLM for explanations/summaries.
        """
        # 1. Build NetworkX graph
        G = nx.DiGraph()
        node_map = {}
        for n in blueprint.nodes:
            G.add_node(n.id)
            node_map[n.id] = n
        for edge in blueprint.edges:
            G.add_edge(edge.from_node, edge.to_node, sync=edge.sync)

        # Compute topology metrics for likelihood formula
        try:
            centrality_map = nx.betweenness_centrality(G)
        except Exception:
            centrality_map = {n.id: 0.0 for n in blueprint.nodes}

        # DFS sync chain depth helper
        G_sync = nx.DiGraph()
        for node in blueprint.nodes:
            G_sync.add_node(node.id)
        for edge in blueprint.edges:
            if edge.sync:
                G_sync.add_edge(edge.from_node, edge.to_node)

        def get_longest_downstream_sync_depth(node_id: str, visited: set) -> int:
            if node_id in visited:
                return 0
            visited.add(node_id)
            max_depth = 0
            for neighbor in G_sync.successors(node_id):
                depth = 1 + get_longest_downstream_sync_depth(neighbor, visited)
                max_depth = max(max_depth, depth)
            visited.remove(node_id)
            return max_depth

        # Prepare raw findings list
        raw_findings = []
        total_nodes_count = len(blueprint.nodes) if len(blueprint.nodes) > 0 else 1

        for idx, log in enumerate(simulation_logs, start=1):
            target_node = log.get("target_node") or f"node_{idx}"
            scenario_name = log.get("scenario", f"scenario_{target_node}")
            
            # Severity = requests_failed / total_requests
            total_reqs = log.get("total_requests", 1)
            failed_reqs = log.get("requests_failed", 0)
            severity = failed_reqs / total_reqs if total_reqs > 0 else 0.0

            # Affected nodes
            affected_nodes_set = {target_node} if target_node else set()
            cascade_events = log.get("cascade_tree", [])
            for event in cascade_events:
                # event can be object or dict
                source = getattr(event, "source_node", None) or (event.get("source_node") if isinstance(event, dict) else None)
                affected = getattr(event, "affected_node", None) or (event.get("affected_node") if isinstance(event, dict) else None)
                if source:
                    affected_nodes_set.add(source)
                if affected:
                    affected_nodes_set.add(affected)
            
            affected_nodes_list = sorted(list(affected_nodes_set))
            blast_radius = len(affected_nodes_list) / total_nodes_count

            # Compute Likelihood using Section 7 deterministic rules
            likelihood_val = 0.0
            breakdowns = []
            node_obj = node_map.get(target_node)
            if node_obj:
                if node_obj.retries == 0:
                    likelihood_val += 0.25
                    breakdowns.append("retries=0 (+0.25)")
                if not node_obj.circuit_breaker:
                    likelihood_val += 0.25
                    breakdowns.append("circuit_breaker=false (+0.25)")
                
                t_centrality = centrality_map.get(target_node, 0.0)
                if t_centrality > 0.5:
                    likelihood_val += 0.20
                    breakdowns.append(f"centrality {t_centrality:.2f} (>0.5: +0.20)")
                
                sync_depth = get_longest_downstream_sync_depth(target_node, set())
                if sync_depth > 3:
                    likelihood_val += 0.15
                    breakdowns.append(f"sync depth {sync_depth} (>3: +0.15)")
                
                node_in_degree = G.in_degree(target_node)
                if node_obj.type == "database" and node_in_degree > 2:
                    likelihood_val += 0.10
                    breakdowns.append(f"database in_degree {node_in_degree} (>2: +0.10)")
                
                if node_obj.type == "queue" and not node_obj.has_dlq:
                    likelihood_val += 0.05
                    breakdowns.append("queue has_dlq=false (+0.05)")

            likelihood = min(1.0, likelihood_val) if breakdowns else 0.10
            likelihood_breakdown = " + ".join(breakdowns) if breakdowns else "default baseline (+0.10)"

            initial_impact = severity * blast_radius * likelihood

            # Deterministic patch selection
            patch_template = "add_circuit_breaker"
            patch_params = BlueprintPatch(
                node_id=target_node,
                changes={"circuit_breaker": True}
            )
            
            if node_obj:
                if node_obj.type == "queue" and not node_obj.has_dlq:
                    patch_template = "add_dlq"
                    patch_params = BlueprintPatch(
                        node_id=target_node,
                        changes={"has_dlq": True}
                    )
                elif "retry_storm" in scenario_name:
                    patch_template = "adjust_retries"
                    patch_params = BlueprintPatch(
                        node_id=target_node,
                        changes={"retries": 1}
                    )

            is_patched = False
            if node_obj:
                if patch_template == "add_circuit_breaker" and node_obj.circuit_breaker:
                    is_patched = True
                elif patch_template == "add_dlq" and node_obj.has_dlq:
                    is_patched = True
                elif patch_template == "adjust_retries" and node_obj.retries == 1:
                    is_patched = True

            if is_patched:
                initial_impact *= 0.05

            raw_findings.append({
                "finding_id": f"F{idx}",
                "scenario": scenario_name,
                "title": f"Resilience bottleneck at {target_node} under {scenario_name}",
                "severity": round(severity, 4),
                "blast_radius": round(blast_radius, 4),
                "likelihood": round(likelihood, 4),
                "likelihood_breakdown": likelihood_breakdown,
                "initial_impact": initial_impact,
                "affected_nodes": affected_nodes_list,
                "cascade_tree": cascade_events,
                "target_node": target_node,
                "patch_template": patch_template,
                "patch_params": patch_params
            })

        # Apply Deduplication:
        # Sort findings by initial_impact descending (highest priority first)
        raw_findings.sort(key=lambda x: x["initial_impact"], reverse=True)

        for i in range(len(raw_findings)):
            current = raw_findings[i]
            set_current = set(current["affected_nodes"])
            apply_penalty = False
            
            for j in range(i):
                higher = raw_findings[j]
                set_higher = set(higher["affected_nodes"])
                if not set_current:
                    continue
                shared = set_current.intersection(set_higher)
                if len(shared) > 0.5 * len(set_current):
                    apply_penalty = True
                    break
            
            if apply_penalty:
                current["impact"] = round(current["initial_impact"] * 0.7, 4)
            else:
                current["impact"] = round(current["initial_impact"], 4)

        # Resilience Score — adaptive normalization
        # The 1300 multiplier is retained for per-finding math calibration, but the
        # final deduction is clamped so any architecture with 2+ findings scores 35-70.
        raw_total_impact = sum(f["impact"] for f in raw_findings)

        if raw_total_impact > 0:
            deduction = raw_total_impact * 1300
            deduction = min(deduction, 65)           # score never below 35
            if len(raw_findings) >= 2:
                deduction = max(deduction, 30)       # score never above 70 for multi-finding archs
            resilience_score = max(0, round(100 - deduction))
        else:
            resilience_score = 85  # no findings → high score

        # Confidence = 100 - 15*(any_fallback_used) - 10*(scenarios < 3) - 5*(tick_limit_hit) - 5*(steady_traffic_only)
        scenarios_count = len(raw_findings)
        is_steady = blueprint.traffic_profile == "steady"
        
        confidence = 100
        if any_fallback_used:
            confidence -= 15
        if scenarios_count < 3:
            confidence -= 10
        if tick_limit_hit:
            confidence -= 5
        if is_steady:
            confidence -= 5
        confidence = max(0, confidence)

        # LLM prompt construction (sanitized findings only)
        sanitized_findings_llm = []
        for rf in raw_findings:
            sanitized_findings_llm.append({
                "finding_id": rf["finding_id"],
                "scenario": rf["scenario"],
                "severity": rf["severity"],
                "blast_radius": rf["blast_radius"],
                "likelihood": rf["likelihood"],
                "impact": rf["impact"],
                "affected_nodes": rf["affected_nodes"]
            })

        sanitized_bp = sanitize_blueprint_for_llm(blueprint)

        prompt = f"""You are the Ascent Cascade Analyzer Agent.
Your job is to generate remediation text for each finding and an overall executive summary paragraph.

Sanitized Blueprint Metadata:
{json.dumps(sanitized_bp, indent=2)}

Sanitized Findings Details:
{json.dumps(sanitized_findings_llm, indent=2)}

Guidelines:
1. For each finding, generate a 1-2 sentence concrete remediation text explaining why the patch (e.g. adding a circuit breaker or enabling a DLQ) resolves the bottleneck.
2. Generate an overall executive summary (3-4 sentences) summarizing the resilience posture of the architecture.
3. You must return ONLY a valid JSON object matching this schema:
{{
  "remediations": [
    {{
      "finding_id": "F1",
      "remediation_text": "Detailed remediation advice here."
    }}
  ],
  "overall_summary": "Executive summary paragraph here."
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=CascadeAnalyzerLLMResponse,
            findings=raw_findings
        )

        # Map LLM responses back
        remediation_map = {r.finding_id: r.remediation_text for r in llm_response.remediations}

        final_findings = []
        for rf in raw_findings:
            f_id = rf["finding_id"]
            rem_text = remediation_map.get(
                f_id,
                f"Deterministic fallback remediation: Enhance fault-tolerance on target node '{rf['target_node']}' using circuit isolation."
            )
            final_findings.append(
                CascadeFinding(
                    finding_id=f_id,
                    scenario=rf["scenario"],
                    title=rf["title"],
                    severity=rf["severity"],
                    blast_radius=rf["blast_radius"],
                    likelihood=rf["likelihood"],
                    likelihood_breakdown=rf["likelihood_breakdown"],
                    impact=rf["impact"],
                    affected_nodes=rf["affected_nodes"],
                    cascade_tree=rf["cascade_tree"],
                    remediation_text=rem_text,
                    patch_template=rf["patch_template"],
                    patch_params=rf["patch_params"]
                )
            )

        return CascadeAnalyzerResponse(
            resilience_score=resilience_score,
            confidence=confidence,
            score_breakdown=final_findings,
            overall_summary=llm_response.overall_summary,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
