import json
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field
import networkx as nx

from backend.agents.base import BaseAgent, AgentResponse
from backend.models.blueprint import SystemBlueprint
from backend.models.report import DataIntegrityResponse
from backend.security.sanitizer import sanitize_blueprint_for_llm

logger = logging.getLogger("ascent.agents.data_integrity")

class DataIntegrityLLMResponse(AgentResponse):
    description_text: str = Field(..., description="Description of the corruption scenario in practice")

class DataIntegrityAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="DataIntegrityAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> DataIntegrityLLMResponse:
        """
        Deterministic fallback for DataIntegrityAgent.
        """
        target_node = kwargs.get("target_node", "unknown")
        corruption_rate = kwargs.get("corruption_rate", 0.1)
        description_text = (
            f"Deterministic Fallback: Silent data corruption of {corruption_rate*100:.1f}% on node '{target_node}' "
            f"which propagates down to calling services without immediate system exceptions, leading to stale "
            f"or invalid downstream application state."
        )
        return DataIntegrityLLMResponse(
            description_text=description_text,
            used_fallback=True,
            provider="deterministic"
        )

    def run(self, target_node: str, blueprint: SystemBlueprint) -> DataIntegrityResponse:
        """
        Runs the DataIntegrityAgent by determining the corruption rate and detection delay deterministically,
        then calling the LLM with sanitized inputs to generate the description text.
        """
        # Find the target node in the blueprint
        node = next((n for n in blueprint.nodes if n.id == target_node), None)
        if not node:
            raise ValueError(f"Target node '{target_node}' not found in the system blueprint.")

        # 1. Build NetworkX graph to compute structural details
        G = nx.DiGraph()
        for n in blueprint.nodes:
            G.add_node(n.id)
        for edge in blueprint.edges:
            G.add_edge(edge.from_node, edge.to_node)

        if target_node not in G:
            raise ValueError(f"Target node '{target_node}' not found in the graph.")

        # Deterministic calculations:
        # corruption_rate = 0.1 * (in_degree / max_in_degree_across_all_nodes)
        in_degrees = [G.in_degree(n.id) for n in blueprint.nodes]
        max_in_degree = max(in_degrees) if in_degrees else 1
        if max_in_degree == 0:
            max_in_degree = 1
        
        node_in_degree = G.in_degree(target_node)
        corruption_rate = 0.1 * (node_in_degree / max_in_degree)

        # Add duplicate write risk if retries > 0
        if node.retries > 0:
            corruption_rate += 0.1

        # Add risk if not has_dlq
        if not node.has_dlq:
            corruption_rate += 0.15

        corruption_rate = min(0.6, corruption_rate)

        # detection_delay_ticks = 5 * (shortest path length from corruption source to entry node)
        # Wait, the flow is from entry node to target node.
        # Shortest path from entry node to target node:
        shortest_path_len = None
        for entry in blueprint.entry_nodes:
            try:
                path_len = nx.shortest_path_length(G, entry, target_node)
                if shortest_path_len is None or path_len < shortest_path_len:
                    shortest_path_len = path_len
            except nx.NetworkXNoPath:
                continue

        if shortest_path_len is None:
            shortest_path_len = 2  # default baseline if disconnected or unreachable

        detection_delay_ticks = 5 * shortest_path_len
        silent_failure = True

        # Get sanitized node metadata
        sanitized_bp = sanitize_blueprint_for_llm(blueprint)
        sanitized_nodes = sanitized_bp.get("nodes", [])
        sanitized_node = next((n for n in sanitized_nodes if n["node_id"] == target_node), {})

        # 2. Construct prompt using ONLY sanitized node metadata
        prompt = f"""You are the Ascent Data Integrity Agent.
Your job is to generate a professional explanation (2-3 sentences) of what this silent data corruption scenario means in practice for the target node.

Target Node: '{target_node}'
Sanitized Target Node Metadata:
{json.dumps(sanitized_node, indent=2)}

Calculated Corruption Rate: {corruption_rate}
Calculated Detection Delay (Ticks): {detection_delay_ticks}

Guidelines:
1. Explain how silent data corruption at a rate of {corruption_rate * 100:.1f}% on target node '{target_node}' affects calling services after a delay of {detection_delay_ticks} ticks.
2. Refer only to sanitized parameters like node type, centrality, corruption rate, and detection delay ticks.
3. You must return ONLY a valid JSON object matching this schema:
{{
  "description_text": "Practical explanation here."
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=DataIntegrityLLMResponse,
            target_node=target_node,
            corruption_rate=corruption_rate
        )

        return DataIntegrityResponse(
            target_node=target_node,
            corruption_rate=round(corruption_rate, 4),
            detection_delay_ticks=detection_delay_ticks,
            silent_failure=silent_failure,
            description_text=llm_response.description_text,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
