import { EyeOff, Shield, Wrench } from 'lucide-react';
import SectionBadge from '../shared/SectionBadge';
import RevealWrapper from '../shared/RevealWrapper';

const cards = [
  {
    icon: EyeOff,
    diag: 'DIAGNOSTIC 1',
    title: 'The Visibility Gap',
    body: 'No tool tells you which microservice to test first, or why. You\'re guessing at blast radius with no data.',
  },
  {
    icon: Shield,
    diag: 'DIAGNOSTIC 2',
    title: 'The Cascade Blind Spot',
    body: 'Three upstream services each retry 3 times = 27× the load on an already-failing node. Manual analysis can\'t model that.',
  },
  {
    icon: Wrench,
    diag: 'DIAGNOSTIC 3',
    title: 'The Fix-Verify Loop',
    body: 'After patching, there\'s no way to prove the fix worked — until prod breaks. Ascent closes that loop in 90 seconds.',
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-ascent-bg-alt py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper className="text-center space-y-4 mb-14">
          <SectionBadge>The Problem</SectionBadge>
          <h2 className="text-4xl font-display font-extrabold text-ascent-dark mt-3">
            Chaos engineering has a reasoning problem
          </h2>
          <p className="text-ascent-mid max-w-xl mx-auto">
            Existing tools run experiments a human chose on live infra a human provisioned. No tool tells you what to test or why.
          </p>
        </RevealWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <RevealWrapper key={card.title} delay={i * 80}>
                <div className="bg-ascent-card rounded-xl2 p-6 shadow-card border border-ascent-border h-full flex flex-col hover:-translate-y-1 transition-transform duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-ascent-bg rounded-xl border border-ascent-border group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-ascent-orange" />
                    </div>
                    <span className="text-[10px] font-mono text-ascent-muted">{card.diag}</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-ascent-dark mb-2">{card.title}</h3>
                  <p className="text-sm text-ascent-mid leading-relaxed">{card.body}</p>
                </div>
              </RevealWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
