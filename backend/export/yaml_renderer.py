import os
from jinja2 import Environment, FileSystemLoader

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

def render_chaos_mesh_yaml(scenario_type: str, target_node: str, magnitude: float, duration_ticks: int = 40) -> str:
    """
    Renders Chaos Mesh YAML from Jinja2 templates based on the scenario type.
    """
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    
    # Map scenario_type to template filenames
    # Supports prefix matching or exact mapping (e.g. latency_adversary -> latency_chaos.yaml.j2)
    scen_lower = scenario_type.lower()
    if "latency" in scen_lower:
        template_name = "latency_chaos.yaml.j2"
    elif "retry" in scen_lower or "storm" in scen_lower or "pod" in scen_lower:
        template_name = "pod_failure.yaml.j2"
    elif "integrity" in scen_lower or "abort" in scen_lower or "data" in scen_lower:
        template_name = "http_abort.yaml.j2"
    else:
        # Default fallback
        template_name = "latency_chaos.yaml.j2"
        
    template = env.get_template(template_name)
    
    # For HTTPChaos or other corruption, translate corruption rate (e.g. 0.25) or magnitude
    rendered = template.render(
        target_node=target_node,
        magnitude=magnitude,
        duration_ticks=duration_ticks
    )
    return rendered
