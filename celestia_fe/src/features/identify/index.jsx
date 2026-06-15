import { useIdentify } from './hooks/useIdentify'
import UploadZone from './components/UploadZone'
import LoadingCard from './components/LoadingCard'
import GnnResultCard from './components/GnnResultCard'
import AstrometryResultCard from './components/AstrometryResultCard'

function Identify() {
  const { gnnResult, gnnLoading, astroResult, astroLoading, imagePreview, handleImageUpload, handleNewPrediction } = useIdentify()

  const showCards = gnnLoading || astroLoading || gnnResult || astroResult

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
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

        {imagePreview ? (
          <div className="mb-12">
            <div style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
              <img src={imagePreview} alt="Uploaded sky" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleNewPrediction}
                className="px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                New prediction
              </button>
            </div>
          </div>
        ) : (
          <UploadZone onImageUpload={handleImageUpload} />
        )}

        {showCards && (
          <div className="flex flex-col gap-6">
            {gnnLoading ? <LoadingCard label="GNN Model" /> : gnnResult && <GnnResultCard result={gnnResult} />}
            {astroLoading ? <LoadingCard label="Astrometry.net" /> : astroResult && <AstrometryResultCard result={astroResult} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default Identify
