import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const faqs = [
  {
    q: 'Is this a replacement for Gremlin or Chaos Monkey?',
    a: 'No. Those tools execute experiments on live infra that a human chose. Ascent is the reasoning layer that decides what to test and why — pre-deployment. Our Chaos Mesh YAML export feeds directly into those tools.',
  },
  {
    q: 'Does Ascent touch my live infrastructure?',
    a: 'Never. Ascent runs entirely on your architecture blueprint — a JSON description of your system\'s topology. No credentials, no live connections, no infra access required.',
  },
  {
    q: 'How is the resilience score calculated?',
    a: 'Fully deterministically. Score = max(0, round(100 − Σ(severity × blast_radius × likelihood) × 1300)). Every number comes from simulation math, not LLM output. The likelihood formula uses 6 named anti-pattern rules, each with a fixed score.',
  },
  {
    q: 'What does "LLMs only explain, never decide" mean?',
    a: 'Every decision in Ascent — which nodes to test, what the likelihood score is, whether a patch is safe — comes from deterministic code. Gemini\'s only role is generating the plain-English explanations you see in the agent log. This makes every output fully auditable.',
  },
  {
    q: 'Can I use this in CI/CD?',
    a: 'The /analyze endpoint accepts any blueprint JSON and returns a structured report. Point it at your architecture-as-code artifact and fail the build if resilience_score drops below your threshold.',
  },
  {
    q: 'Is this free to run?',
    a: 'Ascent uses Gemini 2.5 Flash (1,500 free requests/day) and Groq as fallback (1,000 free requests/day). For most teams, pre-cached results mean zero LLM calls during normal use. Total cost: $0.',
  },
];

function FAQItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);

  return (
    <RevealWrapper delay={delay}>
      <div className="border-b border-ascent-border">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-5 text-left gap-4"
        >
          <span className="text-base font-semibold text-ascent-dark">{q}</span>
          {open ? <X className="w-5 h-5 text-ascent-orange shrink-0" /> : <Plus className="w-5 h-5 text-ascent-mid shrink-0" />}
        </button>
        {/* CSS grid height animation */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <p className="text-sm text-ascent-mid leading-relaxed pb-5">{a}</p>
          </div>
        </div>
      </div>
    </RevealWrapper>
  );
}

export default function FAQSection() {
  return (
    <section className="bg-ascent-bg py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-12">
          <SectionBadge>FAQ</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">
            Questions we actually get asked
          </h2>
        </RevealWrapper>

        <div>
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} delay={i * 50} />
          ))}
        </div>
      </div>
    </section>
  );
}
