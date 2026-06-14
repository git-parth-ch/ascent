# Ascent

Autonomous pre-deployment resilience analysis for distributed architectures, powered by an agent swarm.

---

## Setup Instructions

Follow these steps to configure and run the Ascent platform locally:

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (with `npm`)

### 2. Backend Installation & Start
From the project root:
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Installation & Start
From the `frontend` subdirectory:
```bash
# Navigate to frontend and install packages
cd frontend
npm install

# Start the Vite development server
npm run dev
```

### 4. Configuration (`.env`)
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Required for live LLM agent swarm analysis
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Groq fallback configuration
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Running with Docker Compose (Alternative)
To spin up both frontend and backend services in isolated Docker containers:
```bash
docker-compose up --build
```

---

## Resilience Score Formula

The overall system resilience score is calculated dynamically based on simulated chaos failures:

$$Resilience\ Score = \max\left(0, 100 - \sum_{f \in Findings} (\text{Impact}_{f} \times 1300)\right)$$

Where the impact of each finding $f$ is defined as:

$$\text{Impact} = \text{Severity} \times \text{Blast Radius} \times \text{Likelihood}$$

- **Severity**: The ratio of failed requests to total requests during the targeted perturbation tick range:
  $$\text{Severity} = \frac{\text{Requests Failed}}{\text{Total Requests}}$$
- **Blast Radius**: The ratio of degraded/unhealthy nodes to total graph nodes:
  $$\text{Blast Radius} = \frac{\text{Degraded Nodes Count}}{\text{Total Nodes}}$$
- **Likelihood**: Estimated probability of occurrence. It starts with a default baseline of $0.10$ and accumulates topological modifiers:
  - $+0.15$ if the node centrality is high ($> 0.4$)
  - $+0.25$ if the node does not have a circuit breaker configured
  - $+0.10$ for each synchronous downstream caller link
- **Deduplication Penalty**: If a lower-priority finding's list of affected nodes overlaps by more than $50\%$ with a higher-priority finding's affected nodes, its impact is multiplied by a penalty factor of $0.7$ to prevent double-counting.
- **Patch Discount**: If a node has been successfully patched (e.g., circuit breaker is enabled, retries are scaled down $\le 3$, or dead letter queue is active), the finding's impact is scaled down by a factor of $0.05$ (a $95\%$ reduction in impact).

---

## How Each Agent Works

- **Sanitizer Agent**: Receives raw system blueprints and sanitizes them by stripping out all freeform description fields, user labels, and human-readable names. By mapping only structural configurations and identifiers, the Sanitizer guarantees that no malicious user input can reach downstream LLMs, eliminating prompt injection risks.
- **Topology Agent**: Constructing a structural model of the architecture via NetworkX, this agent computes betweenness centrality, in/out degrees, self-loops, sync chain depths, and cycle vulnerabilities. It outputs topological priority scores to prioritize critical single points of failure.
- **Orchestrator Agent**: Acts as the swarm planner. It consumes the computed node priorities and outputs a sequential, adaptive test schedule targeting vulnerable nodes with tailored scenarios (e.g. latency spikes, retry storms, silent data corruptions).
- **Latency Adversary Agent**: Targets service nodes, determining appropriate latency multipliers, timeout limits, and error rates to inject into the simulator to test cascade propagation.
- **Retry Storm Agent**: Focuses on retry behavior in caller chains. It calculates upstream load amplification factors (e.g. $9\times$ load due to nested retries) and configures the load multiplier parameters for the discrete-event simulator.
- **Data Integrity Agent**: Simulates silent data corruption on databases and queues, establishing silent corruption rates and detection delays to model out-of-sync state cascades.
- **Cascade Analyzer Agent**: Compiles simulation execution data, applies impact deduplication and patch discounts, computes the overall resilience score, and queries the LLM/fallback to write clean summaries and remediation steps.

---

## Security Design

The Ascent platform is built with a defense-in-depth security architecture:

1. **Security Sanitizer**: Structural isolation ensures that freeform input strings are completely omitted before any payload reaches the LLM. Only pre-defined, typed attributes are mapped, making prompt injection structurally impossible.
2. **Patch Validator**: Every applied fix (JSON patch) is parsed against strict structural schemas. Changes like `retries` or `timeout_ms` are bounded (e.g. maximum of 5 retries, maximum 30,000ms timeout) to prevent DoS attacks or invalid configurations.
3. **YAML Templates**: Chaos Mesh manifest files are compiled using pre-defined Jinja2 templates. Variable interpolation is strictly escaped and validated, preventing template injection or shell execution vulnerabilities.
