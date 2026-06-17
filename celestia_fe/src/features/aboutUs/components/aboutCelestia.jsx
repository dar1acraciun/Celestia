function AboutCelestia() {
  return (
    <div>
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        <h1
          data-aos="fade-down"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
            lineHeight: 1.1,
          }}
        >
          Discover the Sky
        </h1>
        <p
          data-aos="fade-up"
          data-aos-delay="200"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.3rem)',
            color: '#c4c4d8',
            maxWidth: '520px',
            lineHeight: 1.7,
          }}
        >
          Explore the live sky on your computer
        </p>
      </section>

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        <h2
          data-aos="fade-down"
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: "'Playfair Display', serif",
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
            lineHeight: 1.2,
          }}
        >
          The Live Sky Map
        </h2>
        <p
          data-aos="fade-up"
          data-aos-delay="200"
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
            color: '#c4c4d8',
            maxWidth: '620px',
            lineHeight: 1.9,
          }}
        >
          Our 3D sky map is built with Three.js — a real-time interactive sphere rendered directly in your browser.
          Stars are positioned using real astronomical data, calculated from your GPS location and the current time.
          The sky rotates as time passes, constellations are drawn from catalog data, and everything you see reflects
          the actual night sky above you.
        </p>
      </section>
    </div>
  )
}
export default AboutCelestia
