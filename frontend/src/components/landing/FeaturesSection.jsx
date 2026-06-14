import { CheckCircle2 } from 'lucide-react';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const cards = [
  {
    borderColor: '#E8521A',
    labelColor: '#E8521A',
    label: 'ASCENT ANALYZE',
    title: 'Topology Intelligence',
    body: 'Surface anti-patterns and cascade risks before deployment. Every node scored, every edge weighted.',
    features: [
      '9 anti-pattern detectors',
      'Betweenness centrality scoring',
      'Synchronous chain depth analysis',
      'Shared state risk identification',
    ],
    checkColor: '#E8521A',
    linkColor: '#E8521A',
  },
  {
    borderColor: '#7C3AED',
    labelColor: '#7C3AED',
    label: 'ASCENT SIMULATE',
    title: 'Adversarial Simulation',
    body: 'Three adversary agents attack your topology autonomously — not based on a script you wrote.',
    features: [
      'Latency adversary scenarios',
      'Retry storm amplification model',
      'Silent data corruption injection',
      '4 traffic profiles (steady/burst/spike/diurnal)',
    ],
    checkColor: '#7C3AED',
    linkColor: '#7C3AED',
  },
  {
    borderColor: '#16A34A',
    labelColor: '#16A34A',
    label: 'ASCENT REMEDIATE',
    title: 'Validated Fix Loop',
    body: 'Apply a fix, re-run analysis, watch the score move. Score: 52 → Apply fix → Score: 79. That\'s the loop.',
    features: [
      'Deterministic resilience scoring',
      'LLM-generated remediation text',
      'Patch validator (safe bounds enforcement)',
      'Chaos Mesh YAML export',
    ],
    checkColor: '#16A34A',
    linkColor: '#16A34A',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-ascent-bg-alt py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-14">
          <SectionBadge>The Solution</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">One pipeline. Complete resilience.</h2>
        </RevealWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <RevealWrapper key={card.label} delay={i * 80}>
              <div
                className="bg-ascent-card rounded-xl2 p-6 shadow-card border border-ascent-border flex flex-col h-full hover:-translate-y-1 transition-transform duration-200"
                style={{ borderTopWidth: '4px', borderTopColor: card.borderColor }}
              >
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: card.labelColor }}>
                  {card.label}
                </p>
                <h3 className="text-xl font-display font-bold text-ascent-dark mb-2">{card.title}</h3>
                <p className="text-sm text-ascent-mid mb-4 leading-relaxed">{card.body}</p>

                <ul className="space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ascent-mid">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: card.checkColor }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button className="mt-5 text-sm font-semibold text-left hover:opacity-80 transition-opacity" style={{ color: card.linkColor }}>
                  Learn more →
                </button>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
