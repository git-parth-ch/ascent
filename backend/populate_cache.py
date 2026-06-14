import os
import json
from backend.models.blueprint import SystemBlueprint
from backend.pipeline.langgraph_flow import run_ace_pipeline
from backend.main import generate_agent_logs

def main():
    samples_dir = os.path.join(os.path.dirname(__file__), "samples")
    cache_dir = os.path.join(os.path.dirname(__file__), "cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    for name in ["ecommerce", "ridesharing", "banking"]:
        print(f"Caching analysis for sample: {name}")
        sample_path = os.path.join(samples_dir, f"{name}.json")
        if not os.path.exists(sample_path):
            print(f"Warning: sample file {sample_path} not found.")
            continue
            
        with open(sample_path, "r") as f:
            blueprint_dict = json.load(f)
            
        blueprint = SystemBlueprint.model_validate(blueprint_dict)
        report = run_ace_pipeline(blueprint)
        
        # FIX 4: Include the 'logs' field so the frontend receives complete cache data
        report_dict = report.model_dump()
        report_dict["logs"] = generate_agent_logs(blueprint, report_dict)
        
        cache_path = os.path.join(cache_dir, f"{name}.json")
        with open(cache_path, "w") as f:
            json.dump(report_dict, f, indent=2)
            
        print(f"Successfully cached report to {cache_path}")

if __name__ == "__main__":
    main()
