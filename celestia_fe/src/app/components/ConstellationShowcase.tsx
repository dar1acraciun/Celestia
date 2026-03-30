import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';

interface Constellation {
  name: string;
  mythology: string;
  stars: number;
  illustration: string;
}

interface ConstellationCardProps {
  constellation: Constellation;
  index: number;
}

function ConstellationCard({ constellation, index }: ConstellationCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-80 p-6 rounded-2xl backdrop-blur-sm transition-all duration-700 hover:scale-105 cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
        opacity: isVisible ? 1 : 0,
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div
        className="w-full h-48 rounded-xl mb-5 flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(167, 139, 250, 0.1))',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="opacity-80"
        >
          {constellation.illustration === 'orion' && (
            <>
              <circle cx="80" cy="30" r="3" fill="#e8e8f0" />
              <circle cx="50" cy="60" r="2.5" fill="#e8e8f0" />
              <circle cx="110" cy="60" r="2.5" fill="#e8e8f0" />
              <circle cx="70" cy="90" r="2" fill="#4f8ef7" />
              <circle cx="80" cy="95" r="2" fill="#4f8ef7" />
              <circle cx="90" cy="90" r="2" fill="#4f8ef7" />
              <circle cx="60" cy="130" r="2.5" fill="#e8e8f0" />
              <circle cx="100" cy="130" r="2.5" fill="#e8e8f0" />
              <line x1="80" y1="30" x2="50" y2="60" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="80" y1="30" x2="110" y2="60" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="50" y1="60" x2="70" y2="90" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="110" y1="60" x2="90" y2="90" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="70" y1="90" x2="80" y2="95" stroke="rgba(79, 142, 247, 0.6)" strokeWidth="2" />
              <line x1="80" y1="95" x2="90" y2="90" stroke="rgba(79, 142, 247, 0.6)" strokeWidth="2" />
              <line x1="70" y1="90" x2="60" y2="130" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="90" y1="90" x2="100" y2="130" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
            </>
          )}
          {constellation.illustration === 'ursa-major' && (
            <>
              <circle cx="30" cy="80" r="2.5" fill="#e8e8f0" />
              <circle cx="50" cy="70" r="2.5" fill="#e8e8f0" />
              <circle cx="70" cy="65" r="2" fill="#e8e8f0" />
              <circle cx="90" cy="70" r="2" fill="#e8e8f0" />
              <circle cx="100" cy="90" r="2.5" fill="#4f8ef7" />
              <circle cx="80" cy="100" r="2" fill="#e8e8f0" />
              <circle cx="50" cy="95" r="2.5" fill="#e8e8f0" />
              <line x1="30" y1="80" x2="50" y2="70" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="50" y1="70" x2="70" y2="65" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="70" y1="65" x2="90" y2="70" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="90" y1="70" x2="100" y2="90" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="100" y1="90" x2="80" y2="100" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="80" y1="100" x2="50" y2="95" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="50" y1="95" x2="30" y2="80" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
            </>
          )}
          {constellation.illustration === 'cassiopeia' && (
            <>
              <circle cx="30" cy="80" r="2.5" fill="#e8e8f0" />
              <circle cx="60" cy="50" r="2.5" fill="#4f8ef7" />
              <circle cx="90" cy="70" r="2" fill="#e8e8f0" />
              <circle cx="110" cy="40" r="2.5" fill="#e8e8f0" />
              <circle cx="130" cy="60" r="2" fill="#e8e8f0" />
              <line x1="30" y1="80" x2="60" y2="50" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
              <line x1="60" y1="50" x2="90" y2="70" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
              <line x1="90" y1="70" x2="110" y2="40" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
              <line x1="110" y1="40" x2="130" y2="60" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
            </>
          )}
          {constellation.illustration === 'leo' && (
            <>
              <circle cx="40" cy="60" r="3" fill="#4f8ef7" />
              <circle cx="70" cy="50" r="2" fill="#e8e8f0" />
              <circle cx="90" cy="60" r="2.5" fill="#e8e8f0" />
              <circle cx="110" cy="80" r="2" fill="#e8e8f0" />
              <circle cx="100" cy="110" r="2.5" fill="#e8e8f0" />
              <circle cx="60" cy="100" r="2" fill="#e8e8f0" />
              <circle cx="45" cy="85" r="2" fill="#e8e8f0" />
              <line x1="40" y1="60" x2="70" y2="50" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="70" y1="50" x2="90" y2="60" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="90" y1="60" x2="110" y2="80" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="110" y1="80" x2="100" y2="110" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="100" y1="110" x2="60" y2="100" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="60" y1="100" x2="45" y2="85" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="45" y1="85" x2="40" y2="60" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
            </>
          )}
          {constellation.illustration === 'cygnus' && (
            <>
              <circle cx="80" cy="40" r="2.5" fill="#e8e8f0" />
              <circle cx="80" cy="70" r="2.5" fill="#4f8ef7" />
              <circle cx="50" cy="70" r="2" fill="#e8e8f0" />
              <circle cx="110" cy="70" r="2" fill="#e8e8f0" />
              <circle cx="80" cy="110" r="2.5" fill="#e8e8f0" />
              <line x1="80" y1="40" x2="80" y2="70" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
              <line x1="50" y1="70" x2="110" y2="70" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
              <line x1="80" y1="70" x2="80" y2="110" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1.5" />
            </>
          )}
          {constellation.illustration === 'scorpius' && (
            <>
              <circle cx="40" cy="50" r="3" fill="#e8e8f0" />
              <circle cx="60" cy="60" r="2" fill="#e8e8f0" />
              <circle cx="75" cy="75" r="2.5" fill="#4f8ef7" />
              <circle cx="85" cy="90" r="2" fill="#e8e8f0" />
              <circle cx="100" cy="105" r="2" fill="#e8e8f0" />
              <circle cx="120" cy="115" r="2.5" fill="#e8e8f0" />
              <circle cx="130" cy="100" r="2" fill="#e8e8f0" />
              <line x1="40" y1="50" x2="60" y2="60" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="60" y1="60" x2="75" y2="75" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="75" y1="75" x2="85" y2="90" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="85" y1="90" x2="100" y2="105" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="100" y1="105" x2="120" y2="115" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
              <line x1="120" y1="115" x2="130" y2="100" stroke="rgba(79, 142, 247, 0.4)" strokeWidth="1.5" />
            </>
          )}
        </svg>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Star size={16} color="#4f8ef7" fill="#4f8ef7" />
        <h4
          style={{
            color: '#e8e8f0',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          {constellation.name}
        </h4>
      </div>

      <p
        className="mb-3"
        style={{
          color: '#a78bfa',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {constellation.mythology}
      </p>

      <p
        style={{
          color: '#9999b3',
          fontSize: '0.875rem',
        }}
      >
        {constellation.stars} main stars
      </p>
    </div>
  );
}

export function ConstellationShowcase() {
  const constellations: Constellation[] = [
    {
      name: 'Orion',
      mythology: 'Greek mythology',
      stars: 7,
      illustration: 'orion',
    },
    {
      name: 'Ursa Major',
      mythology: 'Greek mythology',
      stars: 7,
      illustration: 'ursa-major',
    },
    {
      name: 'Cassiopeia',
      mythology: 'Greek mythology',
      stars: 5,
      illustration: 'cassiopeia',
    },
    {
      name: 'Leo',
      mythology: 'Greek mythology',
      stars: 9,
      illustration: 'leo',
    },
    {
      name: 'Cygnus',
      mythology: 'Greek mythology',
      stars: 5,
      illustration: 'cygnus',
    },
    {
      name: 'Scorpius',
      mythology: 'Greek mythology',
      stars: 18,
      illustration: 'scorpius',
    },
  ];

  return (
    <section
      className="py-32 px-6 relative overflow-hidden"
      style={{
        background: '#0a0a0f',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: '#e8e8f0',
            }}
          >
            Explore Constellations
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#9999b3',
            }}
          >
            Discover the stories written in the stars
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {constellations.map((constellation, index) => (
            <ConstellationCard
              key={index}
              constellation={constellation}
              index={index}
            />
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
