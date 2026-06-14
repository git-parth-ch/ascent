import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'How It Works', path: '/how-it-works' },
      { label: 'Agent Swarm', path: '/product' },
      { label: 'Simulation Engine', path: '/product' },
      { label: 'YAML Export', path: '/product' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'GitHub', path: '/resources' },
      { label: 'README', path: '/resources' },
      { label: 'API Docs', path: '/resources' },
      { label: 'Sample Architectures', path: '/resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', path: '/company' },
      { label: 'Contact', path: '/company#contact' },
      { label: 'Hackathon', path: '/company#hackathon' },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-ascent-dark text-white border-t border-[#2A1F10]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-ascent-orange rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight font-display">Ascent</span>
            </div>
            <p className="text-sm text-[#A89880] leading-relaxed max-w-xs">
              Autonomous System Chaos &amp; Resilience Engineering Tool
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-ascent-orange rounded-full px-6 py-2.5 shadow-cta hover:bg-[#C94115] transition-all"
            >
              Get Started →
            </button>
            <p className="text-xs text-[#5C4A32] pt-1">
              Built for the Agentic &amp; Autonomous Systems track
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#5C4A32] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-sm text-[#A89880] hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#2A1F10] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5C4A32]">© 2025 Ascent. All rights reserved.</p>
          <p className="text-xs text-[#5C4A32]">Built for the Agentic &amp; Autonomous Systems track</p>
        </div>
      </div>
    </footer>
  );
}
