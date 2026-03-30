import { useEffect, useRef, useState } from 'react';
import { Telescope, Map, Camera } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationDirection = index % 2 === 0 ? '-100px' : '100px';

  return (
    <div
      ref={cardRef}
      className="p-8 rounded-2xl backdrop-blur-sm transition-all duration-700"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transform: isVisible ? 'translateX(0) translateY(0)' : `translateX(${animationDirection}) translateY(30px)`,
        opacity: isVisible ? 1 : 0,
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(79, 142, 247, 0.15)',
          border: '1px solid rgba(79, 142, 247, 0.3)',
        }}
      >
        {icon}
      </div>

      <h3
        className="mb-3"
        style={{
          color: '#e8e8f0',
          fontSize: '1.375rem',
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#9999b3',
          fontSize: '1rem',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}

export function Features() {
  const features = [
    {
      icon: <Telescope size={28} color="#4f8ef7" strokeWidth={2} />,
      title: 'Interactive Learning',
      description: 'Explore detailed information about constellations, their mythology, and the stories behind the stars.',
    },
    {
      icon: <Map size={28} color="#4f8ef7" strokeWidth={2} />,
      title: 'Star Maps',
      description: 'Navigate the night sky with interactive star maps that show you exactly what\'s visible from your location.',
    },
    {
      icon: <Camera size={28} color="#4f8ef7" strokeWidth={2} />,
      title: 'AI Identification',
      description: 'Upload photos of the night sky and let AI instantly identify constellations and celestial objects.',
    },
  ];

  return (
    <section className="py-32 px-6 relative" style={{ background: '#0a0a0f' }}>
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
            Everything You Need
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#9999b3',
            }}
          >
            Discover, learn, and identify constellations like never before
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
