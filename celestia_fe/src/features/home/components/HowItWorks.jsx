import { useEffect, useRef, useState } from 'react'
import { ScanSearch, Network, GitCompare } from 'lucide-react'

function Step({ icon, title, description, index, isLast }) {
  const [isVisible, setIsVisible] = useState(false)
  const stepRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )
    if (stepRef.current) observer.observe(stepRef.current)
    return () => observer.disconnect()
  }, [])

  const animationDirection = index % 2 === 0 ? '-80px' : '80px'

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
            fontFamily: "'Playfair Display', serif",
            color: '#e8e8f0',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          {title}
        </h3>

        <p
          className="text-center max-w-xs"
          style={{ color: '#9999b3', fontSize: '0.9375rem', lineHeight: 1.6 }}
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
  )
}

function HowItWorks() {
  const headerRef = useRef(null)
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(entry.isIntersecting),
      { threshold: 0.3 }
    )
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const steps = [
    {
      icon: <ScanSearch size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'Star Detection',
      description: 'The image is scanned to extract individual stars — their positions, brightness, and relative distances form a geometric graph.',
    },
    {
      icon: <Network size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'Graph Neural Network',
      description: 'A GNN model trained on all 88 official constellations analyzes the star graph and predicts the best match with a confidence score.',
    },
    {
      icon: <GitCompare size={32} color="#a78bfa" strokeWidth={2} />,
      title: 'Plate Solving',
      description: 'In parallel, Astrometry.net cross-references the star field against a global sky catalog for an independent, coordinate-based verification.',
    },
  ]

  return (
    <section className="py-20 sm:py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div
          ref={headerRef}
          className="text-center mb-12 sm:mb-20"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <h2
            className="mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: '#e8e8f0',
            }}
          >
            How the AI Identifies
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#9999b3' }}>
            Two independent models working together for accurate results
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
  )
}

export default HowItWorks
