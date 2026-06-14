from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.agents.base import AgentResponse

# 1. Topology schemas
class TopologyNodeAnnotation(BaseModel):
    node_id: str = Field(..., description="Target node ID")
    centrality: float = Field(..., description="Computed betweenness centrality")
    priority_score: float = Field(..., description="Computed vulnerability/criticality priority score")
    anti_patterns: List[str] = Field(..., description="List of anti-patterns identified on the node")
    sync_chain_depth: int = Field(..., description="Longest downstream synchronous path depth")
    in_degree: int = Field(..., description="In-degree of the node")
    out_degree: int = Field(..., description="Out-degree of the node")

class TopologyResponse(AgentResponse):
    annotated_nodes: List[TopologyNodeAnnotation] = Field(..., description="List of annotated node metrics")
    summary_text: str = Field(..., description="Plain English summary of the top 3 architectural risks")

# 2. Orchestrator schemas
class OrchestratorStep(BaseModel):
    step: int = Field(..., description="Step number in the test plan")
    agent: str = Field(..., description="Perturbation agent name, e.g., latency_adversary")
    target_node: str = Field(..., description="ID of target node")
    priority_score: float = Field(..., description="Vulnerability priority score of the target node")
    reason_deterministic: str = Field(..., description="Deterministic reasoning for selecting this node")
    reason_natural_language: str = Field(..., description="Natural language explanation of why this step is planned")
    scenario_type: str = Field(..., description="Type of scenario: e.g., latency_adversary, data_integrity, retry_storm")

class OrchestratorResponse(AgentResponse):
    test_plan: List[OrchestratorStep] = Field(..., description="Sequential test plan steps")
    adaptive_rule: str = Field(..., description="Adaptive execution rule based on simulation outputs")

# 3. Latency Adversary schemas
class LatencyPerturbationDetails(BaseModel):
    latency_multiplier: float = Field(..., description="Deterministic latency multiplier")
    error_rate_override: float = Field(..., description="Override for baseline failure probability")
    start_tick: int = Field(..., description="Start tick of simulation")
    end_tick: int = Field(..., description="End tick of simulation")

class LatencyAdversaryResponse(AgentResponse):
    target_node: str = Field(..., description="ID of the target node")
    perturbation: LatencyPerturbationDetails = Field(..., description="Calculated perturbation parameters")
    hypothesis_text: str = Field(..., description="Hypothesis of what failure cascade will occur")

# 4. Retry Storm schemas
class UpstreamRetrier(BaseModel):
    node_id: str = Field(..., description="Upstream caller node ID")
    retries: int = Field(..., description="Retry count configured on the upstream caller")

class RetryStormResponse(AgentResponse):
    target_node: str = Field(..., description="Target node ID")
    upstream_retriers: List[UpstreamRetrier] = Field(..., description="Upstream retrying callers")
    amplification_factor: float = Field(..., description="Calculated amplification factor")
    effective_load_multiplier: float = Field(..., description="Load multiplier to apply")
    explanation_text: str = Field(..., description="Explanation of the load amplification in plain English")

# 5. Data Integrity schemas
class DataIntegrityResponse(AgentResponse):
    target_node: str = Field(..., description="Target database/queue node ID")
    corruption_rate: float = Field(..., description="Silent data corruption probability")
    detection_delay_ticks: int = Field(..., description="Ticks before corruption is detected upstream")
    silent_failure: bool = Field(True, description="Whether the corruption fails silently")
    description_text: str = Field(..., description="Plain English scenario description")

# 6. Patch model
class BlueprintPatch(BaseModel):
    node_id: str = Field(..., description="ID of the node to patch")
    changes: Dict[str, Any] = Field(..., description="Key/value changes to apply to the node")

    def get(self, key: str, default: Any = None) -> Any:
        if key == "node_id":
            return self.node_id
        if key == "changes":
            return self.changes
        return self.changes.get(key, default)

    def __contains__(self, key: str) -> bool:
        return key in {"node_id", "changes"} or key in self.changes

    def __getitem__(self, key: str) -> Any:
        value = self.get(key)
        if value is None and key not in self:
            raise KeyError(key)
        return value

# 7. Cascade Analyzer / Findings schemas
class CascadeFinding(BaseModel):
    finding_id: str = Field(..., description="Unique ID for this finding, e.g. F1, F2")
    scenario: str = Field(..., description="Associated scenario name or ID")
    title: str = Field(..., description="High-level title of the finding")
    severity: float = Field(..., description="Failure severity (0.0 to 1.0)")
    blast_radius: float = Field(..., description="Ratio of degraded nodes (0.0 to 1.0)")
    likelihood: float = Field(..., description="Estimated probability of occurrence (0.0 to 1.0)")
    likelihood_breakdown: str = Field(..., description="Short explanation of how likelihood was computed")
    impact: float = Field(..., description="Calculated impact score")
    affected_nodes: List[str] = Field(..., description="Nodes that degraded during simulation")
    cascade_tree: List[Any] = Field(..., description="Causal cascade events from simulation logs")
    remediation_text: str = Field(..., description="Concrete remediation advice in natural language")
    patch_template: str = Field(..., description="Remediation Jinja2 template name/structure")
    patch_params: BlueprintPatch = Field(..., description="Parameters to interpolate into the template")

class CascadeAnalyzerResponse(AgentResponse):
    resilience_score: int = Field(..., description="Computed resilience score (0 to 100)")
    confidence: int = Field(..., description="Confidence level of analysis (0 to 100)")
    score_breakdown: List[CascadeFinding] = Field(..., description="List of individual findings")
    overall_summary: str = Field(..., description="Swarm executive summary in natural language")
