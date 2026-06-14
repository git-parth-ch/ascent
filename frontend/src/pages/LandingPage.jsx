import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import WhyAscentSection from '../components/landing/WhyAscentSection';
import SampleArchitecturesSection from '../components/landing/SampleArchitecturesSection';
import FAQSection from '../components/landing/FAQSection';

export default function LandingPage() {
  return (
    <div className="bg-ascent-bg min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <WhyAscentSection />
      <SampleArchitecturesSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
