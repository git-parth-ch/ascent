import json
import logging
import math
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import networkx as nx

from agents.base import BaseAgent, AgentResponse
from models.blueprint import SystemBlueprint
from models.report import RetryStormResponse, UpstreamRetrier
from security.sanitizer import sanitize_blueprint_for_llm

logger = logging.getLogger("ascent.agents.retry_storm")

class RetryStormLLMResponse(AgentResponse):
    explanation_text: str = Field(..., description="Explanation of the load amplification in plain English")

class RetryStormAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="RetryStormAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> RetryStormLLMResponse:
        """
        Deterministic fallback for RetryStormAgent.
        """
        target_node = kwargs.get("target_node", "unknown")
        amp_factor = kwargs.get("amplification_factor", 2.0)
        retriers_count = kwargs.get("retriers_count", 0)
        explanation_text = (
            f"Deterministic Fallback: Injected retry storm targeting '{target_node}'. "
            f"{retriers_count} upstream nodes with retries > 0 are estimated to amplify "
            f"incoming request volume by approximately {amp_factor:.1f}x during failures."
        )
        return RetryStormLLMResponse(
            explanation_text=explanation_text,
            used_fallback=True,
            provider="deterministic"
        )

    def run(self, target_node: str, blueprint: SystemBlueprint) -> RetryStormResponse:
        """
        Runs the RetryStormAgent by finding upstream nodes that retry,
        calculating load amplification deterministically, and prompting the LLM for the explanation.
        """
        # 1. Build NetworkX graph
        G = nx.DiGraph()
        node_map = {}
        for node in blueprint.nodes:
            G.add_node(node.id)
            node_map[node.id] = node
        for edge in blueprint.edges:
            G.add_edge(edge.from_node, edge.to_node)

        if target_node not in G:
            raise ValueError(f"Target node '{target_node}' not found in the system blueprint.")

        # 2. Find all upstream nodes with retries > 0 using reverse graph traversal (ancestors)
        upstream_nodes = nx.ancestors(G, target_node)
        upstream_retriers = []
        for u in sorted(upstream_nodes):
            u_node = node_map.get(u)
            if u_node and u_node.retries > 0:
                upstream_retriers.append(UpstreamRetrier(node_id=u, retries=u_node.retries))

        # 3. Calculate amplification factor and effective load multiplier
        amp = 1.0
        for ur in upstream_retriers:
            amp *= (ur.retries + 1)
        
        # If no upstream retriers exist, default to a baseline amplification of 2.0
        if not upstream_retriers:
            amp = 2.0

        effective_load_multiplier = min(50.0, float(amp))

        # 4. Get sanitized node metadata
        sanitized_bp = sanitize_blueprint_for_llm(blueprint)
        sanitized_nodes = sanitized_bp.get("nodes", [])
        sanitized_node = next((n for n in sanitized_nodes if n["node_id"] == target_node), {})

        # 5. Construct LLM prompt using ONLY sanitized metadata
        prompt = f"""You are the Ascent Retry Storm Agent.
Your job is to generate a professional, plain English explanation of the retry storm load amplification math on the target node.

Target Node: '{target_node}'
Sanitized Target Node Metadata:
{json.dumps(sanitized_node, indent=2)}

Sanitized Upstream Retrying Nodes:
{json.dumps([{"node_id": r.node_id, "retries": r.retries} for r in upstream_retriers], indent=2)}

Calculated Amplification Factor: {amp}x
Effective Load Multiplier (capped at 50): {effective_load_multiplier}x

Guidelines:
1. Explain the amplification math in plain English. For example, explain how the product of retries propagates load on '{target_node}'.
2. Keep the summary to 1-2 sentences.
3. You must return ONLY a valid JSON object matching this schema:
{{
  "explanation_text": "Explanation text here."
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=RetryStormLLMResponse,
            target_node=target_node,
            amplification_factor=amp,
            retriers_count=len(upstream_retriers)
        )

        return RetryStormResponse(
            target_node=target_node,
            upstream_retriers=upstream_retriers,
            amplification_factor=round(amp, 4),
            effective_load_multiplier=round(effective_load_multiplier, 4),
            explanation_text=llm_response.explanation_text,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
