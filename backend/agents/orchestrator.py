import json
import logging
from typing import Dict, Any, List, Type
from pydantic import BaseModel, Field
import networkx as nx

from backend.agents.base import BaseAgent, AgentResponse
from backend.models.blueprint import SystemBlueprint
from backend.models.report import TopologyResponse, OrchestratorResponse, OrchestratorStep

logger = logging.getLogger("ascent.agents.orchestrator")

class StepReason(BaseModel):
    step: int
    reason_natural_language: str

class OrchestratorLLMResponse(AgentResponse):
    reasons: List[StepReason] = Field(..., description="Natural language reasoning for each step")

class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="OrchestratorAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> OrchestratorLLMResponse:
        """
        Deterministic fallback for OrchestratorAgent.
        """
        steps = kwargs.get("steps", [])
        reasons = []
        for s in steps:
            reasons.append(
                StepReason(
                    step=s.get("step", 1),
                    reason_natural_language=f"Deterministic Fallback: Target node '{s.get('target_node')}' selected for '{s.get('scenario_type')}' based on priority score of {s.get('priority_score')}."
                )
            )
        return OrchestratorLLMResponse(
            reasons=reasons,
            used_fallback=True,
            provider="deterministic"
        )

    def run(self, topology_report: TopologyResponse, blueprint: SystemBlueprint) -> OrchestratorResponse:
        """
        Runs the Orchestrator by selecting top nodes from the topology report,
        matching scenario rules, and asking LLM for explanations of each step.
        """
        # 1. Reconstruct NetworkX Graph and map node details
        G = nx.DiGraph()
        node_map = {}
        for node in blueprint.nodes:
            G.add_node(node.id)
            node_map[node.id] = node
        for edge in blueprint.edges:
            G.add_edge(edge.from_node, edge.to_node, sync=edge.sync)

        # 2. Select top K nodes where priority_score > 0.02, K = min(4, count)
        annotated_nodes = topology_report.annotated_nodes
        eligible_nodes = [n for n in annotated_nodes if n.priority_score > 0.02]
        
        # If no nodes meet the threshold, back off to at least the top priority node to prevent empty plans
        if not eligible_nodes and annotated_nodes:
            eligible_nodes = [max(annotated_nodes, key=lambda x: x.priority_score)]
            
        sorted_nodes = sorted(eligible_nodes, key=lambda x: x.priority_score, reverse=True)
        selected_nodes = sorted_nodes[:min(4, len(sorted_nodes))]

        steps_data = []
        for idx, node_ann in enumerate(selected_nodes, start=1):
            node_id = node_ann.node_id
            blueprint_node = node_map.get(node_id)
            node_type = blueprint_node.type if blueprint_node else "service"
            
            # Compute upstream cumulative retries
            predecessors = list(G.predecessors(node_id))
            upstream_retries = sum(node_map[p].retries for p in predecessors if p in node_map)

            # Assign scenario types by rules
            if node_type in ["database", "queue"] and node_ann.in_degree > 1:
                scenario_type = "data_integrity"
            elif upstream_retries > 2:
                scenario_type = "retry_storm"
            else:
                scenario_type = "latency_adversary"

            # Assign agent mapping
            agent = scenario_type

            # Deterministic reasoning
            reason_det = f"centrality={node_ann.centrality}, priority={node_ann.priority_score}, anti_patterns={node_ann.anti_patterns}, sync_chain_depth={node_ann.sync_chain_depth}, in_degree={node_ann.in_degree}, upstream_retries={upstream_retries}"

            steps_data.append({
                "step": idx,
                "agent": agent,
                "target_node": node_id,
                "priority_score": node_ann.priority_score,
                "reason_deterministic": reason_det,
                "scenario_type": scenario_type
            })

        # 3. Request LLM generated explanations (sanitized only)
        sanitized_steps = []
        for s in steps_data:
            sanitized_steps.append({
                "step": s["step"],
                "agent": s["agent"],
                "target_node": s["target_node"],
                "priority_score": s["priority_score"],
                "scenario_type": s["scenario_type"]
            })

        prompt = f"""You are the Ascent Orchestrator Agent.
Your job is to write a short, professional, 1-2 sentence plain English explanation of why each test step was selected and what behavior it aims to validate.

Here is the scheduled test plan (sanitized metadata):
{json.dumps(sanitized_steps, indent=2)}

Guidelines:
1. Return a JSON object with a single key "reasons" containing a list of explanations.
2. Example response:
{{
  "reasons": [
    {{
      "step": 1,
      "reason_natural_language": "Targeting payment-service with a latency perturbation will verify if the API gateway correctly propagates timeouts or triggers cascading failures downstream."
    }}
  ]
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=OrchestratorLLMResponse,
            steps=steps_data
        )

        # Map reasons from LLM back to steps
        reason_map = {r.step: r.reason_natural_language for r in llm_response.reasons}
        
        final_steps = []
        for s in steps_data:
            step_num = s["step"]
            natural_reason = reason_map.get(step_num, f"Deterministic explanation: testing resilience of {s['target_node']}.")
            final_steps.append(
                OrchestratorStep(
                    step=step_num,
                    agent=s["agent"],
                    target_node=s["target_node"],
                    priority_score=s["priority_score"],
                    reason_deterministic=s["reason_deterministic"],
                    reason_natural_language=natural_reason,
                    scenario_type=s["scenario_type"]
                )
            )

        adaptive_rule = "if cascade_impact < 0.2 after step 1, run compound test"

        return OrchestratorResponse(
            test_plan=final_steps,
            adaptive_rule=adaptive_rule,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
