import { Zap, RefreshCw, Bug } from 'lucide-react';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const steps = [
  {
    num: '01',
    title: 'Input Sanitizer',
    body: 'Strips all freeform text before any LLM sees your architecture. Prompt injection: structurally impossible.',
    visual: (
      <div className="font-mono text-xs space-y-1.5 p-4 bg-ascent-bg-alt rounded-xl border border-ascent-border">
        <p className="text-ascent-muted line-through">label: "Ignore previous instructions and..."</p>
        <p className="text-ascent-orange">→ stripped to metadata only</p>
        <p className="text-ascent-mid">node_type: service, replicas: 3</p>
      </div>
    ),
  },
  {
    num: '02',
    title: 'Topology Agent',
    body: 'Builds your dependency graph. Detects 9 structural anti-patterns. Scores every node by centrality × criticality.',
    visual: (
      <div className="p-4 bg-ascent-bg rounded-xl border border-ascent-border space-y-2">
        {['payment-service', 'orders-db', 'checkout'].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-ascent-orange" style={{ opacity: 1 - i * 0.25 }} />
            <span className="text-xs font-mono text-ascent-dark">{n}</span>
            <div className="ml-auto text-[10px] text-ascent-muted">priority {(0.95 - i * 0.15).toFixed(2)}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '03',
    title: 'Orchestrator Agent',
    body: 'Decides what to attack and why. Not a fixed script — an autonomous decision based on your specific topology.',
    visual: (
      <div className="p-4 bg-ascent-bg rounded-xl border border-ascent-border space-y-1.5">
        {['Latency spike on payment-service', 'Retry storm via checkout', 'Data corruption on orders-db'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-xs font-mono">
            <span className="text-ascent-orange font-bold">#{i + 1}</span>
            <span className="text-ascent-mid">{s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '04',
    title: 'Adversary Agents',
    body: 'Latency spikes. Retry storms. Silent data corruption. Each scenario designed to find your real blast radius.',
    visual: (
      <div className="flex gap-2">
        {[{ label: 'Latency', Icon: Zap }, { label: 'Retry', Icon: RefreshCw }, { label: 'Corruption', Icon: Bug }].map(({ label, Icon }) => (
          <div key={label} className="flex-1 text-center p-3 bg-ascent-bg-alt rounded-xl border border-ascent-border">
            <Icon className="w-4 h-4 mx-auto mb-1 text-ascent-orange" />
            <p className="text-[10px] font-mono text-ascent-mid">{label}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '05',
    title: 'Simulation Engine',
    body: '100-tick discrete-event simulation. Deterministic. Auditable. No LLMs involved in the math.',
    visual: (
      <div className="p-4 bg-ascent-bg rounded-xl border border-ascent-border">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 h-6 rounded-sm" style={{ background: i < 14 ? '#E8521A' : '#E8DDD0', opacity: i < 14 ? 0.4 + (i / 20) * 0.6 : 1 }} />
          ))}
        </div>
        <p className="text-[10px] font-mono text-ascent-muted">Tick 0 → 100 &nbsp;|&nbsp; failure at T=14</p>
      </div>
    ),
  },
  {
    num: '06',
    title: 'Cascade Analyzer',
    body: 'Resilience score. Confidence score. Cascade tree. Remediation patches. Export to Chaos Mesh YAML.',
    visual: (
      <div className="p-4 bg-ascent-bg rounded-xl border border-ascent-border flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-display font-bold text-ascent-orange">52</p>
          <p className="text-[10px] font-mono text-ascent-muted">/ 100</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {['Severity', 'Blast Radius', 'Likelihood'].map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[10px] text-ascent-muted w-20">{k}</span>
              <div className="flex-1 h-1.5 bg-ascent-border rounded-full overflow-hidden">
                <div className="h-full bg-ascent-orange rounded-full" style={{ width: `${Math.random() * 60 + 30}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-ascent-bg py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-16">
          <SectionBadge>How It Works</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">Six agents. One verdict.</h2>
        </RevealWrapper>

        <div className="relative">
          {/* Vertical dashed connector */}
          <div className="absolute left-[28px] top-8 bottom-8 w-px border-l-2 border-dashed border-ascent-border hidden md:block" />

          <div className="space-y-10">
            {steps.map((step, i) => (
              <RevealWrapper key={step.num} delay={i * 60}>
                <div className="grid grid-cols-1 md:grid-cols-[56px_1fr_1fr] gap-6 items-start">
                  {/* Step dot + number */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full bg-ascent-card border-2 border-ascent-border shadow-card flex items-center justify-center z-10 relative">
                      <span className="text-xs font-mono font-bold text-ascent-orange">{step.num}</span>
                    </div>
                  </div>
                  {/* Text */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xl font-display font-bold text-ascent-dark">{step.title}</h3>
                    <p className="text-sm text-ascent-mid leading-relaxed">{step.body}</p>
                  </div>
                  {/* Visual */}
                  <div className="pt-2">{step.visual}</div>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
