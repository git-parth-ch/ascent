import { useNavigate } from 'react-router-dom';
import SectionBadge from '../shared/SectionBadge';
import bgImg from '../../assets/bg.png';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden pt-36 pb-20 px-6"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light overlay — low opacity so bg.png stays bright and visible */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--color-bg)', opacity: 0.52 }}
      />

      {/* Orange glow accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '-60px', top: '-80px',
          width: '480px', height: '480px',
          background: 'radial-gradient(circle, #E8521A 0%, #F2A65A 40%, transparent 70%)',
          opacity: 0.10,
          borderRadius: '50%',
          filter: 'blur(70px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── Left: text ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            <SectionBadge>Autonomous Chaos Engineering</SectionBadge>

            <h1
              className="font-display font-extrabold leading-[1.05]"
              style={{
                fontSize: 'clamp(38px, 5vw, 70px)',
                color: 'var(--color-dark)',
                textShadow: '0 1px 8px rgba(250,247,242,0.6)',
              }}
            >
              The Resilience Engine for Every Architecture
            </h1>

            <p className="text-xl font-semibold" style={{ color: 'var(--color-mid)' }}>
              Analyze &nbsp;•&nbsp; Simulate &nbsp;•&nbsp; Remediate
            </p>

            <p className="text-sm" style={{ color: 'var(--color-mid)' }}>
              3 agent scenarios &nbsp;·&nbsp; 9 anti-patterns detected &nbsp;·&nbsp; 100-tick simulation &nbsp;·&nbsp; 0 live infra needed
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full px-7 py-3 text-sm font-semibold transition-all font-body border"
                style={{ borderColor: 'var(--color-dark)', color: 'var(--color-dark)', backgroundColor: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-dark)'; e.currentTarget.style.color = 'var(--color-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-dark)'; }}
              >
                Run Analysis →
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="rounded-full px-7 py-3 text-sm font-semibold transition-all font-body text-white"
                style={{ backgroundColor: '#E8521A', boxShadow: '0 4px 20px rgba(232,82,26,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* ── Right: embedded hero video ──────────────────────────────── */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 8px 48px rgba(26,18,8,0.22), 0 2px 12px rgba(26,18,8,0.12)',
                border: '1px solid rgba(232,82,26,0.25)',
                aspectRatio: '16 / 9',
              }}
            >
              <iframe
                src="/hero-video.html?embed=1"
                title="Ascent Hero Demo"
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
                allow="autoplay"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
