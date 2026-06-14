import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, Sun, Moon, Microscope, BarChart2, Shield, FileText, Building2, RefreshCw, ClipboardList, Users, Mail, Trophy } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import lockupLight from '../../assets/ascent-lockup-light.svg';
import lockupDark  from '../../assets/ascent-lockup-dark.svg';

const productItems = [
  { icon: Microscope,  title: 'Agent Swarm',      desc: 'Six autonomous agents, one verdict' },
  { icon: BarChart2,   title: 'Simulation Engine', desc: '100-tick deterministic simulation' },
  { icon: Shield,      title: 'Security Layer',    desc: 'Prompt injection structurally impossible' },
  { icon: FileText,    title: 'YAML Export',       desc: 'Chaos Mesh ready manifests' },
];
const useCaseItems = [
  { icon: Building2,    title: 'Pre-Deployment Review', desc: 'Catch cascades before prod' },
  { icon: RefreshCw,    title: 'CI/CD Integration',     desc: 'Gate deployments on resilience score' },
  { icon: ClipboardList,title: 'Architecture Audit',    desc: 'Baseline your current system' },
];
const companyItems = [
  { icon: Users,  title: 'About Us',  path: '/company' },
  { icon: Mail,   title: 'Contact',   path: '/company#contact' },
  { icon: Trophy, title: 'Hackathon', path: '/company#hackathon' },
];

function Dropdown({ items }) {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 rounded-2xl border py-2 z-50 animate-fade-in-up backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 8px 32px rgba(26,18,8,0.18), 0 2px 8px rgba(26,18,8,0.10)',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors rounded-xl mx-1"
            style={{ '--tw-hover-bg': 'var(--color-bg)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-ascent-orange" />
            <div>
              <p className="text-sm font-semibold text-ascent-dark">{item.title}</p>
              {item.desc && <p className="text-xs text-ascent-muted mt-0.5">{item.desc}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavLink({ children, hasDropdown, dropdownItems, to }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav
        className="max-w-5xl mx-auto rounded-full shadow-nav border px-5 py-2.5 flex items-center justify-between"
        style={{
          backgroundColor: isDark ? 'rgba(31,21,16,0.94)' : 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: isDark ? '#2D2419' : '#E8DDD0',
        }}
      >
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center shrink-0">
          <img
            src={isDark ? lockupDark : lockupLight}
            alt="Ascent"
            className="h-10 w-auto"
          />
        </button>

        {/* Center links */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink hasDropdown dropdownItems={productItems} to="/product">Product</NavLink>
            <NavLink to="/how-it-works">How It Works</NavLink>
            <NavLink hasDropdown dropdownItems={useCaseItems} to="/use-cases">Use Cases</NavLink>
            <NavLink to="/resources">Resources</NavLink>
            <NavLink hasDropdown dropdownItems={companyItems} to="/company">Company</NavLink>
          </div>
        )}

        {/* Right */}
        <div className="hidden md:flex items-center gap-2">
          {isDashboard && (
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-ascent-mid hover:text-ascent-dark transition-colors"
            >
              ← Home
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-full border border-ascent-border text-ascent-mid hover:text-ascent-dark hover:bg-ascent-bg transition-all"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigate('/company#contact')}
            className="text-sm font-medium text-ascent-dark border border-ascent-dark rounded-full px-5 py-2 hover:bg-ascent-dark hover:text-ascent-card transition-all"
          >
            Book Demo
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-white rounded-full px-5 py-2 hover:-translate-y-px transition-all"
            style={{ backgroundColor: '#E8521A', boxShadow: '0 4px 20px rgba(232,82,26,0.32)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}
          >
            Get Started →
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-full border border-ascent-border text-ascent-mid">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="p-2 text-ascent-mid hover:text-ascent-dark" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden max-w-5xl mx-auto mt-2 rounded-2xl shadow-card border p-4 space-y-1"
          style={{
            backgroundColor: isDark ? '#1F1510' : '#FFFFFF',
            borderColor: isDark ? '#2D2419' : '#E8DDD0',
          }}
        >
          {[
            { label: 'Product',       path: '/product' },
            { label: 'How It Works',  path: '/how-it-works' },
            { label: 'Use Cases',     path: '/use-cases' },
            { label: 'Resources',     path: '/resources' },
            { label: 'Company',       path: '/company' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-ascent-mid hover:bg-ascent-bg hover:text-ascent-dark rounded-xl transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-ascent-border">
            <button
              onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
              className="w-full text-sm font-semibold text-white rounded-full px-5 py-2.5 transition-all"
              style={{ backgroundColor: '#E8521A', boxShadow: '0 4px 20px rgba(232,82,26,0.32)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}
            >
              Get Started →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
