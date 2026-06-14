import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionBadge from '../components/shared/SectionBadge';
import RevealWrapper from '../components/shared/RevealWrapper';

const steps = [
  {
    num: '01',
    agent: 'Input Sanitizer',
    summary: 'Structurally blocks prompt injection',
    paras: [
      'Before any LLM sees your architecture, every freeform string is stripped. Node labels, edge descriptions, service names — all replaced with typed metadata.',
      'The sanitizer enforces a strict schema: only node_type, replicas, circuit_breaker, timeout_ms, and latency_ms pass through. Everything else is discarded.',
      'This isn\'t a filter — it\'s a structural barrier. There\'s no path for "ignore previous instructions" to reach a model.',
    ],
  },
  {
    num: '02',
    agent: 'Topology Agent',
    summary: 'Scores every node by centrality × criticality',
    paras: [
      'NetworkX builds your dependency graph from the sanitized blueprint. Then Brandes\' algorithm computes betweenness centrality for every node.',
      'Nine structural anti-patterns are checked: self-loops, synchronous chains, shared databases, missing circuit breakers, excessive fan-out, and more.',
      'Priority score = centrality × criticality. The node most likely to cause a cascade gets attacked first.',
    ],
  },
  {
    num: '03',
    agent: 'Orchestrator Agent',
    summary: 'Decides what to attack — autonomously',
    paras: [
      'The orchestrator doesn\'t run a fixed playbook. It reads the priority scores and decides which three scenarios to schedule.',
      'Gemini narrates the rationale — "payment-service has 0.91 centrality and no circuit breaker, making it the highest-risk target" — but the decision itself is deterministic code.',
      'Output: a ranked list of (target_node, scenario_type, magnitude) triples passed to the adversary agents.',
    ],
  },
  {
    num: '04',
    agent: 'Adversary Agents',
    summary: 'Three scenarios. Real blast radius.',
    paras: [
      'Latency Adversary: injects artificial delay on the target node. Upstream services pile up. Circuit breakers (if present) trip. Downstream nodes see timeouts.',
      'Retry Adversary: removes retry caps. Three upstream services each retry 3× = 27× the load on an already-failing node.',
      'Corruption Adversary: marks data as silently corrupt. Models the blast radius of bad writes propagating through read-downstream services.',
    ],
  },
  {
    num: '05',
    agent: 'Simulation Engine',
    summary: '100 ticks. No LLMs. Pure math.',
    paras: [
      'A discrete-event simulation runs for exactly 100 ticks. Each tick, failure propagates based on topology and the injected scenario.',
      'Node state at each tick is recorded: healthy → degraded → failed. The blast_radius is the fraction of nodes in a non-healthy state at peak impact.',
      'Deterministic by design — same blueprint, same scenario, same result every time. Auditable, reproducible, CI-safe.',
    ],
  },
  {
    num: '06',
    agent: 'Cascade Analyzer',
    summary: 'Score. Tree. Patch. Verify.',
    paras: [
      'Score = max(0, round(100 − Σ(severity × blast_radius × likelihood) × 1300)). Each term comes from simulation output, not LLM output.',
      'The cascade tree shows which node failed first and how failure propagated. The patch validator enforces safe bounds on every remediation.',
      'Export to Chaos Mesh YAML for running the same scenario on live infra when you\'re ready.',
    ],
  },
];

const likelihoodTable = [
  { rule: 'missing_circuit_breaker',  score: '0.90', desc: 'No circuit breaker on a high-centrality node' },
  { rule: 'sync_chain_depth',         score: '0.80', desc: 'Synchronous call chain longer than 3 hops' },
  { rule: 'shared_database',          score: '0.75', desc: 'Database shared by 3+ services' },
  { rule: 'excessive_fan_out',        score: '0.70', desc: 'Node calls 5+ downstream services' },
  { rule: 'no_dead_letter_queue',     score: '0.65', desc: 'Async queue without DLQ' },
  { rule: 'single_replica',          score: '0.60', desc: 'Critical service with 1 replica' },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <SectionBadge>How It Works</SectionBadge>
          <h1 className="text-5xl font-display font-extrabold text-ascent-dark leading-tight mt-3">
            Six agents. One verdict.
          </h1>
          <p className="text-lg text-ascent-mid">
            Every step is traceable. Every number is deterministic. Every explanation is LLM-generated but never LLM-decided.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">
          {steps.map((step, i) => (
            <RevealWrapper key={step.num} delay={0}>
              <div className="grid grid-cols-[80px_1fr] gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-ascent-border shadow-card flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-ascent-orange">{step.num}</span>
                  </div>
                  {i < steps.length - 1 && <div className="flex-1 w-px border-l-2 border-dashed border-ascent-border mt-4" />}
                </div>
                <div className="pt-3 pb-8 space-y-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-ascent-dark">{step.agent}</h2>
                    <p className="text-sm font-semibold text-ascent-orange mt-1">{step.summary}</p>
                  </div>
                  {step.paras.map((p, j) => (
                    <p key={j} className="text-ascent-mid leading-relaxed">{p}</p>
                  ))}
                  {i < steps.length - 1 && (
                    <p className="text-xs text-ascent-muted font-mono pt-2">
                      Next: {steps[i + 1].agent} →
                    </p>
                  )}
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* Formula Section */}
      <section className="bg-ascent-bg-alt py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-12">
            <SectionBadge>The Formula</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Resilience score — fully open</h2>
          </RevealWrapper>

          <RevealWrapper>
            <div className="bg-ascent-dark rounded-xl2 p-8 text-white font-mono mb-8">
              <p className="text-ascent-amber text-sm mb-2">// Resilience score formula</p>
              <p className="text-white text-base">
                score = max(0, round(100 − Σ(<span className="text-ascent-orange">severity</span> × <span className="text-ascent-amber">blast_radius</span> × <span className="text-[#FDE68A]">likelihood</span>) × 1300))
              </p>
              <div className="mt-4 space-y-1 text-xs text-[#A89880]">
                <p><span className="text-ascent-orange">severity</span>: fraction of requests failing at peak (0.0–1.0)</p>
                <p><span className="text-ascent-amber">blast_radius</span>: fraction of nodes in non-healthy state</p>
                <p><span className="text-[#FDE68A]">likelihood</span>: sum of matched anti-pattern scores (see table below)</p>
              </div>
            </div>
          </RevealWrapper>

          <RevealWrapper>
            <div className="bg-white rounded-xl2 border border-ascent-border shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ascent-bg-alt">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-mono font-bold text-ascent-muted uppercase tracking-wider">Anti-pattern Rule</th>
                    <th className="text-center px-5 py-3 text-xs font-mono font-bold text-ascent-muted uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-bold text-ascent-muted uppercase tracking-wider">Triggered when</th>
                  </tr>
                </thead>
                <tbody>
                  {likelihoodTable.map((row, i) => (
                    <tr key={row.rule} className="border-t border-ascent-border" style={{ background: i % 2 === 0 ? '#fff' : '#FAF7F2' }}>
                      <td className="px-5 py-3 font-mono text-xs text-ascent-dark">{row.rule}</td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-ascent-orange">{row.score}</td>
                      <td className="px-5 py-3 text-xs text-ascent-mid">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealWrapper>

          <RevealWrapper className="mt-10 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-ascent-orange text-white rounded-full px-8 py-3.5 font-semibold shadow-cta hover:bg-[#C94115] hover:-translate-y-px transition-all"
            >
              Run Analysis on Your Architecture →
            </button>
          </RevealWrapper>
        </div>
      </section>

      <Footer />
    </div>
  );
}
