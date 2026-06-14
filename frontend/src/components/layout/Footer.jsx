import { useNavigate } from 'react-router-dom';
import lockupDark from '../../assets/ascent-lockup-dark.svg';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'How It Works',      path: '/how-it-works' },
      { label: 'Agent Swarm',       path: '/product' },
      { label: 'Simulation Engine', path: '/product' },
      { label: 'YAML Export',       path: '/product' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'GitHub',               path: '/resources' },
      { label: 'README',               path: '/resources' },
      { label: 'API Docs',             path: '/resources' },
      { label: 'Sample Architectures', path: '/resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',     path: '/company' },
      { label: 'Contact',   path: '/company#contact' },
      { label: 'Hackathon', path: '/company#hackathon' },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer style={{ backgroundColor: '#0F0B08', color: '#EDE7DD' }} className="border-t border-[#2A2218]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-5">
            <img src={lockupDark} alt="Ascent" className="h-14 w-auto" />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#9A9284' }}>
              Autonomous System Chaos &amp; Resilience Engineering Tool
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-all"
              style={{ backgroundColor: '#E8521A', boxShadow: '0 4px 24px rgba(232,82,26,0.30)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}
            >
              Get Started →
            </button>
            <p className="text-xs pt-1" style={{ color: '#5C5249' }}>
              Built for the Agentic &amp; Autonomous Systems track
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#5C5249' }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: '#9A9284' }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#2A2218' }}>
          <p className="text-xs" style={{ color: '#5C5249' }}>© 2025 Ascent. All rights reserved.</p>
          <p className="text-xs" style={{ color: '#5C5249' }}>Built for the Agentic &amp; Autonomous Systems track</p>
        </div>
      </div>
    </footer>
  );
}
