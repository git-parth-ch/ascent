import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionBadge from '../components/shared/SectionBadge';
import RevealWrapper from '../components/shared/RevealWrapper';
import { ExternalLink } from 'lucide-react';

const resources = [
  {
    icon: '📦',
    title: 'GitHub Repository',
    desc: 'Full source — backend agents, simulation engine, frontend, and tests. MIT licensed.',
    link: 'https://github.com',
    label: 'View on GitHub',
  },
  {
    icon: '📖',
    title: 'README',
    desc: 'Setup guide, API reference, blueprint schema, and example JSON files.',
    link: '#',
    label: 'Read the README',
  },
  {
    icon: '🔌',
    title: 'API Reference',
    desc: 'REST endpoints: /samples, /analyze, /apply-fix, /export-yaml. Full request/response schemas.',
    link: '#',
    label: 'API Docs',
  },
  {
    icon: '🏗',
    title: 'Sample Architectures',
    desc: 'E-commerce (14 nodes), Ride-sharing (12 nodes), Banking (16 nodes). JSON blueprints you can download and modify.',
    link: '#',
    label: 'Download Blueprints',
  },
  {
    icon: '📐',
    title: 'Blueprint Schema',
    desc: 'The full JSON schema for describing your own architecture. system_name, nodes[], edges[], and per-node properties.',
    link: '#',
    label: 'View Schema',
  },
  {
    icon: '⚗️',
    title: 'Chaos Mesh Docs',
    desc: 'Ascent exports Chaos Mesh YAML. Read the Chaos Mesh docs to run those experiments on live infra.',
    link: 'https://chaos-mesh.org',
    label: 'Chaos Mesh →',
  },
];

const blueprintSnippet = `{
  "system_name": "my-service",
  "nodes": [
    {
      "id": "api-gateway",
      "node_type": "service",
      "replicas": 2,
      "circuit_breaker": false,
      "timeout_ms": 5000,
      "latency_ms": 20
    },
    {
      "id": "orders-db",
      "node_type": "database",
      "replicas": 1
    }
  ],
  "edges": [
    { "source": "api-gateway", "target": "orders-db", "type": "sync" }
  ]
}`;

export default function ResourcesPage() {
  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />

      <section className="pt-36 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <SectionBadge>Resources</SectionBadge>
          <h1 className="text-5xl font-display font-extrabold text-ascent-dark leading-tight mt-3">
            Everything you need to get started
          </h1>
          <p className="text-lg text-ascent-mid">
            Open source. No signup. No credentials. Just a blueprint JSON.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((r, i) => (
            <RevealWrapper key={r.title} delay={i * 60}>
              <div className="bg-white rounded-xl2 p-6 shadow-card border border-ascent-border h-full flex flex-col hover:-translate-y-1 transition-transform duration-200">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="text-lg font-display font-bold text-ascent-dark mb-2">{r.title}</h3>
                <p className="text-sm text-ascent-mid leading-relaxed flex-1 mb-4">{r.desc}</p>
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ascent-orange hover:opacity-80 transition-opacity"
                >
                  {r.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* Blueprint example */}
      <section className="bg-ascent-bg-alt py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-8">
            <SectionBadge>Blueprint Schema</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Describe your architecture in JSON</h2>
            <p className="text-ascent-mid text-sm">Upload this to /dashboard or POST it to /analyze.</p>
          </RevealWrapper>
          <RevealWrapper>
            <pre className="bg-ascent-dark text-[#A89880] font-mono text-xs rounded-xl2 p-6 overflow-auto leading-relaxed shadow-card">
              {blueprintSnippet}
            </pre>
          </RevealWrapper>
        </div>
      </section>

      <Footer />
    </div>
  );
}
