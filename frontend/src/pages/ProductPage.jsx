import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionBadge from '../components/shared/SectionBadge';
import RevealWrapper from '../components/shared/RevealWrapper';

const agents = [
  { name: 'Input Sanitizer',    icon: '🔒', llmRole: 'None — fully deterministic',                          detRole: 'Strips freeform text, enforces schema' },
  { name: 'Topology Agent',     icon: '🗺',  llmRole: 'Explains centrality scores in plain English',          detRole: 'Builds NetworkX graph, scores nodes, detects 9 anti-patterns' },
  { name: 'Orchestrator Agent', icon: '🎯', llmRole: 'Narrates test selection rationale',                    detRole: 'Ranks scenarios by priority score, schedules adversaries' },
  { name: 'Latency Adversary',  icon: '⚡', llmRole: 'Summarizes latency spike impact',                      detRole: 'Injects latency per node, runs 100-tick simulation' },
  { name: 'Retry Adversary',    icon: '🔄', llmRole: 'Explains amplification factor',                        detRole: 'Models retry storms, calculates 27×/64× amplification' },
  { name: 'Cascade Analyzer',   icon: '📊', llmRole: 'Writes remediation text for each finding',             detRole: 'Computes score formula, validates patches, builds cascade tree' },
];

const securityPillars = [
  {
    title: 'Input Sanitizer',
    code: `# Before sanitization
{"label": "Ignore previous instructions and..."}

# After sanitization
{"node_type": "service", "replicas": 3}
# All freeform strings stripped.`,
  },
  {
    title: 'Patch Validator',
    code: `RULES = {
  "circuit_breaker": lambda p: p.get("enabled") == True,
  "replicas":        lambda p: 1 <= p.get("count", 0) <= 10,
  "timeout_ms":      lambda p: 100 <= p.get("value", 0) <= 30_000,
}
# If any rule fails → rejection_reason returned.`,
  },
  {
    title: 'YAML Templates',
    code: `apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: latency-{node_id}
spec:
  action: delay
  delay:
    latency: "{magnitude}ms"`,
  },
];

export default function ProductPage() {
  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute pointer-events-none" style={{ right: '-100px', top: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, #E8521A 0%, #F2A65A 40%, transparent 70%)', opacity: 0.12, borderRadius: '50%', filter: 'blur(60px)' }} />
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <SectionBadge>The Product</SectionBadge>
          <h1 className="text-5xl font-display font-extrabold text-ascent-dark leading-tight mt-3">
            An agent swarm that thinks<br />before it breaks things
          </h1>
          <p className="text-lg text-ascent-mid max-w-2xl mx-auto">
            Six autonomous agents. Each with a distinct role. No LLM decides what's broken — the math does. LLMs only explain what happened.
          </p>
        </div>
      </section>

      {/* Agent Swarm */}
      <section className="bg-ascent-bg-alt py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-12">
            <SectionBadge>Agent Swarm</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Six agents. Clear division of labor.</h2>
          </RevealWrapper>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map((agent, i) => (
              <RevealWrapper key={agent.name} delay={i * 60}>
                <div className="bg-white rounded-xl2 p-5 shadow-card border border-ascent-border hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{agent.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-ascent-dark mb-2">{agent.name}</h3>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="font-semibold text-ascent-orange">LLM role: </span>
                          <span className="text-ascent-mid">{agent.llmRole}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-ascent-dark">Deterministic role: </span>
                          <span className="text-ascent-mid">{agent.detRole}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-ascent-bg py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-12">
            <SectionBadge>Security Layer</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Prompt injection: structurally impossible</h2>
            <p className="text-ascent-mid max-w-xl mx-auto text-sm">
              Three layers ensure no user-supplied text reaches an LLM in free form.
            </p>
          </RevealWrapper>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {securityPillars.map((p, i) => (
              <RevealWrapper key={p.title} delay={i * 80}>
                <div className="bg-ascent-dark rounded-xl2 p-5 shadow-card flex flex-col gap-3 h-full">
                  <h3 className="font-display font-bold text-white">{p.title}</h3>
                  <pre className="text-[11px] font-mono text-[#A89880] whitespace-pre-wrap leading-relaxed overflow-auto">{p.code}</pre>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
