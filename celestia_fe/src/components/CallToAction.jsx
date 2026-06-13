import { useEffect, useRef, useState } from 'react'

function CallToAction() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 sm:py-32 px-6 flex items-center justify-center">
      <div
        ref={ref}
        className="text-center transition-all duration-700"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        }}
      >
        <h2
          className="mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: '#e8e8f0',
            marginBottom: '1rem',
          }}
        >
          Ready to explore the sky?
        </h2>

        <p
          className="mb-10"
          style={{
            color: '#9999b3',
            fontSize: '1.125rem',
            fontStyle: 'italic',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Start your constellation journey tonight
        </p>

        <button
          onClick={scrollToTop}
          className="px-10 py-4 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: '#0c295c',
            color: '#e8e8f0',
            fontWeight: 600,
            fontSize: '1.0625rem',
          }}
        >
          Begin your journey
        </button>
      </div>
    </section>
  )
}

export default CallToAction
