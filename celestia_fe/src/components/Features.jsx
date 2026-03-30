import { Telescope, Camera, Star } from 'lucide-react'

function Features() {
  return (
    <section className="py-32 px-6" style={{ background: 'transparent' }}>
      <div className="max-w-6xl mx-auto">

        <div className="mb-20 text-center" data-aos="fade-up">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div data-aos="fade-right" data-aos-delay="0"
            className="p-8 rounded-2xl"
            style={{
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

          <div data-aos="fade-up" data-aos-delay="100"
            className="p-8 rounded-2xl"
            style={{
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

          <div data-aos="fade-left" data-aos-delay="200"
            className="p-8 rounded-2xl"
            style={{
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

        </div>
      </div>
    </section>
  )
}

export default Features
