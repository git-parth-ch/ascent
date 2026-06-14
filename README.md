<p align="center">
  <img src="frontend/src/assets/ascent-wordmark.svg" alt="Ascent" width="280" />
</p>

# Ascent

Autonomous pre-deployment resilience analysis for distributed architectures, powered by an agent swarm.

Ascent ingests a system blueprint (nodes, edges, protocols), runs a multi-agent chaos engineering pipeline, simulates adversarial scenarios via a discrete-event engine, and produces a quantified resilience score with actionable remediation patches — all before a single line of code is deployed to production.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [Agent Pipeline](#agent-pipeline)
- [Resilience Score Formula](#resilience-score-formula)
- [Confidence Score](#confidence-score)
- [Anti-Pattern Detection](#anti-pattern-detection)
- [Simulation Engine](#simulation-engine)
- [API Reference](#api-reference)
- [Security Design](#security-design)
- [Sample Architectures](#sample-architectures)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                     │
│  ResilienceGraph · ResilienceScore · CascadeTree · AgentLogs     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP (localhost:5173 → :8000)
┌──────────────────────────▼───────────────────────────────────────┐
│                     FastAPI Backend (Uvicorn)                     │
│                                                                  │
│  ┌────────────┐   ┌─────────────────────────────────────────┐    │
│  │  Security   │   │         LangGraph Pipeline              │    │
│  │  Sanitizer  │──▶│                                         │    │
│  └────────────┘   │  Topology → Orchestrator → Scenarios    │    │
│                    │       ↓              ↓                  │    │
│                    │  Latency    Retry    Data               │    │
│                    │  Adversary  Storm    Integrity           │    │
│                    │       ↓       ↓        ↓                │    │
│                    │     Discrete-Event Simulation Engine     │    │
│                    │              ↓                           │    │
│                    │     Cascade Analyzer (score + patches)   │    │
│                    └─────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐       │
│  │   Patch     │  │  Cache Layer │  │  YAML Export       │       │
│  │  Validator  │  │  (JSON disk) │  │  (Chaos Mesh)      │       │
│  └────────────┘  └──────────────┘  └────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- Node.js 18+ (with `npm`)

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
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://127.0.0.1:8000`.

### 4. Configuration (`.env`)

Create a `.env` file in the project root (see `.env.example`):

```env
# Required — Gemini 2.5 Flash for agent interactions
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Groq Llama 3.3 70B as secondary fallback
GROQ_API_KEY=your_groq_api_key_here
```

> **Note:** If neither key is set, all agents fall back to deterministic (non-LLM) logic automatically. The platform remains fully functional without API keys.

---

## Project Structure

```
ascent/
├── backend/
│   ├── agents/                  # LLM agent implementations
│   │   ├── base.py              # BaseAgent with Gemini → Groq → deterministic fallback chain
│   │   ├── topology.py          # Topology Agent — graph analysis & priority scoring
│   │   ├── orchestrator.py      # Orchestrator Agent — adaptive test plan generation
│   │   ├── latency_adversary.py # Latency Adversary Agent — latency spike scenarios
│   │   ├── retry_storm.py       # Retry Storm Agent — retry amplification scenarios
│   │   ├── data_integrity.py    # Data Integrity Agent — silent corruption scenarios
│   │   ├── cascade_analyzer.py  # Cascade Analyzer Agent — scoring & remediation
│   │   └── fallbacks.py         # Deterministic fallback implementations for all agents
│   ├── models/
│   │   ├── blueprint.py         # SystemBlueprint, Node, Edge Pydantic schemas
│   │   └── report.py            # TopologyResponse, CascadeAnalyzerResponse, BlueprintPatch, etc.
│   ├── pipeline/
│   │   └── langgraph_flow.py    # LangGraph state machine — full pipeline orchestration
│   ├── security/
│   │   ├── sanitizer.py         # Input sanitizer — strips freeform fields, computes anti-patterns
│   │   └── patch_validator.py   # Patch validator — bounds-checks all remediation parameters
│   ├── simulation/
│   │   ├── engine.py            # Discrete-event simulation engine (100-tick runs)
│   │   ├── circuit_breaker.py   # Circuit breaker state machine (closed/open/half-open)
│   │   ├── perturbation.py      # Perturbation types: LATENCY, FAILURE, CORRUPTION
│   │   └── traffic_profiles.py  # Traffic generators: steady, burst, spike, diurnal
│   ├── export/
│   │   ├── yaml_renderer.py     # Jinja2 → Chaos Mesh YAML renderer
│   │   └── templates/           # Chaos Mesh YAML Jinja2 templates
│   ├── samples/                 # Pre-built architecture blueprints (ecommerce, ridesharing, banking)
│   ├── cache/                   # Cached analysis results (JSON, auto-generated)
│   ├── main.py                  # FastAPI application — all API routes
│   └── requirements.txt         # Python dependencies
├── frontend/
│   └── src/
│       ├── App.jsx              # Main application shell
│       ├── index.css            # Global stylesheet
│       └── components/
│           ├── ResilienceGraph.jsx   # Interactive architecture graph (React Flow)
│           ├── ResilienceScore.jsx   # Animated resilience score gauge
│           ├── CascadeTree.jsx      # Cascade failure event viewer
│           ├── AgentLogsPanel.jsx    # Agent execution log feed
│           ├── CustomNode.jsx       # Custom graph node renderer
│           └── CustomEdge.jsx       # Custom graph edge renderer
├── .env.example                 # Template for environment variables
├── .gitignore                   # Comprehensive ignore policy
└── README.md
```

---

## Agent Pipeline

The pipeline is orchestrated as a **LangGraph state machine** with conditional branching. Each agent follows a 4-tier execution strategy:

```
Gemini 2.5 Flash → Gemini Retry → Groq Llama 3.3 70B → Deterministic Fallback
```

### Pipeline Stages

| Stage | Agent | Input | Output |
|-------|-------|-------|--------|
| 1 | **Security Sanitizer** | Raw `SystemBlueprint` | Sanitized metadata dict (no freeform text) |
| 2 | **Topology Agent** | `SystemBlueprint` | `TopologyResponse` — annotated nodes with centrality, priority scores, anti-patterns |
| 3 | **Orchestrator Agent** | `TopologyResponse` + `SystemBlueprint` | `OrchestratorResponse` — adaptive test plan (up to 4 scenarios) |
| 4 | **Scenario Agents** | Target node + `SystemBlueprint` | Perturbation parameters fed into the simulation engine |
| 4a | — Latency Adversary | | Latency multiplier, error rate override, tick range |
| 4b | — Retry Storm | | Upstream retrier list, amplification factor, load multiplier |
| 4c | — Data Integrity | | Corruption rate, detection delay, silent failure flag |
| 5 | **Simulation Engine** | Blueprint + perturbations | Per-tick request logs, failure counts, cascade trees |
| 5* | **Compound Simulation** | *(conditional)* If cascade impact < 20%, combines latency + retry on highest-priority node |
| 6 | **Cascade Analyzer** | Simulation logs + Blueprint | `CascadeAnalyzerResponse` — resilience score, findings, patches |
| 7 | **Patch Validator** | Findings patches | Validates bounds on retries, timeout, circuit_breaker, error_rate |

### Orchestrator Node Selection

The Orchestrator selects up to 4 target nodes where `priority_score > 0.02`, then assigns scenario types by rule:

| Condition | Assigned Scenario |
|-----------|-------------------|
| Node type is `database` or `queue` AND `in_degree > 1` | `data_integrity` |
| Upstream cumulative retries > 2 | `retry_storm` |
| Otherwise | `latency_adversary` |

---

## Resilience Score Formula

The overall system resilience score is calculated deterministically from simulation results:

$$\text{Resilience Score} = \max\left(0,\ \text{round}\left(100 - \sum_{f \in \text{Findings}} \text{Impact}_f \times 1300\right)\right)$$

Where the **impact** of each finding is:

$$\text{Impact}_f = \text{Severity}_f \times \text{Blast Radius}_f \times \text{Likelihood}_f$$

### Severity

The ratio of failed requests to total requests during the simulation:

$$\text{Severity} = \frac{\text{Requests Failed}}{\text{Total Requests}}$$

### Blast Radius

The ratio of degraded/affected nodes to total graph nodes:

$$\text{Blast Radius} = \frac{|\text{Affected Nodes}|}{\text{Total Nodes}}$$

### Likelihood

Accumulated from topological risk modifiers. Starts at `0.0` and adds:

| Condition | Modifier |
|-----------|----------|
| `retries == 0` | +0.25 |
| `circuit_breaker == false` | +0.25 |
| Betweenness centrality > 0.5 | +0.20 |
| Sync chain depth > 3 hops | +0.15 |
| Database node with `in_degree > 2` | +0.10 |
| Queue node with `has_dlq == false` | +0.05 |

If no modifiers apply, a default baseline of `0.10` is used. Likelihood is capped at `1.0`.

### Deduplication Penalty

Findings are sorted by initial impact (descending). If a lower-priority finding's affected node set overlaps by more than **50%** with any higher-priority finding, its impact is multiplied by **0.7** to prevent double-counting.

### Patch Discount

If the target node already has the recommended fix applied (e.g., circuit breaker enabled, retries ≤ 3, or DLQ active), the finding's impact is reduced by a factor of **0.05** (a 95% reduction).

---

## Confidence Score

The confidence level reflects how trustworthy the analysis is:

$$\text{Confidence} = \max\left(0,\ 100 - 15F - 10S - 5T - 5P\right)$$

| Variable | Condition | Penalty |
|----------|-----------|---------|
| F | Any agent used a fallback (LLM unavailable) | −15 |
| S | Fewer than 3 scenarios were simulated | −10 |
| T | Simulation tick limit was hit | −5 |
| P | Traffic profile is `steady` (less stressful) | −5 |

---

## Anti-Pattern Detection

The Security Sanitizer detects **9 structural anti-patterns** per node:

| Anti-Pattern | Detection Rule |
|-------------|---------------|
| `self_loop` | Node has an edge to itself |
| `dependency_cycle` | Node participates in a graph cycle |
| `unprotected_sync_call` | Has sync outgoing edges, but `circuit_breaker == false` AND `retries == 0` |
| `single_point_of_failure` | Centrality > 0.4 AND `replicas <= 1` |
| `missing_circuit_breaker` | `circuit_breaker == false` AND centrality > 0.4 |
| `long_sync_chain` | Longest downstream sync-only path > 3 hops |
| `shared_state_risk` | Type is `database` or `queue` AND `in_degree > 2` |
| `fan_out_explosion` | `out_degree > 5` |
| `queue_without_dlq` | Type is `queue` AND `has_dlq == false` |

---

## Simulation Engine

The discrete-event simulation engine runs **100-tick** simulations per scenario:

- **Traffic Profiles**: `steady` (100 req/tick), `burst` (300 req spike at tick 30–40), `spike` (400 req at tick 35), `diurnal` (sinusoidal)
- **Circuit Breakers**: Full state machine — Closed → Open (after failure threshold) → Half-Open (after cooldown) → Closed/Open
- **Perturbation Types**: `LATENCY` (multiplied response time), `FAILURE` (injected error rate), `CORRUPTION` (silent data corruption)
- **Cascade Propagation**: Failures propagate along synchronous edges; circuit breakers can isolate failures
- **Reproducibility**: Traffic generation uses seeded RNG for deterministic replay

Each simulation outputs:
- Total requests, successful, failed, timed out
- Failure percentage and cascade tree (causal chain of node failures)
- Per-tick node health snapshots

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/samples` | List available sample architectures (name, node count, weakness count) |
| `GET` | `/samples/{name}` | Retrieve full blueprint JSON for a sample |
| `POST` | `/analyze` | Run the full agent pipeline (or return cached result if `force_live=false`) |
| `POST` | `/apply-fix` | Validate and apply a remediation patch to a blueprint node |
| `GET` | `/export-yaml/{finding_id}` | Export a Chaos Mesh YAML manifest for a given scenario |

### `POST /analyze`

```json
{
  "blueprint": { "system_name": "ecommerce", "nodes": [...], "edges": [...], ... },
  "force_live": false,
  "traffic_profile": "steady"
}
```

Returns a `CascadeAnalyzerResponse` with `resilience_score`, `confidence`, `score_breakdown` (findings), and `overall_summary`.

### `POST /apply-fix`

```json
{
  "blueprint": { ... },
  "finding_id": "F1",
  "patch_params": { "node_id": "payment-service", "circuit_breaker": true }
}
```

Returns `{ "valid": true, "patched_blueprint": { ... } }` or `{ "valid": false, "rejection_reason": "..." }`.

---

## Security Design

The platform implements **defense-in-depth** across three layers:

### 1. Security Sanitizer (Prompt Injection Prevention)

The sanitizer structurally isolates all freeform text before any payload reaches an LLM. It strips `label`, `system_name`, descriptions, and human-readable names — mapping only typed, structural attributes (`node_id`, `type`, `centrality`, `retries`, `circuit_breaker`, etc.). This makes prompt injection **structurally impossible**, not just filtered.

### 2. Patch Validator (Input Bounds Enforcement)

Every remediation patch is validated against strict constraints before application:

| Field | Constraint |
|-------|-----------|
| `retries` | Integer, 0–5 |
| `timeout_ms` | ≤ `nominal_latency_ms × 10` AND ≤ 30,000 ms |
| `circuit_breaker` | Boolean only |
| `replicas` | Integer, 1–10 |
| `error_rate` | Float, 0.0–1.0 |
| `baseline_failure_probability` | Float, 0.0–1.0 |

### 3. YAML Export (Template Injection Prevention)

Chaos Mesh manifests are rendered via pre-defined Jinja2 templates. Variable interpolation is strictly typed and escaped — no user-supplied strings reach the template engine.

---

## Sample Architectures

Three pre-built architectures are included for demonstration:

| Architecture | Nodes | Key Weaknesses |
|-------------|-------|-----------------|
| **E-Commerce** | 14 | Payment path has no circuit breakers; `orders-db` shared by 3+ services; `notification-queue` missing DLQ |
| **Ridesharing** | 12 | Long sync chains (4+ hops) through matching/dispatch; `location-db` shared state; driver notification fan-out |
| **Banking** | 16 | Transaction path with high retry amplification (64×); `transaction-db` shared by 3+ services; deep sync chains |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Agent Orchestration** | LangGraph (state machine) |
| **LLM Providers** | Gemini 2.5 Flash (primary), Groq Llama 3.3 70B (secondary) |
| **Graph Analysis** | NetworkX (centrality, cycles, DFS) |
| **Data Validation** | Pydantic v2 |
| **Simulation** | Custom discrete-event engine (Python) |
| **YAML Export** | Jinja2 templates (Chaos Mesh format) |
| **Frontend** | React 18, Vite, React Flow, Lucide Icons |
| **Environment** | python-dotenv, `.env` file |
