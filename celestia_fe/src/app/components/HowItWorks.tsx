import { useEffect, useRef, useState } from 'react';
import { Upload, Sparkles, CheckCircle } from 'lucide-react';

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  isLast?: boolean;
}

function Step({ icon, title, description, index, isLast }: StepProps) {
  const [isVisible, setIsVisible] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (stepRef.current) {
      observer.observe(stepRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationDirection = index % 2 === 0 ? '-80px' : '80px';

  return (
    <div className="flex flex-col items-center relative" ref={stepRef}>
      <div
        className="flex flex-col items-center transition-all duration-700"
        style={{
          transform: isVisible ? 'translateX(0) translateY(0)' : `translateX(${animationDirection}) translateY(40px)`,
          opacity: isVisible ? 1 : 0,
          transitionDelay: `${index * 200}ms`,
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative"
          style={{
            background: 'rgba(167, 139, 250, 0.1)',
            border: '2px solid rgba(167, 139, 250, 0.3)',
          }}
        >
          {icon}
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: '#4f8ef7',
              color: '#e8e8f0',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            {index + 1}
          </div>
        </div>

        <h3
          className="mb-3 text-center"
          style={{
            color: '#e8e8f0',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          {title}
        </h3>

        <p
          className="text-center max-w-xs"
          style={{
            color: '#9999b3',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      {!isLast && (
        <div
          className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5"
          style={{
            background: 'linear-gradient(90deg, rgba(79, 142, 247, 0.5), rgba(167, 139, 250, 0.5))',
            opacity: isVisible ? 0.4 : 0,
            transition: 'opacity 0.7s',
            transitionDelay: `${(index + 1) * 200}ms`,
          }}
        />
      )}
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: <Upload size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'Upload a Photo',
      description: 'Take or upload a photo of the night sky from anywhere in the world',
    },
    {
      icon: <Sparkles size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'AI Analyzes',
      description: 'Our AI processes the image and identifies stars and patterns in seconds',
    },
    {
      icon: <CheckCircle size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'See Results',
      description: 'Get identified constellations with mythology, names, and celestial information',
    },
  ];

  return (
    <section
      className="py-32 px-6 relative"
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0f1a 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2
            className="mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: '#e8e8f0',
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#9999b3',
            }}
          >
            From photo to constellation in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-16 md:gap-8 relative">
          {steps.map((step, index) => (
            <Step
              key={index}
              {...step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
