import warnings
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator, field_validator
import re

class Node(BaseModel):
    id: str = Field(..., description="Unique identifier for the node")
    label: str = Field(..., description="Human-readable label for the node")
    type: str = Field(..., description="Type of the node: e.g., service, database, queue")
    nominal_latency_ms: float = Field(..., description="Expected baseline latency of the node")
    baseline_failure_probability: float = Field(..., description="Expected probability of failure under normal conditions")
    timeout_ms: float = Field(..., description="Timeout threshold for requests calling this node")
    retries: int = Field(..., description="Number of retries upstream services should attempt")
    circuit_breaker: bool = Field(..., description="Whether a circuit breaker is configured on this node")
    declared_criticality: Optional[float] = Field(None, ge=0.0, le=1.0, description="Optional user-provided criticality score between 0.0 and 1.0")
    replicas: int = Field(..., description="Number of running replicas/instances of the node")
    has_dlq: bool = Field(False, description="Whether this node (if a queue) has a dead letter queue configured")

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Node ID must contain only alphanumeric characters, hyphens, and underscores.")
        if len(v) > 64:
            raise ValueError("Node ID must be 64 characters or fewer.")
        return v

class Edge(BaseModel):
    from_node: str = Field(..., alias="from", description="Source node ID")
    to_node: str = Field(..., alias="to", description="Destination node ID")
    protocol: str = Field(..., description="Communication protocol, e.g., http, tcp, amqp")
    sync: bool = Field(..., description="Whether the connection is synchronous")

    class Config:
        populate_by_name = True

# FIX 5: Exact valid profile names as defined in simulation/traffic_profiles.py
VALID_TRAFFIC_PROFILES = {"steady", "burst", "spike", "diurnal"}

class SystemBlueprint(BaseModel):
    system_name: str
    entry_nodes: List[str]
    nodes: List[Node]
    edges: List[Edge]
    traffic_profile: str

    @field_validator("traffic_profile")
    @classmethod
    def validate_traffic_profile(cls, v: str) -> str:
        if v not in VALID_TRAFFIC_PROFILES:
            raise ValueError(
                f"traffic_profile '{v}' is not valid. Must be one of: {sorted(VALID_TRAFFIC_PROFILES)}"
            )
        return v

    @field_validator("system_name")
    @classmethod
    def validate_system_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_ .-]+$", v):
            raise ValueError("System name must contain only alphanumeric characters, spaces, dots, hyphens, and underscores.")
        if len(v) > 64:
            raise ValueError("System name must be 64 characters or fewer.")
        return v

    @model_validator(mode="after")
    def validate_structural_rules(self) -> "SystemBlueprint":
        node_ids = set()
        node_map = {}
        for node in self.nodes:
            if node.id in node_ids:
                raise ValueError(f"Duplicate node ID detected: '{node.id}' must be unique.")
            node_ids.add(node.id)
            node_map[node.id] = node

        # 1. Every entry node must exist
        for entry in self.entry_nodes:
            if entry not in node_ids:
                raise ValueError(f"Entry node '{entry}' does not exist in the node set.")

        # 2. Every edge must reference existing nodes
        for edge in self.edges:
            if edge.from_node not in node_ids:
                raise ValueError(f"Edge source '{edge.from_node}' does not exist in the node set.")
            if edge.to_node not in node_ids:
                raise ValueError(f"Edge destination '{edge.to_node}' does not exist in the node set.")

            # 3. Synchronous queue-style edges are invalid
            from_type = node_map[edge.from_node].type
            to_type = node_map[edge.to_node].type
            if edge.sync:
                if from_type == "queue" or to_type == "queue":
                    raise ValueError(
                        f"Invalid synchronous edge from '{edge.from_node}' ({from_type}) to "
                        f"'{edge.to_node}' ({to_type}). Queue connections must be asynchronous."
                    )

            # 4. Warn on self-loops
            if edge.from_node == edge.to_node:
                warnings.warn(
                    f"Structural Warning: Self-loop detected on node '{edge.from_node}'.",
                    UserWarning,
                    stacklevel=2
                )

        # 5. Warning on cycles
        # Build adjacency list
        adj = {nid: [] for nid in node_ids}
        for edge in self.edges:
            adj[edge.from_node].append(edge.to_node)

        visited = set()
        rec_stack = set()
        has_cycle = False

        def dfs(node):
            nonlocal has_cycle
            visited.add(node)
            rec_stack.add(node)
            for neighbor in adj[node]:
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    has_cycle = True
                    return True
            rec_stack.remove(node)
            return False

        for node in node_ids:
            if node not in visited:
                if dfs(node):
                    break

        if has_cycle:
            warnings.warn(
                "Structural Warning: Dependency cycle detected in the architecture graph.",
                UserWarning,
                stacklevel=2
            )

        return self
