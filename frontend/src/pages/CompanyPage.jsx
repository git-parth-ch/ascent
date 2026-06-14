import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionBadge from '../components/shared/SectionBadge';
import RevealWrapper from '../components/shared/RevealWrapper';

const team = [
  { name: 'Parth', role: 'Full-stack & Agent Architecture' },
];

export default function CompanyPage() {
  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />

      {/* About */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <RevealWrapper className="space-y-5 mb-14">
            <SectionBadge>About</SectionBadge>
            <h1 className="text-5xl font-display font-extrabold text-ascent-dark leading-tight mt-3">
              Built for the Agentic &amp;<br />Autonomous Systems track
            </h1>
            <p className="text-lg text-ascent-mid leading-relaxed max-w-2xl">
              The core insight behind Ascent: existing chaos engineering tools execute, but they don't reason. A human decides what to test. A human picks the target. A human reads the results.
            </p>
            <p className="text-ascent-mid leading-relaxed max-w-2xl">
              Ascent inverts that. An agent swarm decides what to attack based on topology, centrality, and detected anti-patterns. The score is deterministic. The patches are validated. The YAML is ready to feed into Chaos Mesh the moment you want to go live.
            </p>
            <p className="text-ascent-mid leading-relaxed max-w-2xl">
              LLMs only explain what happened. They never decide what matters. Every number in the report is auditable code, not model output.
            </p>
          </RevealWrapper>

          {/* The core claim */}
          <RevealWrapper>
            <div className="bg-ascent-dark text-white rounded-xl2 p-8 space-y-3">
              <p className="text-xs font-mono text-ascent-amber uppercase tracking-widest">The insight</p>
              <p className="text-2xl font-display font-bold leading-snug">
                "Existing chaos tools execute.<br />They don't reason."
              </p>
              <p className="text-[#A89880] text-sm leading-relaxed">
                Ascent is the reasoning layer. Upload a blueprint. Get a prioritized attack plan. Apply a fix. Watch the score move. Zero live infra required.
              </p>
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* Team */}
      <section id="hackathon" className="bg-ascent-bg-alt py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-12">
            <SectionBadge>Team</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Hackathon Team</h2>
            <p className="text-ascent-mid text-sm">Built for the Agentic &amp; Autonomous Systems track.</p>
          </RevealWrapper>

          <div className="flex flex-wrap justify-center gap-5">
            {team.map((member, i) => (
              <RevealWrapper key={member.name} delay={i * 80}>
                <div className="bg-white rounded-xl2 p-6 shadow-card border border-ascent-border w-56 text-center hover:-translate-y-1 transition-transform duration-200">
                  <div className="w-14 h-14 rounded-full bg-ascent-bg border-2 border-ascent-border mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-ascent-orange">{member.name[0]}</span>
                  </div>
                  <h3 className="font-display font-bold text-ascent-dark">{member.name}</h3>
                  <p className="text-xs text-ascent-muted mt-1 leading-snug">{member.role}</p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-ascent-bg py-20 px-6">
        <div className="max-w-xl mx-auto">
          <RevealWrapper className="text-center space-y-3 mb-10">
            <SectionBadge>Contact</SectionBadge>
            <h2 className="text-3xl font-display font-bold text-ascent-dark mt-3">Get in touch</h2>
            <p className="text-ascent-mid text-sm">Questions, feedback, or want a demo? Reach out directly.</p>
          </RevealWrapper>

          <RevealWrapper>
            <div className="bg-white rounded-xl2 p-8 shadow-card border border-ascent-border space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ascent-dark">Name</label>
                <input
                  className="w-full border border-ascent-border rounded-xl px-4 py-2.5 text-sm text-ascent-dark bg-ascent-bg placeholder-ascent-muted focus:outline-none focus:border-ascent-orange transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ascent-dark">Email</label>
                <input
                  type="email"
                  className="w-full border border-ascent-border rounded-xl px-4 py-2.5 text-sm text-ascent-dark bg-ascent-bg placeholder-ascent-muted focus:outline-none focus:border-ascent-orange transition-colors"
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ascent-dark">Message</label>
                <textarea
                  rows={4}
                  className="w-full border border-ascent-border rounded-xl px-4 py-2.5 text-sm text-ascent-dark bg-ascent-bg placeholder-ascent-muted focus:outline-none focus:border-ascent-orange transition-colors resize-none"
                  placeholder="Tell us what you're building..."
                />
              </div>
              <button className="w-full bg-ascent-orange text-white rounded-full py-3 font-semibold shadow-cta hover:bg-[#C94115] transition-all">
                Send Message
              </button>
              <p className="text-xs text-center text-ascent-muted">
                Or email directly: <a href="mailto:oompathania@gmail.com" className="text-ascent-orange hover:underline">oompathania@gmail.com</a>
              </p>
            </div>
          </RevealWrapper>
        </div>
      </section>

      <Footer />
    </div>
  );
}
