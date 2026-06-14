import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionBadge from '../components/shared/SectionBadge';
import RevealWrapper from '../components/shared/RevealWrapper';

const cases = [
  {
    icon: '🏗',
    title: 'Pre-Deployment Review',
    desc: 'Run Ascent against your architecture-as-code before every deploy. Catch the payment-service circuit breaker gap before it takes down 64% of checkout requests.',
    detail: 'A latency spike on payment-service with no circuit breaker takes down 64% of checkout requests. Ascent finds this in 90 seconds.',
    tags: ['Pre-deployment', 'No live infra', 'Architecture-as-code'],
  },
  {
    icon: '🔄',
    title: 'CI/CD Integration',
    desc: 'POST your blueprint to /analyze in your pipeline. If resilience_score < 60, fail the build. No infra access needed — just a JSON file.',
    detail: 'POST /analyze → resilience_score: 42 → pipeline fails. Fix circuit breakers → score: 79 → pipeline passes.',
    tags: ['CI/CD gate', 'REST API', 'Score threshold'],
  },
  {
    icon: '📋',
    title: 'Architecture Audit',
    desc: 'Baseline your current system. Get a full cascade map, a prioritized finding list, and Chaos Mesh YAML ready for your chaos engineering team.',
    detail: '9 anti-patterns checked. Retry amplification modeled. Findings exported to Chaos Mesh YAML for your next game day.',
    tags: ['Baseline audit', 'YAML export', 'Chaos game day prep'],
  },
  {
    icon: '🔁',
    title: 'Fix Verification',
    desc: 'Applied a circuit breaker? Add a replica? Re-run analysis on the patched blueprint and see the score move. Score: 52. Apply fix. Score: 79. That\'s the loop.',
    detail: 'The patch validator checks safe bounds. The re-analysis runs in under 2 seconds. You see the delta before it goes to prod.',
    tags: ['Patch validation', 'Score delta', 'Before/after'],
  },
  {
    icon: '🏢',
    title: 'Platform Engineering Baseline',
    desc: 'Run Ascent across all your service blueprints. Rank by resilience score. Prioritize hardening work on the most fragile systems first.',
    detail: 'Banking: 42/100. E-commerce: 57/100. Ridesharing: 48/100. Work backwards from the worst score.',
    tags: ['Multi-system', 'Prioritization', 'Portfolio view'],
  },
  {
    icon: '📚',
    title: 'Training & Education',
    desc: 'Use the pre-built architectures to teach engineers what cascades look like. Show how a single missing circuit breaker becomes a 64× amplification event.',
    detail: 'Three architectures. Nine anti-patterns. Detailed cascade trees. A full simulation you can scrub tick by tick.',
    tags: ['Education', 'Visualization', 'Tick-by-tick replay'],
  },
];

export default function UseCasesPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <SectionBadge>Use Cases</SectionBadge>
          <h1 className="text-5xl font-display font-extrabold text-ascent-dark leading-tight mt-3">
            Where Ascent fits in your workflow
          </h1>
          <p className="text-lg text-ascent-mid">
            Pre-deployment, in CI/CD, or as a standing baseline — Ascent runs on blueprints, not live infra.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <RevealWrapper key={c.title} delay={i * 60}>
              <div className="bg-white rounded-xl2 p-6 shadow-card border border-ascent-border h-full flex flex-col hover:-translate-y-1 transition-transform duration-200">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="text-xl font-display font-bold text-ascent-dark mb-2">{c.title}</h3>
                <p className="text-sm text-ascent-mid leading-relaxed mb-3">{c.desc}</p>
                <p className="text-xs font-mono text-ascent-orange bg-ascent-bg border border-ascent-border rounded-lg px-3 py-2 mb-4 leading-relaxed">
                  {c.detail}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {c.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono border border-ascent-border text-ascent-muted px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>

        <RevealWrapper className="mt-12 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-ascent-orange text-white rounded-full px-8 py-3.5 font-semibold shadow-cta hover:bg-[#C94115] hover:-translate-y-px transition-all"
          >
            Try It Now →
          </button>
        </RevealWrapper>
      </section>

      <Footer />
    </div>
  );
}
