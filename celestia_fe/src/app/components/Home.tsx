import { Hero } from './Hero';
import { Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { ConstellationShowcase } from './ConstellationShowcase';
import { IdentifySection } from './IdentifySection';

export function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <ConstellationShowcase />
      <IdentifySection />

      <footer
        className="py-12 px-6 text-center border-t"
        style={{
          background: '#0a0a0f',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <p
          style={{
            color: '#9999b3',
            fontSize: '0.9375rem',
          }}
        >
          Celestia - Discover the Sky © 2026
        </p>
      </footer>
    </>
  );
}
