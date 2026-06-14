import sys
import warnings
from backend.models.blueprint import SystemBlueprint, Node, Edge
from backend.simulation.engine import SimulationEngine
from backend.simulation.perturbation import Perturbation, PerturbationType

def run_blueprint_validation_tests():
    print("=== Running Blueprint Validation Tests ===")
    
    # 1. Valid Blueprint
    valid_blueprint_data = {
        "system_name": "Test System",
        "entry_nodes": ["api-gateway"],
        "nodes": [
            {
                "id": "api-gateway",
                "label": "API Gateway",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "orders-service",
                "label": "Orders Service",
                "type": "service",
                "nominal_latency_ms": 20.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            }
        ],
        "edges": [
            {
                "from": "api-gateway",
                "to": "orders-service",
                "protocol": "http",
                "sync": True
            }
        ],
        "traffic_profile": "steady"
    }
    
    try:
        blueprint = SystemBlueprint(**valid_blueprint_data)
        print("OK: Valid blueprint parsed successfully.")
    except Exception as e:
        print(f"FAIL: Failed to parse valid blueprint: {e}")
        sys.exit(1)

    # 2. Duplicate Node IDs
    invalid_dup_ids = dict(valid_blueprint_data)
    invalid_dup_ids["nodes"] = list(valid_blueprint_data["nodes"]) + [valid_blueprint_data["nodes"][1]]
    try:
        SystemBlueprint(**invalid_dup_ids)
        print("FAIL: Failed to catch duplicate Node IDs.")
        sys.exit(1)
    except ValueError as e:
        print(f"OK: Correctly caught duplicate Node IDs error: {e}")

    # 3. Synchronous Queue Edge
    invalid_sync_queue = dict(valid_blueprint_data)
    invalid_sync_queue["nodes"] = [
        valid_blueprint_data["nodes"][0],
        {
            "id": "orders-queue",
            "label": "Orders Queue",
            "type": "queue",
            "nominal_latency_ms": 5.0,
            "baseline_failure_probability": 0.0,
            "timeout_ms": 1000.0,
            "retries": 0,
            "circuit_breaker": False,
            "replicas": 1
        }
    ]
    invalid_sync_queue["edges"] = [
        {
            "from": "api-gateway",
            "to": "orders-queue",
            "protocol": "amqp",
            "sync": True  # Sync queue edge is invalid
        }
    ]
    try:
        SystemBlueprint(**invalid_sync_queue)
        print("FAIL: Failed to catch synchronous queue edge error.")
        sys.exit(1)
    except ValueError as e:
        print(f"OK: Correctly caught synchronous queue edge error: {e}")

    # 4. Cycle & Self-Loop Warnings
    warning_blueprint_data = {
        "system_name": "Warning System",
        "entry_nodes": ["node-a"],
        "nodes": [
            {
                "id": "node-a",
                "label": "Node A",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "node-b",
                "label": "Node B",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            }
        ],
        "edges": [
            # Cycle
            {"from": "node-a", "to": "node-b", "protocol": "http", "sync": True},
            {"from": "node-b", "to": "node-a", "protocol": "http", "sync": True},
            # Self-loop
            {"from": "node-a", "to": "node-a", "protocol": "http", "sync": True}
        ],
        "traffic_profile": "steady"
    }

    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        SystemBlueprint(**warning_blueprint_data)
        warn_messages = [str(warning.message) for warning in w]
        print(f"OK: Warning test triggered. Logged warnings: {warn_messages}")
        assert any("Self-loop detected" in msg for msg in warn_messages), "Missing self-loop warning"
        assert any("Dependency cycle detected" in msg for msg in warn_messages), "Missing cycle warning"
        print("OK: Warnings correctly verified.")

def run_steady_state_test():
    print("\n=== Running Steady State Test ===")
    blueprint_data = {
        "system_name": "Three-Tier App",
        "entry_nodes": ["api-gateway"],
        "nodes": [
            {
                "id": "api-gateway",
                "label": "API Gateway",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 2
            },
            {
                "id": "orders-service",
                "label": "Orders Service",
                "type": "service",
                "nominal_latency_ms": 50.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "payment-service",
                "label": "Payment Service",
                "type": "service",
                "nominal_latency_ms": 150.0,
                "baseline_failure_probability": 0.005,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            }
        ],
        "edges": [
            {"from": "api-gateway", "to": "orders-service", "protocol": "http", "sync": True},
            {"from": "orders-service", "to": "payment-service", "protocol": "http", "sync": True}
        ],
        "traffic_profile": "steady"
    }
    
    blueprint = SystemBlueprint(**blueprint_data)
    engine = SimulationEngine(blueprint, random_seed=42)
    results = engine.run(perturbations=[], duration_ticks=50)
    
    print(f"Total requests: {results['total_requests']}")
    print(f"Requests failed: {results['requests_failed']}")
    print(f"Failure percentage: {results['failure_percentage'] * 100}%")
    print(f"Per-node stats: {results['per_node_stats']}")
    
    # In steady state with very low failure, requests_failed should be low
    assert results['failure_percentage'] < 0.05, f"High failure rate {results['failure_percentage']} in steady state!"
    print("OK: Steady State Test passed.")

def run_latency_injection_test():
    print("\n=== Running Latency Injection Test ===")
    blueprint_data = {
        "system_name": "Three-Tier App",
        "entry_nodes": ["api-gateway"],
        "nodes": [
            {
                "id": "api-gateway",
                "label": "API Gateway",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,  # Strict timeout
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "orders-service",
                "label": "Orders Service",
                "type": "service",
                "nominal_latency_ms": 50.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "payment-service",
                "label": "Payment Service",
                "type": "service",
                "nominal_latency_ms": 150.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            }
        ],
        "edges": [
            {"from": "api-gateway", "to": "orders-service", "protocol": "http", "sync": True},
            {"from": "orders-service", "to": "payment-service", "protocol": "http", "sync": True}
        ],
        "traffic_profile": "steady"
    }

    blueprint = SystemBlueprint(**blueprint_data)
    engine = SimulationEngine(blueprint, random_seed=42)
    
    # Inject 15x latency multiplier to payment-service (150 * 15 = 2250ms), causing timeout
    perturbations = [
        Perturbation(
            target_node="payment-service",
            start_tick=10,
            end_tick=40,
            perturbation_type=PerturbationType.LATENCY,
            magnitude=15.0
        )
    ]
    
    results = engine.run(perturbations=perturbations, duration_ticks=50)
    
    print(f"Total requests: {results['total_requests']}")
    print(f"Requests failed: {results['requests_failed']}")
    print(f"Failure percentage: {results['failure_percentage'] * 100}%")
    print(f"Cascade triggered: {results['cascade_triggered']}")
    print("Cascade Tree Event Log:")
    for event in results['cascade_tree']:
        print(f"  Tick {event.tick}: {event.source_node} -> {event.affected_node} ({event.failure_type}), impact: {event.impact_score:.2f}")

    assert 0.5 <= results['failure_percentage'] <= 0.7, f"Failure percentage {results['failure_percentage']} not in target 50-70% range!"
    assert results['cascade_triggered'], "Cascade was not registered!"
    print("OK: Latency Injection Test passed.")

def run_async_isolation_test():
    print("\n=== Running Async Isolation Test ===")
    blueprint_data = {
        "system_name": "Notification System",
        "entry_nodes": ["payment-service"],
        "nodes": [
            {
                "id": "payment-service",
                "label": "Payment Service",
                "type": "service",
                "nominal_latency_ms": 10.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            },
            {
                "id": "notification-queue",
                "label": "Notification Queue",
                "type": "queue",
                "nominal_latency_ms": 5.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 1000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1,
                "has_dlq": True  # Enable DLQ redirect on overflow
            },
            {
                "id": "email-service",
                "label": "Email Service",
                "type": "service",
                "nominal_latency_ms": 50.0,
                "baseline_failure_probability": 0.0,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1
            }
        ],
        "edges": [
            {"from": "payment-service", "to": "notification-queue", "protocol": "amqp", "sync": False},  # Async
            {"from": "notification-queue", "to": "email-service", "protocol": "http", "sync": False}     # Async worker consumption
        ],
        "traffic_profile": "steady"
    }

    blueprint = SystemBlueprint(**blueprint_data)
    engine = SimulationEngine(blueprint, random_seed=42)
    
    # Inject slowdown on email-service (latency multiplier 30x -> nominal latency goes 50 * 30 = 1500ms)
    # This should severely degrade processing rate of the queue
    perturbations = [
        Perturbation(
            target_node="email-service",
            start_tick=10,
            end_tick=90,
            perturbation_type=PerturbationType.LATENCY,
            magnitude=30.0
        )
    ]
    
    results = engine.run(perturbations=perturbations, duration_ticks=100)
    
    payment_stats = results['per_node_stats']['payment-service']
    queue_stats = results['per_node_stats']['notification-queue']
    email_stats = results['per_node_stats']['email-service']
    
    print(f"Payment success: {payment_stats['success']}, failed: {payment_stats['failed']}")
    print(f"Queue depth: {queue_stats['queue_depth']}, DLQ redirect count: {queue_stats.get('queue_overflow_dlq', 0)}")
    print(f"Email success: {email_stats['success']}, failed: {email_stats['failed']}")
    print(f"Cascade Tree Events count: {len(results['cascade_tree'])}")
    for event in results['cascade_tree']:
        print(f"  Tick {event.tick}: {event.source_node} -> {event.affected_node} ({event.failure_type}), impact: {event.impact_score:.2f}")

    # Assertions
    # 1. Queue depth increases and overflows
    assert queue_stats['queue_depth'] > 0 or queue_stats.get('queue_overflow_dlq', 0) > 0, "Queue depth did not increase or overflow!"
    assert queue_stats.get('queue_overflow_dlq', 0) > 0, "DLQ redirect behavior did not trigger!"
    
    # 2. payment-service remains operational (isolated)
    assert payment_stats['failed'] == 0, "payment-service suffered failures due to downstream queue backpressure!"
    assert payment_stats['success'] > 0, "payment-service has no successful requests!"
    
    print("OK: Async Isolation Test passed successfully!")

if __name__ == "__main__":
    run_blueprint_validation_tests()
    run_steady_state_test()
    run_latency_injection_test()
    run_async_isolation_test()
    print("\nAll verification tests completed successfully!")
