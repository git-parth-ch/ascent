import { CheckCircle2, X } from 'lucide-react';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const rows = [
  { capability: 'Pre-deployment analysis',     ascent: true,  monkey: false, gremlin: false, litmus: false },
  { capability: 'Autonomous test selection',    ascent: true,  monkey: false, gremlin: false, litmus: false },
  { capability: 'Retry storm modeling',         ascent: true,  monkey: false, gremlin: false, litmus: false },
  { capability: 'Resilience score formula',     ascent: true,  monkey: false, gremlin: false, litmus: false },
  { capability: 'No live infra required',       ascent: true,  monkey: false, gremlin: false, litmus: false },
  { capability: 'Chaos Mesh YAML export',       ascent: true,  monkey: false, gremlin: true,  litmus: true  },
  { capability: 'Runs in CI/CD pipeline',       ascent: true,  monkey: true,  gremlin: true,  litmus: true  },
];

function Cell({ value }) {
  if (value === true)  return <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
  return <span className="text-ascent-muted mx-auto block text-center">—</span>;
}

export default function WhyAscentSection() {
  return (
    <section className="bg-ascent-bg py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-14">
          <SectionBadge>Why Ascent</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">
            The only tool that reasons before it tests
          </h2>
          <p className="text-ascent-mid max-w-xl mx-auto text-sm">
            Competitors run experiments on live infra a human chose. Ascent autonomously decides what matters — pre-deployment.
          </p>
        </RevealWrapper>

        <RevealWrapper>
          <div className="rounded-xl2 border border-ascent-border overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ background: '#E8521A' }}>
                  <th className="text-left px-5 py-4 font-semibold">Capability</th>
                  <th className="text-center px-4 py-4 font-semibold">
                    Ascent
                    <span className="block text-[10px] font-mono mt-0.5 opacity-80">★ DESIGN-TIME</span>
                  </th>
                  <th className="text-center px-4 py-4 font-semibold">Chaos Monkey</th>
                  <th className="text-center px-4 py-4 font-semibold">Gremlin</th>
                  <th className="text-center px-4 py-4 font-semibold">LitmusChaos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.capability}
                    className="border-t border-ascent-border transition-colors"
                    style={{ background: i % 2 === 0 ? 'var(--color-card)' : 'var(--color-bg)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FDE68A22'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--color-card)' : 'var(--color-bg)'}
                  >
                    <td className="px-5 py-3.5 text-ascent-dark font-medium">{row.capability}</td>
                    <td className="px-4 py-3.5 text-center" style={{ background: 'rgba(232,82,26,0.04)' }}>
                      <Cell value={row.ascent} />
                    </td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.monkey} /></td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.gremlin} /></td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.litmus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
