import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, Shield } from 'lucide-react';

const productItems = [
  { icon: '🔬', title: 'Agent Swarm', desc: 'Six autonomous agents, one verdict' },
  { icon: '📊', title: 'Simulation Engine', desc: '100-tick deterministic simulation' },
  { icon: '🛡', title: 'Security Layer', desc: 'Prompt injection structurally impossible' },
  { icon: '📄', title: 'YAML Export', desc: 'Chaos Mesh ready manifests' },
];

const useCaseItems = [
  { icon: '🏗', title: 'Pre-Deployment Review', desc: 'Catch cascades before prod' },
  { icon: '🔄', title: 'CI/CD Integration', desc: 'Gate deployments on resilience score' },
  { icon: '📋', title: 'Architecture Audit', desc: 'Baseline your current system' },
];

const companyItems = [
  { icon: '👥', title: 'About Us', path: '/company' },
  { icon: '📬', title: 'Contact', path: '/company#contact' },
  { icon: '🏆', title: 'Hackathon', path: '/company#hackathon' },
];

function Dropdown({ items }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-2xl shadow-card border border-ascent-border py-2 z-50 animate-fade-in-up">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3 px-4 py-3 hover:bg-ascent-bg cursor-pointer transition-colors">
          <span className="text-lg leading-none mt-0.5">{item.icon}</span>
          <div>
            <p className="text-sm font-semibold text-ascent-dark">{item.title}</p>
            <p className="text-xs text-ascent-muted mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NavLink({ children, hasDropdown, dropdownItems, to }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onMouseLeave={() => hasDropdown && setOpen(false)}
    >
      <button
        onClick={() => { if (to) navigate(to); }}
        className="flex items-center gap-1 text-sm font-medium text-ascent-mid hover:text-ascent-dark transition-colors py-2 px-1"
      >
        {children}
        {hasDropdown && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      </button>
      {hasDropdown && open && <Dropdown items={dropdownItems} />}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-nav px-6 py-3 flex items-center justify-between border border-ascent-border">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-ascent-orange rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-ascent-dark tracking-tight font-display">Ascent</span>
        </button>

        {/* Center links — hidden on dashboard and mobile */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink hasDropdown dropdownItems={productItems} to="/product">Product</NavLink>
            <NavLink to="/how-it-works">How It Works</NavLink>
            <NavLink hasDropdown dropdownItems={useCaseItems} to="/use-cases">Use Cases</NavLink>
            <NavLink to="/resources">Resources</NavLink>
            <NavLink hasDropdown dropdownItems={companyItems} to="/company">Company</NavLink>
          </div>
        )}

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isDashboard && (
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-ascent-mid hover:text-ascent-dark transition-colors"
            >
              ← Home
            </button>
          )}
          <button
            onClick={() => navigate('/company#contact')}
            className="text-sm font-medium text-ascent-dark border border-ascent-dark rounded-full px-5 py-2 hover:bg-ascent-dark hover:text-white transition-all"
          >
            Book Demo
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-white bg-ascent-orange rounded-full px-5 py-2 shadow-cta hover:bg-[#C94115] hover:-translate-y-px transition-all"
          >
            Get Started →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-ascent-mid hover:text-ascent-dark"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden max-w-5xl mx-auto mt-2 bg-white rounded-2xl shadow-card border border-ascent-border p-4 space-y-1">
          {[
            { label: 'Product', path: '/product' },
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'Use Cases', path: '/use-cases' },
            { label: 'Resources', path: '/resources' },
            { label: 'Company', path: '/company' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-ascent-mid hover:bg-ascent-bg hover:text-ascent-dark rounded-xl transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-ascent-border flex flex-col gap-2">
            <button
              onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
              className="w-full text-sm font-semibold text-white bg-ascent-orange rounded-full px-5 py-2.5 shadow-cta hover:bg-[#C94115] transition-all"
            >
              Get Started →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
