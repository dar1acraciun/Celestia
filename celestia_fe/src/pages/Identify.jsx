import { useState, useRef } from 'react'
import { CloudUpload, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { predictGNN, predictAstrometry, addHistory, uploadImage } from '../api'
import { useAuth } from '../context/AuthContext'

function UploadZone({ onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageUpload(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onImageUpload(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mb-12">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className="cursor-pointer transition-all duration-300"
        style={{
          background: isDragging ? 'rgba(13, 40, 87, 0.3)' : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: isDragging ? '2px dashed #0d2857' : '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '1.5rem',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <CloudUpload size={64} style={{ color: '#0d2857', margin: '0 auto', marginBottom: '1.5rem' }} />

        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.75rem' }}>
          Drop your photo here
        </h3>

        <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem' }}>
          or click to browse from your device
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
          <button
            onClick={(e) => { e.stopPropagation(); handleBrowseClick() }}
            className="px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
            style={{ background: '#0d2857', color: '#ffffff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Browse Files
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            className="px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer' }}
          >
            <Camera size={18} />
            Take a Photo
          </button>
        </div>
      </div>

      <p className="text-center mt-4" style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.4)' }}>
        Supported formats: JPG, PNG
      </p>
    </div>
  )
}

function LoadingCard({ label }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '2rem', color: '#ffffff' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#4a90d9',
          animation: 'spin 0.9s linear infinite',
          flexShrink: 0,
        }} />
        <div>
          <p style={{ color: '#c4c4d8', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            Analyzing your image...
          </p>
          {label === 'Astrometry.net' && (
            <p style={{ color: '#9999b3', fontSize: '0.8rem' }}>
              This can take up to 2 minutes — plate solving in progress
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Identify() {

  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [gnnResult, setGnnResult] = useState(null)
  const [gnnLoading, setGnnLoading] = useState(false)
  const [astroResult, setAstroResult] = useState(null)
  const [astroLoading, setAstroLoading] = useState(false)

  const handleImageUpload = async (file) => {
  setGnnResult(null)
  setAstroResult(null)
  setGnnLoading(true)
  setAstroLoading(true)

  const gnnPromise = predictGNN(file)
    .then((data) => { setGnnResult({ data }); return data })
    .catch((err) => { setGnnResult({ error: err.message }); return null })
    .finally(() => setGnnLoading(false))

  const astroPromise = predictAstrometry(file)
    .then((data) => { setAstroResult({ data }); return data })
    .catch((err) => { setAstroResult({ error: err.message }); return null })
    .finally(() => setAstroLoading(false))

    Promise.all([gnnPromise, astroPromise]).then(([gnnData, astroData]) => {
      if (gnnData && isLoggedIn) {
        uploadImage(file)
          .then(({ url }) => addHistory(gnnData, astroData, url))
          .catch(() => addHistory(gnnData, astroData, file.name))
      }
    })
  }

  const showCards = gnnLoading || astroLoading || gnnResult || astroResult

  return (
    <div className="min-h-screen px-6 py-32">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#e8e8f0', marginBottom: '1rem' }}>
            Identify a Constellation
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#9999b3' }}>
            Upload a photo of the night sky and let AI do the rest
          </p>
        </div>

        <UploadZone onImageUpload={handleImageUpload} />

        {showCards && (
          <div className="flex flex-col gap-6">

            {/* Card GNN */}
            {gnnLoading ? (
              <LoadingCard label="GNN Model" />
            ) : gnnResult && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '2rem', color: '#ffffff' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  GNN Model
                </p>
                {gnnResult.error ? (
                  <p style={{ color: '#f87171' }}>{gnnResult.error}</p>
                ) : (
                  <>
                    <h2
                      onClick={() => navigate(`/constellation/${encodeURIComponent(gnnResult.data?.constellation)}`)}
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '0.5rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }}
                    >
                      {gnnResult.data?.constellation}
                    </h2>
                    <p style={{ color: '#9999b3', marginBottom: '1rem' }}>
                      Confidence: {(gnnResult.data?.confidence * 100).toFixed(1)}%
                    </p>
                    <h4 style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Top 5:</h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {gnnResult.data?.top5?.map((item) => (
                        <li
                          key={item.name}
                          onClick={() => navigate(`/constellation/${encodeURIComponent(item.name)}`)}
                          style={{ color: '#9999b3', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                          {item.name} — {(item.confidence * 100).toFixed(1)}%
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Card Astrometry */}
            {astroLoading ? (
              <LoadingCard label="Astrometry.net" />
            ) : astroResult && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '2rem', color: '#ffffff' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#9999b3', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Astrometry.net
                </p>
                {astroResult.error ? (
                  <p style={{ color: '#f87171' }}>{astroResult.error}</p>
                ) : (
                  <>
                    <h2
                      onClick={() => astroResult.data?.constellation && navigate(`/constellation/${encodeURIComponent(astroResult.data.constellation)}`)}
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '0.5rem', cursor: astroResult.data?.constellation ? 'pointer' : 'default', textDecoration: astroResult.data?.constellation ? 'underline' : 'none', textDecorationColor: 'rgba(255,255,255,0.3)' }}
                    >
                      {astroResult.data?.constellation || 'Unknown'}
                    </h2>
                    {astroResult.data?.objects_in_field?.length > 0 && (
                      <>
                        <h4 style={{ color: '#c4c4d8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Obiecte detectate:</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {astroResult.data.objects_in_field.map((obj) => (
                            <li key={obj} style={{ color: '#9999b3', fontSize: '0.9rem' }}>{obj}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}

export default Identify
