from typing import Dict, Any, Tuple
from models.blueprint import Node

def validate_patch(node_id: str, patch: Dict[str, Any], original_node: Node) -> Tuple[bool, str]:
    """
    Validates proposed changes to a node configuration.
    Returns (True, "") if the patch is valid, or (False, "rejection reason") if validation fails.
    """
    # Verify node_id matches
    if original_node.id != node_id:
        return False, f"Node ID mismatch: expected '{original_node.id}', got '{node_id}'"

    # Enforce strict key validation
    allowed_keys = {
        "node_id",
        "changes",
        "circuit_breaker",
        "retries",
        "timeout_ms",
        "replicas",
        "has_dlq",
        "error_rate",
        "baseline_failure_probability"
    }
    invalid_keys = set(patch.keys()) - allowed_keys
    if invalid_keys:
        return False, f"Unexpected/unsupported keys in patch: {sorted(list(invalid_keys))}"

    # 1. Validate retries: 0 <= retries <= 5
    if "retries" in patch:
        retries = patch["retries"]
        if not isinstance(retries, int) or not (0 <= retries <= 5):
            return False, f"Retries value {retries} is invalid: must be an integer between 0 and 5 inclusive."

    # 2. Validate timeout_ms: timeout_ms <= nominal_latency_ms * 10 AND timeout_ms <= 30000
    if "timeout_ms" in patch:
        timeout_ms = patch["timeout_ms"]
        if not isinstance(timeout_ms, (int, float)):
            return False, f"Timeout {timeout_ms} must be a number."
        limit = max(original_node.nominal_latency_ms * 10, 0.0)
        if timeout_ms > limit:
            return False, f"Timeout {timeout_ms} ms exceeds limit of {limit} ms (nominal_latency_ms * 10)."
        if timeout_ms > 30000:
            return False, f"Timeout {timeout_ms} ms exceeds maximum safe limit of 30,000 ms."

    # 3. Validate circuit_breaker: must be a boolean
    if "circuit_breaker" in patch:
        cb = patch["circuit_breaker"]
        if not isinstance(cb, bool):
            return False, f"Circuit breaker status {cb} must be a boolean."

    # 4. Validate replicas: 1 <= replicas <= 10
    if "replicas" in patch:
        replicas = patch["replicas"]
        if not isinstance(replicas, int) or not (1 <= replicas <= 10):
            return False, f"Replicas value {replicas} is invalid: must be an integer between 1 and 10 inclusive."

    # 5a. Validate error_rate (alias used in patch dicts): 0.0 <= value <= 1.0
    if "error_rate" in patch:
        rate = patch["error_rate"]
        if not isinstance(rate, (int, float)) or not (0.0 <= rate <= 1.0):
            return False, f"error_rate {rate} is invalid: must be a float between 0.0 and 1.0 inclusive."

    # 5b. Validate baseline_failure_probability (internal field name): same range
    if "baseline_failure_probability" in patch:
        prob = patch["baseline_failure_probability"]
        if not isinstance(prob, (int, float)) or not (0.0 <= prob <= 1.0):
            return False, f"baseline_failure_probability {prob} must be a float between 0.0 and 1.0 inclusive."

    # 6. Validate has_dlq: must be a boolean
    if "has_dlq" in patch:
        has_dlq = patch["has_dlq"]
        if not isinstance(has_dlq, bool):
            return False, f"has_dlq value {has_dlq} must be a boolean."

    return True, ""
