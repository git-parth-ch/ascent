import os
import sys
from dotenv import load_dotenv

# Add workspace and backend to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

from models.blueprint import SystemBlueprint
from agents.topology import TopologyAgent
from agents.orchestrator import OrchestratorAgent
from agents.latency_adversary import LatencyAdversaryAgent
from agents.retry_storm import RetryStormAgent
from agents.data_integrity import DataIntegrityAgent
from agents.cascade_analyzer import CascadeAnalyzerAgent

def run_smoke_tests():
    print("=== STARTING AGENT SMOKE TESTS ===")
    
    # 1. Mock System Blueprint
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
                "replicas": 2,
                "has_dlq": False
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
                "replicas": 1,
                "has_dlq": False
            },
            {
                "id": "payment-service",
                "label": "Payment Service",
                "type": "database",  # database type for data_integrity test rules
                "nominal_latency_ms": 150.0,
                "baseline_failure_probability": 0.005,
                "timeout_ms": 2000.0,
                "retries": 0,
                "circuit_breaker": False,
                "replicas": 1,
                "has_dlq": False
            }
        ],
        "edges": [
            {"from": "api-gateway", "to": "orders-service", "protocol": "http", "sync": True},
            {"from": "orders-service", "to": "payment-service", "protocol": "http", "sync": True}
        ],
        "traffic_profile": "steady"
    }
    
    blueprint = SystemBlueprint(**blueprint_data)
    print("OK: Mock blueprint loaded successfully.")

    # 2. Topology Agent
    print("\n--- Running TopologyAgent ---")
    topology_agent = TopologyAgent()
    topo_res = topology_agent.run(blueprint)
    print(f"Agent Name: {topology_agent.name}")
    print(f"Provider Used: {topo_res.provider}")
    print(f"Used Fallback: {topo_res.used_fallback}")
    print(f"Summary Text: {topo_res.summary_text}")
    assert len(topo_res.annotated_nodes) == 3

    # 3. Orchestrator Agent
    print("\n--- Running OrchestratorAgent ---")
    orchestrator_agent = OrchestratorAgent()
    orch_res = orchestrator_agent.run(topo_res, blueprint)
    print(f"Agent Name: {orchestrator_agent.name}")
    print(f"Provider Used: {orch_res.provider}")
    print(f"Used Fallback: {orch_res.used_fallback}")
    print(f"Adaptive Rule: {orch_res.adaptive_rule}")
    for step in orch_res.test_plan:
        print(f"  Step {step.step}: Target={step.target_node}, Scenario={step.scenario_type}, Reason={step.reason_natural_language}")
    assert len(orch_res.test_plan) > 0

    # 4. Latency Adversary Agent
    print("\n--- Running LatencyAdversaryAgent ---")
    latency_agent = LatencyAdversaryAgent()
    lat_res = latency_agent.run("payment-service", blueprint)
    print(f"Agent Name: {latency_agent.name}")
    print(f"Provider Used: {lat_res.provider}")
    print(f"Used Fallback: {lat_res.used_fallback}")
    print(f"Hypothesis Text: {lat_res.hypothesis_text}")
    print(f"Perturbation details: mult={lat_res.perturbation.latency_multiplier}, error_rate={lat_res.perturbation.error_rate_override}")

    # 5. Retry Storm Agent
    print("\n--- Running RetryStormAgent ---")
    retry_agent = RetryStormAgent()
    retry_res = retry_agent.run("payment-service", blueprint)
    print(f"Agent Name: {retry_agent.name}")
    print(f"Provider Used: {retry_res.provider}")
    print(f"Used Fallback: {retry_res.used_fallback}")
    print(f"Explanation Text: {retry_res.explanation_text}")
    print(f"Amplification Factor: {retry_res.amplification_factor}, Effective Load Multiplier: {retry_res.effective_load_multiplier}")

    # 6. Data Integrity Agent
    print("\n--- Running DataIntegrityAgent ---")
    di_agent = DataIntegrityAgent()
    di_res = di_agent.run("payment-service", blueprint)
    print(f"Agent Name: {di_agent.name}")
    print(f"Provider Used: {di_res.provider}")
    print(f"Used Fallback: {di_res.used_fallback}")
    print(f"Description Text: {di_res.description_text}")
    print(f"Corruption Rate: {di_res.corruption_rate}, Detection Delay Ticks: {di_res.detection_delay_ticks}")

    # 7. Cascade Analyzer Agent
    print("\n--- Running CascadeAnalyzerAgent ---")
    mock_sim_logs = [
        {
            "target_node": "payment-service",
            "scenario": "latency_adversary_payment-service",
            "total_requests": 1000,
            "requests_failed": 600,
            "cascade_tree": []
        },
        {
            "target_node": "payment-service",
            "scenario": "data_integrity_payment-service",
            "total_requests": 1000,
            "requests_failed": 0,
            "cascade_tree": []
        }
    ]
    cascade_agent = CascadeAnalyzerAgent()
    cascade_res = cascade_agent.run(mock_sim_logs, blueprint)
    print(f"Agent Name: {cascade_agent.name}")
    print(f"Provider Used: {cascade_res.provider}")
    print(f"Used Fallback: {cascade_res.used_fallback}")
    print(f"Resilience Score: {cascade_res.resilience_score}")
    print(f"Confidence: {cascade_res.confidence}")
    print(f"Overall Summary: {cascade_res.overall_summary}")
    for idx, finding in enumerate(cascade_res.score_breakdown):
        print(f"  Finding {finding.finding_id}: Title='{finding.title}', Impact={finding.impact}, Remediation='{finding.remediation_text}', Patch template='{finding.patch_template}' params={finding.patch_params}")

    print("\n=== ALL AGENT SMOKE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_smoke_tests()
