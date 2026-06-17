function IdentificationModel() {
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
          Identification Model
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
          Recognise constellation from astronomical photos
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
          How It Works
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
          Our identification model is a Graph Neural Network trained on synthetic images generated from astronomical
          catalogs. The computer vision pipeline first detects stars within the photo, then constructs a graph using
          Delaunay triangulation — connecting neighboring stars into a geometric structure. This graph is then passed
          to the neural network, which analyzes the spatial relationships between stars to predict the constellation.
        </p>
      </section>
    </div>
  )
}
export default IdentificationModel
