import random
from typing import List, Dict, Any, Tuple, Set
from models.blueprint import SystemBlueprint, Node, Edge
from simulation.circuit_breaker import CircuitBreaker
from simulation.traffic_profiles import get_traffic_for_tick
from simulation.perturbation import Perturbation, PerturbationType
from simulation.cascade import CascadeEvent

class SimulationEngine:
    def __init__(self, blueprint: SystemBlueprint, random_seed: int = 42):
        self.blueprint = blueprint
        self.random_seed = random_seed
        self.node_map: Dict[str, Node] = {node.id: node for node in blueprint.nodes}
        
        # Initialize circuit breakers for all nodes
        self.circuit_breakers: Dict[str, CircuitBreaker] = {
            node.id: CircuitBreaker(threshold=0.5, ticks_to_half_open=10, probe_limit=10)
            for node in blueprint.nodes
        }
        
        # Initialize queue buffers for queue-type nodes
        self.queue_buffers: Dict[str, List[Dict[str, Any]]] = {
            node.id: [] for node in blueprint.nodes if node.type == "queue"
        }
        
        # Local RNG for the simulation run
        self.rng = random.Random(random_seed)

        # Pre-compute expected steady-state latency for each node to prevent false degradations
        self.expected_steady_latency = {}
        for node in blueprint.nodes:
            self.expected_steady_latency[node.id] = self.get_effective_latency(node.id, 0, [])

    def get_effective_latency(self, node_id: str, tick: int, active_perts: List[Perturbation], visited: Set[str] = None) -> float:
        """
        Recursively calculates the expected execution latency of a node and its downstream
        synchronous dependencies, accounting for active latency perturbations.
        Prevents infinite recursion in case of graph cycles.
        """
        if visited is None:
            visited = set()
        if node_id in visited:
            return 0.0
        visited.add(node_id)

        node = self.node_map.get(node_id)
        if not node:
            return 0.0

        # Base latency multiplier
        latency_mult = 1.0
        for pert in active_perts:
            if pert.target_node == node_id and pert.perturbation_type == PerturbationType.LATENCY:
                latency_mult = max(latency_mult, pert.magnitude)

        node_latency = node.nominal_latency_ms * latency_mult

        # Sum synchronous downstreams
        sync_edges = [edge for edge in self.blueprint.edges if edge.from_node == node_id and edge.sync]
        downstream_lat = 0.0
        for edge in sync_edges:
            downstream_lat += self.get_effective_latency(edge.to_node, tick, active_perts, visited)

        visited.remove(node_id)
        return node_latency + downstream_lat

    def run(self, perturbations: List[Perturbation], duration_ticks: int = 100) -> Dict[str, Any]:
        """
        Runs the tick-based simulation over the specified duration and returns
        per-node metrics, overall stats, and structural cascade events.
        """
        # Global accumulation stats
        stats = {
            node.id: {
                "success": 0,
                "failed": 0,
                "timed_out": 0,
                "cb_rejected": 0,
                "total_latency": 0.0,
                "received": 0,
                "queue_overflow_dlq": 0,
                "queue_overflow_drop": 0
            }
            for node in self.blueprint.nodes
        }

        cascade_events: List[CascadeEvent] = []
        degraded_nodes: Dict[str, int] = {}  # node_id -> causal tick first degraded
        logged_overflows: Set[Tuple[int, str, str]] = set()  # (tick, queue_id, type) to deduplicate logs

        # Main simulation loop
        for tick in range(duration_ticks):
            # 1. Identify active perturbations for this tick
            active_perts = [p for p in perturbations if p.start_tick <= tick <= p.end_tick]

            # 2. Tick-level stats for CB updates and cascade checks
            tick_stats = {
                node.id: {
                    "success": 0,
                    "failed": 0,
                    "received": 0
                }
                for node in self.blueprint.nodes
            }

            # 3. Recursive synchronous execution helper with deadline propagation
            def execute_node(node_id: str, deadline: float, request_id: str) -> Tuple[bool, float, str]:
                node = self.node_map[node_id]
                cb = self.circuit_breakers[node_id]

                # Sequence 1: Circuit Breaker Evaluation
                if node.circuit_breaker:
                    if not cb.should_allow_request(self.rng):
                        stats[node_id]["cb_rejected"] += 1
                        stats[node_id]["received"] += 1
                        stats[node_id]["failed"] += 1
                        tick_stats[node_id]["received"] += 1
                        tick_stats[node_id]["failed"] += 1
                        return False, 0.0, "circuit_breaker_rejected"

                stats[node_id]["received"] += 1
                tick_stats[node_id]["received"] += 1

                # Determine local failure chance and latency scale
                latency_mult = 1.0
                fail_prob = node.baseline_failure_probability

                for pert in active_perts:
                    if pert.target_node == node_id:
                        if pert.perturbation_type == PerturbationType.LATENCY:
                            latency_mult = max(latency_mult, pert.magnitude)
                        elif pert.perturbation_type in (PerturbationType.FAILURE, PerturbationType.CORRUPTION):
                            fail_prob = max(fail_prob, pert.magnitude)

                node_latency = node.nominal_latency_ms * latency_mult
                effective_timeout = min(node.timeout_ms, deadline)

                # Sequence 2: Request Execution & Sequence 3: Retry Policy Evaluation
                max_attempts = node.retries + 1
                attempt_success = False
                total_latency_spent = 0.0
                error_reason = ""

                for attempt in range(max_attempts):
                    # Check local failure
                    local_failed = self.rng.random() < fail_prob
                    
                    # Execute synchronous downstream dependencies
                    downstream_failed = False
                    downstream_latency = 0.0
                    downstream_reason = ""

                    sync_edges = [edge for edge in self.blueprint.edges if edge.from_node == node_id and edge.sync]
                    for edge in sync_edges:
                        # Propagate remaining deadline to the child call
                        child_deadline = max(0.0, effective_timeout - (node_latency + downstream_latency))
                        child_ok, child_lat, child_reason = execute_node(
                            edge.to_node,
                            child_deadline,
                            request_id
                        )
                        downstream_latency += child_lat
                        if not child_ok:
                            downstream_failed = True
                            downstream_reason = child_reason
                            break  # Fail fast on first synchronous failure

                    # Handle asynchronous downstream calls (push to queues)
                    async_edges = [edge for edge in self.blueprint.edges if edge.from_node == node_id and not edge.sync]
                    for edge in async_edges:
                        target_queue = edge.to_node
                        target_node_obj = self.node_map.get(target_queue)
                        if target_node_obj and target_node_obj.type == "queue":
                            q_buf = self.queue_buffers[target_queue]
                            if len(q_buf) >= 1000:  # queue_capacity = 1000
                                if target_node_obj.has_dlq:
                                    stats[target_queue]["queue_overflow_dlq"] += 1
                                    if (tick, target_queue, "dlq") not in logged_overflows:
                                        logged_overflows.add((tick, target_queue, "dlq"))
                                        cascade_events.append(CascadeEvent(
                                            tick=tick,
                                            source_node=node_id,
                                            affected_node=target_queue,
                                            failure_type="QUEUE_OVERFLOW_DLQ",
                                            impact_score=1.0
                                        ))
                                else:
                                    stats[target_queue]["queue_overflow_drop"] += 1
                                    if (tick, target_queue, "drop") not in logged_overflows:
                                        logged_overflows.add((tick, target_queue, "drop"))
                                        cascade_events.append(CascadeEvent(
                                            tick=tick,
                                            source_node=node_id,
                                            affected_node=target_queue,
                                            failure_type="QUEUE_OVERFLOW_DROP",
                                            impact_score=1.0
                                        ))
                            else:
                                q_buf.append({"request_id": request_id, "tick": tick, "source": node_id})

                    # Calculate total time for this attempt
                    attempt_time = node_latency + downstream_latency
                    
                    # Evaluate Timeout
                    timed_out = attempt_time >= effective_timeout
                    
                    if local_failed:
                        error_reason = "local_failure"
                    elif downstream_failed:
                        error_reason = downstream_reason
                    elif timed_out:
                        error_reason = "timeout"

                    if not local_failed and not downstream_failed and not timed_out:
                        attempt_success = True
                        total_latency_spent += attempt_time
                        break
                    else:
                        actual_spent = min(attempt_time, effective_timeout)
                        total_latency_spent += actual_spent
                        # If retrying, add retry backoff (100ms)
                        if attempt < max_attempts - 1:
                            total_latency_spent += 100.0

                # Sequence 4: Outcome Recording & CB state updates
                if attempt_success:
                    stats[node_id]["success"] += 1
                    stats[node_id]["total_latency"] += total_latency_spent
                    tick_stats[node_id]["success"] += 1
                    if node.circuit_breaker:
                        cb.record_result(True)
                    return True, total_latency_spent, ""
                else:
                    stats[node_id]["failed"] += 1
                    if error_reason == "timeout":
                        stats[node_id]["timed_out"] += 1
                    tick_stats[node_id]["failed"] += 1
                    if node.circuit_breaker:
                        cb.record_result(False)
                    return False, total_latency_spent, error_reason

            # Generate incoming request volume for the entry nodes
            traffic_volume = get_traffic_for_tick(self.blueprint.traffic_profile, tick, self.random_seed)
            for req_idx in range(traffic_volume):
                req_id = f"req_{tick}_{req_idx}"
                for entry_node in self.blueprint.entry_nodes:
                    node_obj = self.node_map[entry_node]
                    execute_node(entry_node, node_obj.timeout_ms, req_id)

            # 4. Process Asynchronous Queues
            for q_id, q_buffer in self.queue_buffers.items():
                queue_node = self.node_map[q_id]
                
                # Calculate downstream sync latency to model backpressure
                downstream_nodes = [edge.to_node for edge in self.blueprint.edges if edge.from_node == q_id]
                downstream_latency = sum(
                    self.get_effective_latency(d, tick, active_perts) for d in downstream_nodes
                )
                
                if downstream_latency == 0.0:
                    downstream_latency = 1.0

                # Calculate processing rate based on downstream processing speed
                concurrency = queue_node.replicas * 10
                max_messages = (concurrency * 1000.0) / downstream_latency
                processing_rate = min(100.0, max_messages)

                # Check queue slowdown perturbations
                slowdown_pert = next(
                    (p for p in active_perts if p.target_node == q_id and p.perturbation_type == PerturbationType.QUEUE_SLOWDOWN),
                    None
                )
                if slowdown_pert:
                    processing_rate = processing_rate / slowdown_pert.magnitude

                processing_rate = max(0, int(processing_rate))

                # Process up to 'processing_rate' items from queue
                items_to_process = q_buffer[:processing_rate]
                del q_buffer[:processing_rate]

                for item in items_to_process:
                    # Propagate queue message to downstream targets
                    for d_node in downstream_nodes:
                        node_obj = self.node_map[d_node]
                        execute_node(d_node, node_obj.timeout_ms, item["request_id"])

            # 5. Sequence 5: Circuit Breaker State Update & Cascade Tracking
            for node_id in stats.keys():
                node = self.node_map[node_id]
                if node.circuit_breaker:
                    t_stats = tick_stats[node_id]
                    cb = self.circuit_breakers[node_id]
                    err_rate = t_stats["failed"] / t_stats["received"] if t_stats["received"] > 0 else 0.0
                    cb.tick_update(err_rate, t_stats["received"])

            # Check node degradation to log CascadeEvents
            newly_degraded = set()
            for node_id in stats.keys():
                t_stats = tick_stats[node_id]
                cb = self.circuit_breakers[node_id]
                node = self.node_map[node_id]
                total_node_stats = stats[node_id]
                
                avg_latency = (
                    total_node_stats["total_latency"] / total_node_stats["success"]
                    if total_node_stats["success"] > 0 else 0.0
                )
                
                expected_lat = self.expected_steady_latency[node_id]
                err_rate = t_stats["failed"] / t_stats["received"] if t_stats["received"] > 0 else 0.0
                
                is_degraded = (
                    err_rate > 0.1 or 
                    cb.state == "OPEN" or
                    (avg_latency > expected_lat * 2.0 and avg_latency > 0.0) or
                    total_node_stats["queue_overflow_drop"] > 0 or
                    total_node_stats["queue_overflow_dlq"] > 0
                )

                if is_degraded and node_id not in degraded_nodes:
                    newly_degraded.add(node_id)

            # Resolve newly degraded nodes in topological order (downstream dependencies first)
            while newly_degraded:
                node_to_resolve = None
                for nid in newly_degraded:
                    sync_downstream = [edge.to_node for edge in self.blueprint.edges if edge.from_node == nid and edge.sync]
                    has_unresolved_downstream = any(d in newly_degraded for d in sync_downstream)
                    if not has_unresolved_downstream:
                        node_to_resolve = nid
                        break
                
                # Default to fallback in case of cycle
                if not node_to_resolve:
                    node_to_resolve = next(iter(newly_degraded))
                
                nid = node_to_resolve
                newly_degraded.remove(nid)
                
                # Check for active perturbation
                local_pert = next((p for p in active_perts if p.target_node == nid), None)
                
                sync_downstream = [edge.to_node for edge in self.blueprint.edges if edge.from_node == nid and edge.sync]
                degraded_downstreams = [d for d in sync_downstream if d in degraded_nodes]
                
                if local_pert:
                    causal_tick = tick
                elif degraded_downstreams:
                    # Propagate tick: caller fails 1 tick after downstream fails
                    min_tick = min(degraded_nodes[d] for d in degraded_downstreams)
                    causal_tick = min_tick + 1
                else:
                    causal_tick = tick
                
                degraded_nodes[nid] = causal_tick
                
                # Determine root cause node (source_node)
                source = nid
                fail_type = "degraded"
                
                if local_pert:
                    source = nid
                    fail_type = local_pert.perturbation_type.value.lower()
                elif degraded_downstreams:
                    degraded_downstreams.sort(key=lambda x: degraded_nodes[x])
                    source = degraded_downstreams[0]
                    fail_type = "upstream_timeout" if stats[nid]["timed_out"] > 0 else "dependency_failure"
                elif cb.state == "OPEN":
                    source = nid
                    fail_type = "circuit_breaker_open"
                elif nid in self.queue_buffers and (stats[nid]["queue_overflow_drop"] > 0 or stats[nid]["queue_overflow_dlq"] > 0):
                    source = nid
                    fail_type = "queue_overflow"
                
                cascade_events.append(CascadeEvent(
                    tick=causal_tick,
                    source_node=source,
                    affected_node=nid,
                    failure_type=fail_type,
                    impact_score=tick_stats[nid]["failed"] / tick_stats[nid]["received"] if tick_stats[nid]["received"] > 0 else 1.0
                ))

        # Sort all cascade events chronologically by causal tick
        cascade_events.sort(key=lambda x: x.tick)

        # 6. Format Final Response statistics
        final_per_node_stats = {}
        for nid, n_stats in stats.items():
            cb = self.circuit_breakers[nid]
            avg_lat = n_stats["total_latency"] / n_stats["success"] if n_stats["success"] > 0 else 0.0
            
            final_node_stat = {
                "success": n_stats["success"],
                "failed": n_stats["failed"],
                "timed_out": n_stats["timed_out"],
                "avg_latency_ms": round(avg_lat, 2),
                "circuit_breaker_state": cb.state
            }
            if nid in self.queue_buffers:
                final_node_stat["queue_depth"] = len(self.queue_buffers[nid])
                final_node_stat["queue_overflow_dlq"] = n_stats["queue_overflow_dlq"]
                final_node_stat["queue_overflow_drop"] = n_stats["queue_overflow_drop"]
                
            final_per_node_stats[nid] = final_node_stat

        # Sum entry-level failures to calculate score
        total_entry_received = sum(stats[entry]["received"] for entry in self.blueprint.entry_nodes)
        total_entry_failed = sum(stats[entry]["failed"] for entry in self.blueprint.entry_nodes)
        
        failure_percentage = total_entry_failed / total_entry_received if total_entry_received > 0 else 0.0
        cascade_triggered = len(cascade_events) > 0

        return {
            "per_node_stats": final_per_node_stats,
            "cascade_triggered": cascade_triggered,
            "cascade_tree": cascade_events,
            "total_requests": total_entry_received,
            "requests_failed": total_entry_failed,
            "failure_percentage": round(failure_percentage, 4)
        }
