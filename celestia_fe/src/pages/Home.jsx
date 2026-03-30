import logo from "../assets/fullLogo.png"
import Features from '../components/Features'
import HowItWorks from "../components/HowItWorks"
import Footer from "../components/Footer"
import CallToAction from '../components/CallToAction'





function Home() {
  return (
    <>
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <img
          src={logo}
          alt="Celestia"
          className="mb-2 mx-auto"
          style={{ height: '350px', width: '350px', objectFit: 'contain', marginBottom: '-140px' }}
        />

        <p
          className="mb-6 max-w-2xl mx-auto"
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: '#9999b3',
            lineHeight: 1.6,
            fontStyle: 'italic',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Learn and identify constellations with AI
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: '#0d2857',
              color: '#e8e8f0',
              fontWeight: 600,
              fontSize: '1.0625rem',
            }}
          >
            Start Learning
          </button>

          <button
            className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              color: '#e8e8f0',
              fontWeight: 600,
              fontSize: '1.0625rem',
            }}
          >
            Try Identifying
          </button>
        </div>
      </div>

    </section>
    <Features />
    <HowItWorks />
    <CallToAction />
    <Footer />
    </>
  )
}

export default Home
