import { useEffect, useRef } from 'react'
import { Telescope, Camera, Star } from 'lucide-react'

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

function Features() {
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
              Everything you need
            </h2>
            <p style={{ color: '#9999b3', fontSize: '1.1rem' }}>
              Explore the night sky like never before
            </p>
          </div>
        </FadeBox>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <FadeBox delay={0}>
            <div className="p-8 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Telescope size={36} color="#4f8ef7" className="mb-4" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#e8e8f0', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
                Learn Constellations
              </h3>
              <p style={{ color: '#9999b3', lineHeight: 1.6 }}>
                Browse through 88 official constellations, their mythology, and the stories behind them.
              </p>
            </div>
          </FadeBox>

          <FadeBox delay={150}>
            <div className="p-8 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Camera size={36} color="#4f8ef7" className="mb-4" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#e8e8f0', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
                Identify from Photos
              </h3>
              <p style={{ color: '#9999b3', lineHeight: 1.6 }}>
                Upload a photo of the night sky and let AI identify the constellations for you instantly.
              </p>
            </div>
          </FadeBox>

          <FadeBox delay={300}>
            <div className="p-8 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Star size={36} color="#4f8ef7" className="mb-4" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#e8e8f0', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
                Explore the Sky
              </h3>
              <p style={{ color: '#9999b3', lineHeight: 1.6 }}>
                Discover star maps, mythology, and deep space facts for every constellation.
              </p>
            </div>
          </FadeBox>

        </div>
      </div>
    </section>
  )
}

export default Features
