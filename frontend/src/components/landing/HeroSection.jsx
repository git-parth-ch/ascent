import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionBadge from '../shared/SectionBadge';

const LOG_LINES = [
  { icon: '✓', color: '#16A34A', label: 'Topology Agent', detail: '14 nodes scored' },
  { icon: '✓', color: '#16A34A', label: 'Orchestrator', detail: '3 scenarios planned' },
  { icon: '⟳', color: '#F2A65A', label: 'Latency Adversary', detail: 'Attacking payment-service...' },
];

function AnimatedLog() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LOG_LINES.length) return;
    const t = setTimeout(() => setVisibleLines(v => v + 1), 600);
    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <div
      className="rounded-xl2 p-6 w-full max-w-sm shadow-2xl border border-[#2A1F10]"
      style={{ background: '#1A1208', fontFamily: '"JetBrains Mono", monospace' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
        <span className="text-[10px] text-[#5C4A32] ml-2 uppercase tracking-widest">ascent agent log</span>
      </div>

      <div className="space-y-2.5 min-h-[80px]">
        {LOG_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="flex items-center gap-3 animate-log-line text-[13px]">
            <span style={{ color: line.color }} className="w-4 text-center shrink-0">{line.icon}</span>
            <span className="text-[#F2EDE4] font-semibold w-36 truncate">{line.label}</span>
            <span className="text-[#A89880] truncate">{line.detail}</span>
          </div>
        ))}
        {visibleLines < LOG_LINES.length && (
          <span className="inline-block w-2 h-4 bg-ascent-orange animate-blink" />
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[#2A1F10]">
        <p className="text-[10px] uppercase tracking-widest text-[#5C4A32] mb-1">Resilience Score</p>
        <p className="text-3xl font-bold" style={{ color: '#E8521A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          52 <span className="text-base text-[#5C4A32]">/ 100</span>
        </p>
        <p className="text-[11px] text-[#A89880] mt-1">Confidence: 78%</p>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-36 pb-20 px-6">
      {/* Orange blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '-100px', top: '-100px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, #E8521A 0%, #F2A65A 40%, transparent 70%)',
          opacity: 0.15,
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <SectionBadge>Autonomous Chaos Engineering</SectionBadge>

            <h1
              className="font-display font-extrabold text-ascent-dark leading-[1.05]"
              style={{ fontSize: 'clamp(48px, 6vw, 80px)' }}
            >
              The Resilience Engine for Every Architecture
            </h1>

            <p className="text-xl text-ascent-mid font-medium">
              Analyze • Simulate • Remediate
            </p>

            <p className="text-sm text-ascent-muted">
              3 agent scenarios &nbsp;•&nbsp; 9 anti-patterns detected &nbsp;•&nbsp; 100-tick simulation &nbsp;•&nbsp; 0 live infra needed
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="border border-ascent-dark text-ascent-dark rounded-full px-7 py-3 text-sm font-semibold hover:bg-ascent-dark hover:text-white transition-all"
              >
                Run Analysis →
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="bg-ascent-orange text-white rounded-full px-7 py-3 text-sm font-semibold shadow-cta hover:bg-[#C94115] hover:-translate-y-px transition-all"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Right: animated log card */}
          <div className="flex justify-center lg:justify-end">
            <AnimatedLog />
          </div>
        </div>
      </div>
    </section>
  );
}
