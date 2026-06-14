import json
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field

from backend.agents.base import BaseAgent, AgentResponse
from backend.models.blueprint import SystemBlueprint
from backend.models.report import LatencyAdversaryResponse, LatencyPerturbationDetails
from backend.security.sanitizer import sanitize_blueprint_for_llm

logger = logging.getLogger("ascent.agents.latency_adversary")

class LatencyAdversaryLLMResponse(AgentResponse):
    hypothesis_text: str = Field(..., description="Hypothesis of what failure cascade will occur")

class LatencyAdversaryAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="LatencyAdversaryAgent")

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> LatencyAdversaryLLMResponse:
        """
        Deterministic fallback for LatencyAdversaryAgent.
        """
        target_node = kwargs.get("target_node", "unknown")
        hypothesis_text = (
            f"Deterministic Fallback: A latency spike on '{target_node}' is hypothesized to propagate "
            f"upstream due to lack of circuit breaker isolation, potentially degrading the entry node's response times."
        )
        return LatencyAdversaryLLMResponse(
            hypothesis_text=hypothesis_text,
            used_fallback=True,
            provider="deterministic"
        )

    def run(self, target_node: str, blueprint: SystemBlueprint) -> LatencyAdversaryResponse:
        """
        Runs the LatencyAdversaryAgent by calculating perturbation parameters deterministically,
        then calling the LLM with sanitized inputs to generate the hypothesis text.
        """
        # Find the target node in the blueprint
        node = next((n for n in blueprint.nodes if n.id == target_node), None)
        if not node:
            raise ValueError(f"Target node '{target_node}' not found in the system blueprint.")

        # Get sanitized node metadata
        sanitized_bp = sanitize_blueprint_for_llm(blueprint)
        sanitized_nodes = sanitized_bp.get("nodes", [])
        sanitized_node = next((n for n in sanitized_nodes if n["node_id"] == target_node), {})

        # Deterministic calculations
        anti_patterns = sanitized_node.get("anti_patterns", [])
        latency_multiplier = 10.0 + (5.0 * len(anti_patterns))
        
        base_error_rate = node.baseline_failure_probability
        if base_error_rate <= 0.0:
            base_error_rate = 0.01  # safe non-zero default
        error_rate_override = min(0.8, base_error_rate * 50.0)
        
        start_tick = 20
        end_tick = 60

        # Construct prompt using ONLY sanitized node metadata
        prompt = f"""You are the Ascent Latency Adversary Agent.
Your job is to generate a professional 2-3 sentence failure cascade hypothesis explaining why this latency perturbation is dangerous for the target node.

Sanitized Target Node Metadata:
{json.dumps(sanitized_node, indent=2)}

Guidelines:
1. Explain how a latency spike of {latency_multiplier}x on target node '{target_node}' (with error override {error_rate_override}) could cascade upstream.
2. Refer only to sanitized parameters like centrality, node type, and anti-patterns. Do not reference raw config properties not present in the sanitized dictionary.
3. You must return ONLY a valid JSON object matching this schema:
{{
  "hypothesis_text": "Hypothesis explanation here."
}}
Do not include any Markdown wrapper, leading text, or trailing text.
"""

        blueprint_dict = blueprint.model_dump(by_alias=True)
        llm_response = self.execute(
            prompt=prompt,
            blueprint_dict=blueprint_dict,
            response_schema=LatencyAdversaryLLMResponse,
            target_node=target_node
        )

        perturbation_details = LatencyPerturbationDetails(
            latency_multiplier=latency_multiplier,
            error_rate_override=error_rate_override,
            start_tick=start_tick,
            end_tick=end_tick
        )

        return LatencyAdversaryResponse(
            target_node=target_node,
            perturbation=perturbation_details,
            hypothesis_text=llm_response.hypothesis_text,
            used_fallback=llm_response.used_fallback,
            provider=llm_response.provider
        )
