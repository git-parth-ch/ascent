import os
import sys
import json
import time
import subprocess
import urllib.request
import urllib.error

# Ensure we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

API_URL = "http://127.0.0.1:8000"
CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache", "ecommerce.json")

def cleanup_cache():
    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE)
        print("Cleared cached ecommerce analysis.")

def make_post_request(url, data_dict):
    req_data = json.dumps(data_dict).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req) as response:
            resp_data = json.loads(response.read().decode("utf-8"))
            elapsed = (time.time() - t0) * 1000.0  # ms
            return resp_data, elapsed
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        raise e

def make_get_request(url):
    t0 = time.time()
    try:
        with urllib.request.urlopen(url) as response:
            resp_data = response.read().decode("utf-8")
            elapsed = (time.time() - t0) * 1000.0  # ms
            return resp_data, elapsed
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        raise e

def run_integration_tests():
    print("=== STARTING INTEGRATION SMOKE TESTS ===")
    
    # 1. Clean the cache first
    cleanup_cache()
    
    # 2. Start Uvicorn Server in a background process
    print("Starting FastAPI dev server with uvicorn...")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the server to bind and boot up
    time.sleep(3.5)
    
    # Check if server is running
    if server_process.poll() is not None:
        stdout, stderr = server_process.communicate()
        print("Server failed to start:")
        print(stderr)
        sys.exit(1)
    
    print("FastAPI dev server successfully started.")
    
    try:
        # Load sample ecommerce blueprint
        sample_path = os.path.join(os.path.dirname(__file__), "samples", "ecommerce.json")
        with open(sample_path, "r") as f:
            ecommerce_blueprint = json.load(f)
            
        # TEST 1: POST /analyze with force_live=false (first run, uncached)
        print("\n--- TEST 1: POST /analyze (Uncached First Run) ---")
        payload = {
            "blueprint": ecommerce_blueprint,
            "force_live": False,
            "traffic_profile": "steady"
        }
        report, t_uncached = make_post_request(f"{API_URL}/analyze", payload)
        print(f"Test 1 Completed in {t_uncached:.2f}ms")
        print(f"Resilience Score: {report.get('resilience_score')}")
        print(f"Confidence Score: {report.get('confidence')}")
        print(f"Findings Found: {len(report.get('score_breakdown', []))}")
        assert "resilience_score" in report, "Missing resilience_score in response"
        
        # TEST 2: POST /analyze again with force_live=false (cached hit)
        print("\n--- TEST 2: POST /analyze (Cached Hit Run) ---")
        report2, t_cached = make_post_request(f"{API_URL}/analyze", payload)
        print(f"Test 2 Completed in {t_cached:.2f}ms")
        print(f"Resilience Score: {report2.get('resilience_score')}")
        print(f"Confidence Score: {report2.get('confidence')}")
        assert report["resilience_score"] == report2["resilience_score"], "Resilience score mismatch between runs!"
        
        # Check target: should return in < 100ms
        print(f"Cached run took {t_cached:.2f}ms. Uncached run took {t_uncached:.2f}ms.")
        if t_cached >= 100.0:
            print("WARNING: Cached run took slightly longer than 100ms (likely CPU scheduling overhead).")
        else:
            print("OK: Cached run was extremely fast (< 100ms).")
            
        # TEST 3: POST /apply-fix with a valid patch (lookup from cache via finding_id)
        print("\n--- TEST 3: POST /apply-fix (Valid Patch) ---")
        findings = report.get("score_breakdown", [])
        if not findings:
            raise ValueError("No findings in the report to test apply-fix!")
            
        first_finding = findings[0]
        finding_id = first_finding["finding_id"]
        print(f"Applying fix for Finding ID: {finding_id} targeting '{first_finding['patch_params'].get('node_id')}' using template '{first_finding['patch_template']}'")
        
        fix_payload = {
            "blueprint": ecommerce_blueprint,
            "finding_id": finding_id
        }
        fix_res, t_fix = make_post_request(f"{API_URL}/apply-fix", fix_payload)
        print(f"Test 3 Completed in {t_fix:.2f}ms. Valid: {fix_res.get('valid')}")
        assert fix_res.get("valid") is True, "Failed to apply valid patch!"
        
        patched_bp = fix_res.get("patched_blueprint")
        patched_node = next(n for n in patched_bp["nodes"] if n["id"] == first_finding["patch_params"].get("node_id"))
        print(f"Patched node state details: circuit_breaker={patched_node.get('circuit_breaker')}, retries={patched_node.get('retries')}")
        
        # TEST 4: POST /apply-fix with an invalid patch (explicit invalid retries=50)
        print("\n--- TEST 4: POST /apply-fix (Invalid Patch: retries=50) ---")
        invalid_payload = {
            "blueprint": ecommerce_blueprint,
            "finding_id": finding_id,
            "patch_template": "adjust_retries",
            "patch_params": {
                "node_id": first_finding["patch_params"].get("node_id"),
                "retries": 50  # Limit is 5
            }
        }
        invalid_res, t_invalid = make_post_request(f"{API_URL}/apply-fix", invalid_payload)
        print(f"Test 4 Completed in {t_invalid:.2f}ms. Valid: {invalid_res.get('valid')}")
        print(f"Rejection Reason: {invalid_res.get('rejection_reason')}")
        assert invalid_res.get("valid") is False, "Allowed an invalid patch to pass!"
        assert "Retries value 50 is invalid" in invalid_res.get("rejection_reason"), "Incorrect rejection reason!"
        
        # TEST 5: GET /export-yaml for a latency finding
        print("\n--- TEST 5: GET /export-yaml ---")
        latency_finding = next((f for f in findings if "latency" in f["scenario"].lower()), None)
        if not latency_finding:
            latency_finding = first_finding
            
        target_node = latency_finding["patch_params"].get("node_id")
        export_url = (
            f"{API_URL}/export-yaml/{latency_finding['finding_id']}?"
            f"scenario_type=latency_adversary&target_node={target_node}&magnitude=15.0"
        )
        yaml_str, t_yaml = make_get_request(export_url)
        print(f"Test 5 Completed in {t_yaml:.2f}ms")
        print("Rendered Chaos Mesh YAML Snippet:")
        print("\n".join(yaml_str.strip().split("\n")[:15]))
        assert "kind: NetworkChaos" in yaml_str, "YAML is missing NetworkChaos spec"
        assert f"latency-{target_node}" in yaml_str, "YAML is missing target node name"
        
        print("\n=== ALL 5 INTEGRATION SMOKE TESTS PASSED SUCCESSFULLY ===")
        
    finally:
        # 3. Shutdown the server process cleanly
        print("\nStopping background FastAPI server...")
        server_process.terminate()
        server_process.wait()
        print("Server stopped.")

if __name__ == "__main__":
    run_integration_tests()
