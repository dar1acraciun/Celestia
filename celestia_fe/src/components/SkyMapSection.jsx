import { useEffect, useRef } from 'react'
import { MapPin, ZoomIn, Star, Telescope } from 'lucide-react'

function FadeBox({ children, delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
        } else {
          el.style.opacity = '0'
          el.style.transform = 'translateY(30px)'
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  )
}

const cards = [
  {
    icon: MapPin,
    title: 'Location-Accurate',
    description: 'Uses your GPS to render the exact sky above you, updated in real time based on your coordinates.',
  },
  {
    icon: Star,
    title: 'True Star Colors',
    description: 'Thousands of stars displayed with their real spectral colors — from blue giants to red dwarfs.',
  },
  {
    icon: Telescope,
    title: 'Constellation Lines',
    description: 'All 88 official constellations drawn with labels. Hover over any star for its name and magnitude.',
  },
  {
    icon: ZoomIn,
    title: 'Fully Interactive',
    description: 'Drag to rotate your view across the sky. Scroll to zoom in on any region you want to explore.',
  },
]

export default function SkyMapSection() {
  return (
    <section className="py-32 px-6" style={{ background: 'transparent' }}>
      <div className="max-w-6xl mx-auto">

        <FadeBox>
          <div className="mb-20 text-center">
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: '#e8e8f0',
              marginBottom: '1rem',
            }}>
              Explore the Night Sky
            </h2>
            <p style={{ color: '#9999b3', fontSize: '1.1rem' }}>
              An interactive 3D sky map rendered from your real location
            </p>
          </div>
        </FadeBox>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {cards.map(({ icon: Icon, title, description }, i) => (
            <FadeBox key={title} delay={i * 100}>
              <div className="p-8 rounded-2xl h-full" style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <Icon size={36} color="#4f8ef7" className="mb-4" />
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#e8e8f0',
                  fontSize: '1.3rem',
                  marginBottom: '0.75rem',
                }}>
                  {title}
                </h3>
                <p style={{ color: '#9999b3', lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>
            </FadeBox>
          ))}
        </div>

      </div>
    </section>
  )
}
