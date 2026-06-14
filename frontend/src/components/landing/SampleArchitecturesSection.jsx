import { useNavigate } from 'react-router-dom';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const architectures = [
  {
    name: 'E-Commerce',
    sample: 'ecommerce',
    nodes: 14,
    score: 57,
    desc: 'Payment path has no circuit breakers. Orders-DB shared by 3 services.',
    badges: ['Missing CB', 'Shared DB', 'No DLQ'],
    topColor: '#E8521A',
  },
  {
    name: 'Ride-Sharing',
    sample: 'ridesharing',
    nodes: 12,
    score: 48,
    desc: '4-hop synchronous chain. Location-DB fan-out. Retry amplification.',
    badges: ['4-hop Sync', 'Fan-out', 'No Retry Cap'],
    topColor: '#DC2626',
  },
  {
    name: 'Banking',
    sample: 'banking',
    nodes: 16,
    score: 42,
    desc: '64× retry amplification. Transaction-DB shared by 4 services.',
    badges: ['64× Retry Amp', 'Shared TxDB', 'SPOF Risk'],
    topColor: '#7C3AED',
  },
];

function scoreColor(s) {
  if (s >= 75) return '#16A34A';
  if (s >= 50) return '#F59E0B';
  return '#DC2626';
}

export default function SampleArchitecturesSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-ascent-bg-alt py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-14">
          <SectionBadge>Try It Now</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">
            Three pre-built architectures. Three sets of real weaknesses.
          </h2>
        </RevealWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {architectures.map((arch, i) => (
            <RevealWrapper key={arch.name} delay={i * 80}>
              <div
                className="bg-white rounded-xl2 shadow-card border border-ascent-border flex flex-col h-full hover:-translate-y-1 transition-transform duration-200 overflow-hidden"
              >
                <div className="h-1" style={{ background: arch.topColor }} />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-display font-bold text-ascent-dark">{arch.name}</h3>
                    <span className="text-xs font-mono text-ascent-muted bg-ascent-bg border border-ascent-border px-2 py-0.5 rounded-full">
                      {arch.nodes} nodes
                    </span>
                  </div>

                  <p className="text-sm text-ascent-mid mb-4 leading-relaxed flex-1">{arch.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {arch.badges.map(b => (
                      <span key={b} className="text-[10px] font-mono border border-ascent-border text-ascent-mid px-2 py-0.5 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-ascent-border">
                    <div>
                      <span className="text-2xl font-display font-bold" style={{ color: scoreColor(arch.score) }}>
                        {arch.score}
                      </span>
                      <span className="text-xs text-ascent-muted"> / 100</span>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard', { state: { sample: arch.sample } })}
                      className="text-sm font-semibold text-white bg-ascent-orange rounded-full px-5 py-2 shadow-cta hover:bg-[#C94115] hover:-translate-y-px transition-all"
                    >
                      Analyze Now →
                    </button>
                  </div>
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
