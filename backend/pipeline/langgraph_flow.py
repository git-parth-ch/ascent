import time
import logging
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

from models.blueprint import SystemBlueprint
from models.report import TopologyResponse, OrchestratorResponse, CascadeAnalyzerResponse
from security.sanitizer import sanitize_blueprint_for_llm
from security.patch_validator import validate_patch
from simulation.engine import SimulationEngine
from simulation.perturbation import Perturbation, PerturbationType
from agents.topology import TopologyAgent
from agents.orchestrator import OrchestratorAgent
from agents.latency_adversary import LatencyAdversaryAgent
from agents.retry_storm import RetryStormAgent
from agents.data_integrity import DataIntegrityAgent
from agents.cascade_analyzer import CascadeAnalyzerAgent

logger = logging.getLogger("ace.pipeline.langgraph_flow")

class PipelineState(TypedDict):
    blueprint: SystemBlueprint
    sanitized_metadata: Optional[Dict[str, Any]]
    annotated_graph: Optional[TopologyResponse]
    orchestrator_plan: Optional[OrchestratorResponse]
    simulation_logs: List[Dict[str, Any]]
    final_report: Optional[CascadeAnalyzerResponse]
    current_step: int
    compound_test_needed: bool

# --- Node implementations ---

def sanitize_input_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting sanitize_input node...")
    sanitized = sanitize_blueprint_for_llm(state["blueprint"])
    logger.info(f"sanitize_input completed in {time.time() - t0:.2f}s")
    return {"sanitized_metadata": sanitized}

def topology_analysis_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting topology_analysis node...")
    topo_res = TopologyAgent().run(state["blueprint"])
    logger.info(f"topology_analysis completed in {time.time() - t0:.2f}s (provider: {topo_res.provider}, fallback: {topo_res.used_fallback})")
    return {"annotated_graph": topo_res}

def orchestrator_planning_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting orchestrator_planning node...")
    orch_res = OrchestratorAgent().run(state["annotated_graph"], state["blueprint"])
    logger.info(f"orchestrator_planning completed in {time.time() - t0:.2f}s (provider: {orch_res.provider}, fallback: {orch_res.used_fallback})")
    return {"orchestrator_plan": orch_res}

def run_scenarios_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting run_scenarios node...")
    blueprint = state["blueprint"]
    plan = state["orchestrator_plan"]
    
    logs = []
    compound_needed = False
    
    for step in plan.test_plan:
        scenario_type = step.scenario_type
        target_node = step.target_node
        logger.info(f"Running scenario step {step.step}: {scenario_type} on target {target_node}")
        
        perts = []
        if scenario_type == "latency_adversary":
            lat_res = LatencyAdversaryAgent().run(target_node, blueprint)
            perts.append(Perturbation(
                target_node=target_node,
                start_tick=lat_res.perturbation.start_tick,
                end_tick=lat_res.perturbation.end_tick,
                perturbation_type=PerturbationType.LATENCY,
                magnitude=lat_res.perturbation.latency_multiplier
            ))
            perts.append(Perturbation(
                target_node=target_node,
                start_tick=lat_res.perturbation.start_tick,
                end_tick=lat_res.perturbation.end_tick,
                perturbation_type=PerturbationType.FAILURE,
                magnitude=lat_res.perturbation.error_rate_override
            ))
        elif scenario_type == "retry_storm":
            retry_res = RetryStormAgent().run(target_node, blueprint)
            # Simulate retry storm with latency overload + failure
            perts.append(Perturbation(
                target_node=target_node,
                start_tick=25,
                end_tick=65,
                perturbation_type=PerturbationType.LATENCY,
                magnitude=retry_res.effective_load_multiplier
            ))
            perts.append(Perturbation(
                target_node=target_node,
                start_tick=25,
                end_tick=65,
                perturbation_type=PerturbationType.FAILURE,
                magnitude=min(0.8, 0.1 * retry_res.effective_load_multiplier)
            ))
        elif scenario_type == "data_integrity":
            di_res = DataIntegrityAgent().run(target_node, blueprint)
            perts.append(Perturbation(
                target_node=target_node,
                start_tick=20,
                end_tick=60,
                perturbation_type=PerturbationType.CORRUPTION,
                magnitude=di_res.corruption_rate
            ))
        else:
            logger.warning(f"Unknown scenario type: {scenario_type}, skipping simulation.")
            continue
            
        # Execute simulator
        engine = SimulationEngine(blueprint)
        results = engine.run(perts, duration_ticks=100)
        results["target_node"] = target_node
        results["scenario"] = f"{scenario_type}_{target_node}"
        logs.append(results)
        
        # Check if cascade impact (failure percentage) is below 20%
        if results.get("failure_percentage", 0.0) < 0.2:
            compound_needed = True
            
    logger.info(f"run_scenarios completed in {time.time() - t0:.2f}s. compound_needed={compound_needed}")
    return {"simulation_logs": logs, "compound_test_needed": compound_needed}

def compound_simulation_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting compound_simulation node...")
    blueprint = state["blueprint"]
    
    # Identify highest priority node
    if not state["annotated_graph"] or not state["annotated_graph"].annotated_nodes:
        logger.warning("No annotated graph available to find highest priority node. Skipping compound simulation.")
        return {}
        
    highest_node_annotation = max(state["annotated_graph"].annotated_nodes, key=lambda x: x.priority_score)
    highest_node = highest_node_annotation.node_id
    logger.info(f"Running compound latency + retry storm on highest priority node: {highest_node}")
    
    # Fetch parameters from both agents
    lat_res = LatencyAdversaryAgent().run(highest_node, blueprint)
    retry_res = RetryStormAgent().run(highest_node, blueprint)
    
    # Combine perturbations
    perts = [
        # Latency spike
        Perturbation(
            target_node=highest_node,
            start_tick=lat_res.perturbation.start_tick,
            end_tick=lat_res.perturbation.end_tick,
            perturbation_type=PerturbationType.LATENCY,
            magnitude=lat_res.perturbation.latency_multiplier
        ),
        Perturbation(
            target_node=highest_node,
            start_tick=lat_res.perturbation.start_tick,
            end_tick=lat_res.perturbation.end_tick,
            perturbation_type=PerturbationType.FAILURE,
            magnitude=lat_res.perturbation.error_rate_override
        ),
        # Retry storm overload
        Perturbation(
            target_node=highest_node,
            start_tick=25,
            end_tick=65,
            perturbation_type=PerturbationType.LATENCY,
            magnitude=retry_res.effective_load_multiplier
        ),
        Perturbation(
            target_node=highest_node,
            start_tick=25,
            end_tick=65,
            perturbation_type=PerturbationType.FAILURE,
            magnitude=min(0.8, 0.1 * retry_res.effective_load_multiplier)
        )
    ]
    
    # Run simulation
    engine = SimulationEngine(blueprint)
    results = engine.run(perts, duration_ticks=100)
    results["target_node"] = highest_node
    results["scenario"] = f"compound_latency_retry_storm_{highest_node}"
    
    updated_logs = list(state["simulation_logs"]) + [results]
    logger.info(f"compound_simulation completed in {time.time() - t0:.2f}s")
    return {"simulation_logs": updated_logs}

def cascade_analysis_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting cascade_analysis node...")
    
    # Determine if any fallbacks were used in preceding steps
    any_fallback = False
    if state["annotated_graph"] and state["annotated_graph"].used_fallback:
        any_fallback = True
    if state["orchestrator_plan"] and state["orchestrator_plan"].used_fallback:
        any_fallback = True
        
    analyzer_res = CascadeAnalyzerAgent().run(
        simulation_logs=state["simulation_logs"],
        blueprint=state["blueprint"],
        any_fallback_used=any_fallback
    )
    logger.info(f"cascade_analysis completed in {time.time() - t0:.2f}s (provider: {analyzer_res.provider}, fallback: {analyzer_res.used_fallback})")
    return {"final_report": analyzer_res}

def validate_patches_node(state: PipelineState) -> Dict[str, Any]:
    t0 = time.time()
    logger.info("Starting validate_patches node...")
    blueprint = state["blueprint"]
    report = state["final_report"]
    
    if not report or not report.score_breakdown:
        logger.warning("No report findings to validate.")
        return {}
        
    node_map = {n.id: n for n in blueprint.nodes}
    
    for finding in report.score_breakdown:
        p_params = finding.patch_params
        n_id = p_params.node_id
        changes = p_params.changes
        orig_node = node_map.get(n_id)
        if not orig_node:
            logger.warning(f"Finding {finding.finding_id}: Target node '{n_id}' not found in blueprint.")
            continue
            
        is_ok, reason = validate_patch(n_id, changes, orig_node)
        if is_ok:
            logger.info(f"Finding {finding.finding_id}: Patch parameters are VALID.")
        else:
            logger.warning(f"Finding {finding.finding_id}: Patch parameters are INVALID: {reason}")
            
    logger.info(f"validate_patches completed in {time.time() - t0:.2f}s")
    return {}

# --- Conditional routing helper ---

def check_compound_edge(state: PipelineState) -> str:
    if state["compound_test_needed"]:
        return "compound_simulation"
    return "cascade_analysis"

# --- Building the Graph ---

def build_pipeline() -> StateGraph:
    workflow = StateGraph(PipelineState)
    
    # Add nodes
    workflow.add_node("sanitize_input", sanitize_input_node)
    workflow.add_node("topology_analysis", topology_analysis_node)
    workflow.add_node("orchestrator_planning", orchestrator_planning_node)
    workflow.add_node("run_scenarios", run_scenarios_node)
    workflow.add_node("compound_simulation", compound_simulation_node)
    workflow.add_node("cascade_analysis", cascade_analysis_node)
    workflow.add_node("validate_patches", validate_patches_node)
    
    # Define edges
    workflow.set_entry_point("sanitize_input")
    workflow.add_edge("sanitize_input", "topology_analysis")
    workflow.add_edge("topology_analysis", "orchestrator_planning")
    workflow.add_edge("orchestrator_planning", "run_scenarios")
    
    # Conditional edge after running scenarios
    workflow.add_conditional_edges(
        "run_scenarios",
        check_compound_edge,
        {
            "compound_simulation": "compound_simulation",
            "cascade_analysis": "cascade_analysis"
        }
    )
    
    workflow.add_edge("compound_simulation", "cascade_analysis")
    workflow.add_edge("cascade_analysis", "validate_patches")
    workflow.add_edge("validate_patches", END)
    
    return workflow.compile()

# Global pipeline runner function
def run_ace_pipeline(blueprint: SystemBlueprint) -> CascadeAnalyzerResponse:
    app = build_pipeline()
    initial_state: PipelineState = {
        "blueprint": blueprint,
        "sanitized_metadata": None,
        "annotated_graph": None,
        "orchestrator_plan": None,
        "simulation_logs": [],
        "final_report": None,
        "current_step": 0,
        "compound_test_needed": False
    }
    
    final_output = app.invoke(initial_state)
    return final_output["final_report"]
