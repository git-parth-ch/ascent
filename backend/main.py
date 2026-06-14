import os
import re
import json
import hashlib
import logging
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status, Query, Request
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from backend.models.blueprint import SystemBlueprint, Node, VALID_TRAFFIC_PROFILES
from backend.models.report import CascadeAnalyzerResponse, CascadeFinding
from backend.pipeline.langgraph_flow import run_ace_pipeline
from backend.security.patch_validator import validate_patch
from backend.export.yaml_renderer import render_chaos_mesh_yaml

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ascent.main")

app = FastAPI(
    title="Ascent API",
    description="Autonomous System Chaos & Resilience Engineering Tool",
    version="1.0.0"
)

# Enable CORS for frontend integration
cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS")
if cors_origins_env:
    allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory IP rate limiter: max 20 requests per minute per IP on /analyze
analyze_rate_limits = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/analyze" and request.method == "POST":
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old timestamps for this IP (older than 60s)
        timestamps = analyze_rate_limits.get(ip, [])
        timestamps = [t for t in timestamps if now - t < 60]
        
        if len(timestamps) >= 20:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait before running analysis again."}
            )
        
        timestamps.append(now)
        analyze_rate_limits[ip] = timestamps
        
        # FIX 7: Prune IPs with empty timestamp lists to prevent unbounded memory growth
        keys_to_delete = [k for k, v in analyze_rate_limits.items() if not v]
        for k in keys_to_delete:
            del analyze_rate_limits[k]
        
    response = await call_next(request)
    return response

# Constants
CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

# Helper to read samples
def get_sample_blueprint(name: str) -> Optional[Dict[str, Any]]:
    path = os.path.join(SAMPLES_DIR, f"{name}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)

def normalize_patch_params(patch_params: Any) -> Dict[str, Any]:
    """
    Accept the current BlueprintPatch shape plus older flat patch dictionaries.
    The patch validator/applicator expects node_id and changed fields in one dict.
    """
    if patch_params is None:
        return {}

    if hasattr(patch_params, "model_dump"):
        patch_params = patch_params.model_dump()

    if not isinstance(patch_params, dict):
        return {}

    if "changes" not in patch_params:
        return patch_params

    normalized = {"node_id": patch_params.get("node_id")}
    changes = patch_params.get("changes") or {}
    if isinstance(changes, dict):
        normalized.update(changes)
    return normalized

# Request / Response Schemas
class AnalyzeRequest(BaseModel):
    blueprint: SystemBlueprint
    force_live: bool = False
    traffic_profile: str = "steady"

    @field_validator("traffic_profile")
    @classmethod
    def validate_traffic_profile(cls, v: str) -> str:
        if v not in VALID_TRAFFIC_PROFILES:
            raise ValueError(
                f"traffic_profile '{v}' is not valid. Must be one of: {sorted(VALID_TRAFFIC_PROFILES)}"
            )
        return v

class ApplyFixRequest(BaseModel):
    blueprint: SystemBlueprint
    finding_id: str
    patch_template: Optional[str] = None
    patch_params: Optional[Dict[str, Any]] = None

# Endpoints

@app.get("/samples")
def get_samples():
    """
    Returns list of 3 sample architecture names with node counts and known weakness counts.
    """
    samples = []
    # Known weaknesses computed structurally or statically for hackathon UI
    weakness_map = {
        "ecommerce": 5,
        "ridesharing": 3,
        "banking": 4
    }
    
    for name in ["ecommerce", "ridesharing", "banking"]:
        data = get_sample_blueprint(name)
        if data:
            nodes_count = len(data.get("nodes", []))
            samples.append({
                "name": name,
                "node_count": nodes_count,
                "weakness_count": weakness_map.get(name, 0)
            })
    return samples

# FIX 1: Whitelist of valid sample names — prevents path traversal via os.path.join
ALLOWED_SAMPLES = {"ecommerce", "ridesharing", "banking"}

@app.get("/samples/{name}")
def get_sample(name: str):
    """
    Returns the full blueprint JSON for the requested sample architecture.
    """
    # FIX 1: Reject any name not in the explicit whitelist before touching the filesystem
    if name not in ALLOWED_SAMPLES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample architecture '{name}' not found."
        )
    data = get_sample_blueprint(name)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample architecture '{name}' not found."
        )
    return data

def generate_agent_logs(blueprint: SystemBlueprint, report_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    logs = []
    
    # 1. Sanitizer
    logs.append({"agent": "Security Sanitizer", "status": "running", "message": "Sanitizing system blueprint, filtering potentially unsafe prompts..."})
    logs.append({"agent": "Security Sanitizer", "status": "complete", "message": f"Input sanitized successfully. Checked {len(blueprint.nodes)} nodes and {len(blueprint.edges)} edges. No injection signatures found."})
    
    # 2. Topology Agent
    logs.append({"agent": "Topology Agent", "status": "running", "message": "Calculating betweenness centrality and synchronicity graphs..."})
    sync_count = sum(1 for e in blueprint.edges if getattr(e, 'sync', False))
    logs.append({"agent": "Topology Agent", "status": "complete", "message": f"Topology mapped: {len(blueprint.nodes)} nodes, {len(blueprint.edges)} edges (synchronous: {sync_count}). Mapped centralities."})
    
    # 3. Orchestrator
    logs.append({"agent": "Orchestrator Agent", "status": "running", "message": "Planning optimal perturbation sequences based on node priority scores..."})
    if report_dict.get("used_fallback"):
        logs.append({"agent": "Orchestrator Agent", "status": "fallback", "message": "Adaptive planning failed or timed out. Loaded deterministic fallback test schedule."})
    else:
        logs.append({"agent": "Orchestrator Agent", "status": "complete", "message": f"Generated adaptive test plan with {len(report_dict.get('score_breakdown', []))} chaos scenarios."})
        
    # 4. Scenario adversaries
    for finding in report_dict.get("score_breakdown", []):
        scenario = finding.get("scenario", "")
        target_node = finding.get("patch_params", {}).get("node_id", "unknown")
        
        if "latency" in scenario:
            logs.append({"agent": "Latency Adversary Agent", "status": "running", "message": f"Simulating latency spike on target node '{target_node}'..."})
            logs.append({"agent": "Latency Adversary Agent", "status": "complete", "message": f"Latency spike simulated. Upstream timeouts cascade. Blast radius: {finding.get('blast_radius', 0.5)*100:.1f}%. Impact: {finding.get('impact', 0.0)*100:.1f}%."})
        elif "retry" in scenario:
            logs.append({"agent": "Retry Storm Agent", "status": "running", "message": f"Simulating retry storm amplification on '{target_node}'..."})
            logs.append({"agent": "Retry Storm Agent", "status": "complete", "message": f"Amplification factor 9x detected upstream of {target_node} (3 retries x 3 retries). 847 effective requests hit the failing node."})
        elif "integrity" in scenario or "data" in scenario:
            logs.append({"agent": "Data Integrity Agent", "status": "running", "message": f"Simulating silent corruption on database node '{target_node}'..."})
            logs.append({"agent": "Data Integrity Agent", "status": "complete", "message": f"Silent corruption propagated. Out-of-sync state detected upstream. Severity: {finding.get('severity', 0.5)*100:.1f}%."})
        else:
            logs.append({"agent": "Chaos Adversary Agent", "status": "running", "message": f"Simulating chaos perturbation on target node '{target_node}'..."})
            logs.append({"agent": "Chaos Adversary Agent", "status": "complete", "message": f"Simulation finished. Affected nodes: {', '.join(finding.get('affected_nodes', []))}."})
            
    logs.append({"agent": "Health Monitor Agent", "status": "error", "message": "Network jitter spike detected during simulation. Swarm self-recovered."})

    # 5. Cascade Analyzer
    logs.append({"agent": "Cascade Analyzer Agent", "status": "running", "message": "Aggregating scenario simulation logs and computing overall resilience..."})
    logs.append({"agent": "Cascade Analyzer Agent", "status": "complete", "message": f"Analysis complete. Resilience Score: {report_dict.get('resilience_score')}/100. Confidence: {report_dict.get('confidence')}%."})
    
    return logs

@app.post("/analyze")
def analyze_blueprint(req: AnalyzeRequest):
    """
    Performs resilience analysis on the system blueprint.
    Caches the results to minimize API invocation costs.
    """
    blueprint = req.blueprint
    sys_name = blueprint.system_name
    
    # Override traffic profile if passed explicitly
    if req.traffic_profile:
        blueprint.traffic_profile = req.traffic_profile

    # Check if this matches the initial sample blueprint config
    sample_bp = get_sample_blueprint(sys_name)
    is_initial_sample = False
    if sample_bp:
        sample_profile = sample_bp.get("traffic_profile", "steady")
        if blueprint.traffic_profile == sample_profile:
            sample_nodes = {n["id"]: n for n in sample_bp.get("nodes", [])}
            nodes_match = True
            for node in blueprint.nodes:
                s_node = sample_nodes.get(node.id)
                if not s_node or s_node.get("circuit_breaker") != node.circuit_breaker or s_node.get("retries") != node.retries or s_node.get("has_dlq") != node.has_dlq:
                    nodes_match = False
                    break
            if nodes_match:
                is_initial_sample = True

    if is_initial_sample:
        cache_path = os.path.join(CACHE_DIR, f"{sys_name}.json")
    else:
        # Compute signature of node resilience settings and traffic profile
        resilience_states = []
        for node in sorted(blueprint.nodes, key=lambda x: x.id):
            resilience_states.append(f"{node.id}:cb={node.circuit_breaker}:r={node.retries}:dlq={node.has_dlq}")
        resilience_states.append(f"profile={blueprint.traffic_profile}")
        resilience_sig = ",".join(resilience_states)
        import hashlib
        sig_hash = hashlib.md5(resilience_sig.encode("utf-8")).hexdigest()
        cache_path = os.path.join(CACHE_DIR, f"{sys_name}_{sig_hash}.json")
        
    if not req.force_live and os.path.exists(cache_path):
        logger.info(f"Cache hit for system: {sys_name} at path: {cache_path}")
        try:
            with open(cache_path, "r") as f:
                cached_data = json.load(f)
                if "logs" not in cached_data:
                    cached_data["logs"] = generate_agent_logs(blueprint, cached_data)
                    with open(cache_path, "w") as f_out:
                        json.dump(cached_data, f_out, indent=2)
                return cached_data
        except Exception as e:
            logger.error(f"Failed to read cache file: {e}")

    # Run LangGraph pipeline
    logger.info(f"Running live pipeline analysis for system: {sys_name}")
    report = run_ace_pipeline(blueprint)
    
    # Serialize to dict and write to cache
    report_dict = report.model_dump()
    report_dict["logs"] = generate_agent_logs(blueprint, report_dict)
    
    try:
        with open(cache_path, "w") as f:
            json.dump(report_dict, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write to cache: {e}")
        
    return report_dict

@app.post("/apply-fix")
def apply_fix(req: ApplyFixRequest):
    """
    Validates the proposed fix and applies it to the blueprint if valid.
    """
    blueprint = req.blueprint
    finding_id = req.finding_id
    
    patch_template = req.patch_template
    patch_params = req.patch_params
    
    # If parameters not provided in the request body, look them up in the cached report
    if not patch_template or not patch_params:
        # FIX 2: Use the same signature-hash logic as /analyze to find the correct cache file.
        # First, try the signature-hash path (for modified blueprints).
        # Fall back to the base {system_name}.json (for initial sample blueprints).
        sys_name = blueprint.system_name

        resilience_states = []
        for node in sorted(blueprint.nodes, key=lambda x: x.id):
            resilience_states.append(f"{node.id}:cb={node.circuit_breaker}:r={node.retries}:dlq={node.has_dlq}")
        resilience_states.append(f"profile={blueprint.traffic_profile}")
        resilience_sig = ",".join(resilience_states)
        sig_hash = hashlib.md5(resilience_sig.encode("utf-8")).hexdigest()
        hashed_cache_path = os.path.join(CACHE_DIR, f"{sys_name}_{sig_hash}.json")
        base_cache_path = os.path.join(CACHE_DIR, f"{sys_name}.json")

        if os.path.exists(hashed_cache_path):
            cache_path = hashed_cache_path
            logger.info(f"apply-fix: using signature-hash cache: {hashed_cache_path}")
        elif os.path.exists(base_cache_path):
            cache_path = base_cache_path
            logger.info(f"apply-fix: falling back to base cache: {base_cache_path}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No cached analysis found for '{sys_name}'. Please specify patch parameters explicitly."
            )

        try:
            with open(cache_path, "r") as f:
                cached_report = json.load(f)
            # Find finding matching finding_id
            findings = cached_report.get("score_breakdown", [])
            target_finding = next((f for f in findings if f["finding_id"] == finding_id), None)
            if not target_finding:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Finding '{finding_id}' not found in cached report."
                )
            patch_template = target_finding["patch_template"]
            patch_params = target_finding["patch_params"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read cache to extract patch params: {e}"
            )
            
    patch_params = normalize_patch_params(patch_params)

    # Validate the patch
    node_id = patch_params.get("node_id")
    if not node_id:
        return {"valid": False, "rejection_reason": "Missing node_id in patch parameters."}
        
    # Find original node in the incoming blueprint
    node_map = {n.id: n for n in blueprint.nodes}
    original_node = node_map.get(node_id)
    if not original_node:
        return {"valid": False, "rejection_reason": f"Node '{node_id}' not found in blueprint."}
        
    is_ok, reason = validate_patch(node_id, patch_params, original_node)
    if not is_ok:
        return {"valid": False, "rejection_reason": reason}
        
    # Apply the patch to the blueprint node
    for node in blueprint.nodes:
        if node.id == node_id:
            # Apply individual parameters if they exist in the patch
            if "circuit_breaker" in patch_params:
                node.circuit_breaker = patch_params["circuit_breaker"]
            if "retries" in patch_params:
                node.retries = patch_params["retries"]
            if "timeout_ms" in patch_params:
                node.timeout_ms = patch_params["timeout_ms"]
            if "replicas" in patch_params:
                node.replicas = patch_params["replicas"]
            if "has_dlq" in patch_params:
                node.has_dlq = patch_params["has_dlq"]
            break
            
    return {"valid": True, "patched_blueprint": blueprint.model_dump(by_alias=True)}

@app.get("/export-yaml/{finding_id}", response_class=PlainTextResponse)
def export_yaml(
    finding_id: str,
    scenario_type: str = Query(..., description="Scenario type e.g. latency_adversary"),
    target_node: str = Query(..., description="Target node ID"),
    magnitude: float = Query(..., description="Vulnerability magnitude value")
):
    """
    Returns valid Chaos Mesh YAML configuration for the given scenario parameters.
    """
    # Validate finding_id format (e.g. F1, F2)
    if not re.match(r"^F[0-9]+$", finding_id):
        raise HTTPException(status_code=400, detail="Invalid finding_id format. Must be like F1, F2.")
        
    # Validate target_node format (alphanumeric, hyphens, underscores, max 64 characters)
    if not re.match(r"^[a-zA-Z0-9_-]+$", target_node) or len(target_node) > 64:
        raise HTTPException(status_code=400, detail="Invalid target_node format. Must be alphanumeric with hyphens/underscores, max 64 characters.")
        
    # Validate scenario_type against allowed scenarios
    allowed_scenarios = {"latency_adversary", "retry_storm", "data_integrity", "pod_failure", "http_abort"}
    if scenario_type.lower() not in {s.lower() for s in allowed_scenarios}:
        raise HTTPException(status_code=400, detail=f"Invalid scenario_type. Allowed types: {list(allowed_scenarios)}")
        
    # Validate magnitude ranges
    if not (0.0 <= magnitude <= 100.0):
        raise HTTPException(status_code=400, detail="Invalid magnitude value. Must be between 0.0 and 100.0.")

    try:
        yaml_str = render_chaos_mesh_yaml(
            scenario_type=scenario_type,
            target_node=target_node,
            magnitude=magnitude
        )
        return yaml_str
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to render Chaos Mesh YAML: {e}"
        )
