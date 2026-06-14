import networkx as nx
from typing import Any, Dict, List
from backend.models.blueprint import SystemBlueprint

def sanitize_blueprint_for_llm(blueprint: SystemBlueprint) -> Dict[str, Any]:
    """
    Sanitizes the SystemBlueprint by stripping all freeform text fields, descriptions,
    labels, and names to prevent prompt injection. It computes structural metrics
    (centrality, in/out degrees, and anti-patterns) and returns a clean topology dictionary.
    """
    # 1. Build NetworkX graph to calculate metrics
    G = nx.DiGraph()
    for node in blueprint.nodes:
        G.add_node(node.id)
    for edge in blueprint.edges:
        G.add_edge(edge.from_node, edge.to_node, sync=edge.sync)

    # 2. Compute network metrics
    try:
        centrality_map = nx.betweenness_centrality(G)
    except Exception:
        centrality_map = {node.id: 0.0 for node in blueprint.nodes}

    in_degree_map = {node_id: G.in_degree(node_id) for node_id in G.nodes}
    out_degree_map = {node_id: G.out_degree(node_id) for node_id in G.nodes}

    # Build sync-only subgraph for long_sync_chain detection
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

    # 3. Detect anti-patterns
    # Identify simple cycles and self loops
    cycles = list(nx.simple_cycles(G))
    cycle_nodes = set()
    for cycle in cycles:
        cycle_nodes.update(cycle)

    sanitized_nodes = []
    for node in blueprint.nodes:
        # Detect node-specific anti-patterns
        anti_patterns = []
        node_centrality = centrality_map.get(node.id, 0.0)
        node_in_degree = in_degree_map.get(node.id, 0)
        node_out_degree = out_degree_map.get(node.id, 0)
        
        # Self-loops
        if G.has_edge(node.id, node.id):
            anti_patterns.append("self_loop")
            
        # Cycles
        if node.id in cycle_nodes:
            anti_patterns.append("dependency_cycle")
            
        # Unprotected synchronous downstream calls
        # (has synchronous outgoing edges to services, but circuit breaker is disabled and retries = 0)
        sync_edges = [edge for edge in blueprint.edges if edge.from_node == node.id and edge.sync]
        if sync_edges and not node.circuit_breaker and node.retries == 0:
            anti_patterns.append("unprotected_sync_call")

        # Single Point of Failure
        if node_centrality > 0.4 and node.replicas <= 1:
            anti_patterns.append("single_point_of_failure")

        # 1. missing_circuit_breaker
        if not node.circuit_breaker and node_centrality > 0.4:
            anti_patterns.append("missing_circuit_breaker")

        # 2. long_sync_chain
        sync_depth = get_longest_downstream_sync_depth(node.id, set())
        if sync_depth > 3:
            anti_patterns.append("long_sync_chain")

        # 3. shared_state_risk
        if node.type in ["database", "queue"] and node_in_degree > 2:
            anti_patterns.append("shared_state_risk")

        # 4. fan_out_explosion
        if node_out_degree > 5:
            anti_patterns.append("fan_out_explosion")

        # 5. queue_without_dlq
        if node.type == "queue" and not node.has_dlq:
            anti_patterns.append("queue_without_dlq")

        # Construct sanitized node with ONLY the allowed keys
        sanitized_node = {
            "node_id": node.id,
            "type": node.type,
            "centrality": round(centrality_map.get(node.id, 0.0), 4),
            "in_degree": in_degree_map.get(node.id, 0),
            "out_degree": out_degree_map.get(node.id, 0),
            "retries": node.retries,
            "circuit_breaker": node.circuit_breaker,
            "timeout_ms": node.timeout_ms,
            "base_latency_ms": node.nominal_latency_ms,
            "error_rate": node.baseline_failure_probability,
            "criticality": node.declared_criticality if node.declared_criticality is not None else 0.0,
            "has_dlq": node.has_dlq,
            "anti_patterns": anti_patterns
        }
        sanitized_nodes.append(sanitized_node)

    sanitized_edges = []
    for edge in blueprint.edges:
        sanitized_edge = {
            "from": edge.from_node,
            "to": edge.to_node,
            "sync": edge.sync,
            "protocol": edge.protocol
        }
        sanitized_edges.append(sanitized_edge)

    return {
        "entry_nodes": list(blueprint.entry_nodes),
        "nodes": sanitized_nodes,
        "edges": sanitized_edges
    }
