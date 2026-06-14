import json
import logging
from typing import Dict, Any, List, Type
import networkx as nx
from pydantic import BaseModel, Field

from agents.base import BaseAgent, AgentResponse
from models.blueprint import SystemBlueprint
from models.report import TopologyResponse, TopologyNodeAnnotation
from security.sanitizer import sanitize_blueprint_for_llm

logger = logging.getLogger("ascent.agents.topology")

class TopologyLLMResponse(AgentResponse):
    summary_text: str = Field(..., description="Plain English summary of the top 3 architectural risks")

class TopologyAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="TopologyAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> TopologyLLMResponse:
        """
        Deterministic fallback for TopologyAgent summary text.
        """
        annotated_nodes = kwargs.get("annotated_nodes", [])
        if not annotated_nodes:
            return TopologyLLMResponse(
                summary_text="Deterministic Fallback: No system nodes detected in the architecture to evaluate topology risks.",
                used_fallback=True,
                provider="deterministic"
            )
        
        # Sort annotated nodes by priority score
        sorted_nodes = sorted(annotated_nodes, key=lambda x: x.priority_score, reverse=True)
        top_risks = []
        for node in sorted_nodes[:3]:
            ap_str = ", ".join(node.anti_patterns) if node.anti_patterns else "no explicit anti-patterns"
            top_risks.append(f"{node.node_id} (priority: {node.priority_score:.2f}, patterns: {ap_str})")
        
        summary_text = (
            f"Deterministic Fallback: Top 3 structural risk nodes analyzed: "
            f"1) {top_risks[0] if len(top_risks) > 0 else 'N/A'}, "
            f"2) {top_risks[1] if len(top_risks) > 1 else 'N/A'}, "
            f"3) {top_risks[2] if len(top_risks) > 2 else 'N/A'}."
        )
        return TopologyLLMResponse(
            summary_text=summary_text,
            used_fallback=True,
            provider="deterministic"
        )

    def run(self, blueprint: SystemBlueprint) -> TopologyResponse:
        """
        Runs the TopologyAgent by computing structural metrics deterministically,
        then calling the LLM with sanitized inputs to generate the natural language summary.
        """
        # 1. Build NetworkX graph
        G = nx.DiGraph()
        for node in blueprint.nodes:
            G.add_node(node.id)
        for edge in blueprint.edges:
            G.add_edge(edge.from_node, edge.to_node, sync=edge.sync)

        # 2. Compute centralities and degrees
        try:
            centrality_map = nx.betweenness_centrality(G)
        except Exception:
            centrality_map = {node.id: 0.0 for node in blueprint.nodes}

        try:
            pagerank_map = nx.pagerank(G)
        except Exception:
            pagerank_map = {node.id: 0.0 for node in blueprint.nodes}

        in_degree_map = {node.id: G.in_degree(node.id) for node in blueprint.nodes}
        out_degree_map = {node.id: G.out_degree(node.id) for node in blueprint.nodes}

        # Longest sync chain depth using cycle-safe DFS
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

        # Get the sanitized blueprint for the LLM
        sanitized_bp = sanitize_blueprint_for_llm(blueprint)
        sanitized_node_map = {n["node_id"]: n for n in sanitized_bp["nodes"]}

        # 3. Detect all 9 anti-patterns and priority score
        annotated_nodes = []
        for node in blueprint.nodes:
            s_node = sanitized_node_map.get(node.id, {})
            anti_patterns = s_node.get("anti_patterns", [])
            
            # Map declared criticality to weight
            dc = node.declared_criticality
            if dc is None:
                criticality_weight = 0.7 if node.id in blueprint.entry_nodes else 0.4
            elif dc >= 0.9:
                criticality_weight = 1.0
            elif dc >= 0.6:
                criticality_weight = 0.7
            elif dc >= 0.3:
                criticality_weight = 0.4
            else:
                criticality_weight = 0.1

            # priority_score = centrality * criticality_weight * (1 + anti_pattern_count * 0.2)
            node_centrality = centrality_map.get(node.id, 0.0)
            priority_score = node_centrality * criticality_weight * (1 + len(anti_patterns) * 0.2)
            
            sync_chain_depth = get_longest_downstream_sync_depth(node.id, set())

            annotated_nodes.append(
                TopologyNodeAnnotation(
                    node_id=node.id,
                    centrality=round(node_centrality, 4),
                    priority_score=round(priority_score, 4),
                    anti_patterns=anti_patterns,
                    sync_chain_depth=sync_chain_depth,
                    in_degree=in_degree_map.get(node.id, 0),
                    out_degree=out_degree_map.get(node.id, 0)
                )
            )

        # 4. Construct prompt for LLM using ONLY sanitized data
        # Strip fields that are not in the sanitized nodes list
        llm_input_nodes = []
        for an in annotated_nodes:
            s_node = sanitized_node_map.get(an.node_id, {})
            llm_input_nodes.append({
                "node_id": an.node_id,
                "type": s_node.get("type"),
                "centrality": an.centrality,
                "sync_chain_depth": an.sync_chain_depth,
                "anti_patterns": an.anti_patterns,
                "priority_score": an.priority_score
            })
            
        llm_sanitized_data = {
            "entry_nodes": list(blueprint.entry_nodes),
            "nodes": llm_input_nodes
        }

        prompt = f"""You are the Ascent Topology Agent.
Your job is to analyze the structural topology of the system and generate a summary of the top 3 architectural risks.

Analyze the following sanitized system metadata:
{json.dumps(llm_sanitized_data, indent=2)}

Guidelines:
1. Generate a 2-3 sentence plain English summary highlighting the top 3 risks.
2. The summary must be factual, focused, and directly reference the nodes/anti-patterns.
3. You must return ONLY a valid JSON object matching this schema:
{{
  "summary_text": "Plain English summary text here."
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        # 5. Call LLM with base agent execute
        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=TopologyLLMResponse,
            annotated_nodes=annotated_nodes
        )

        return TopologyResponse(
            annotated_nodes=annotated_nodes,
            summary_text=llm_response.summary_text,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
