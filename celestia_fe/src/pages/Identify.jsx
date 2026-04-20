import { useState, useRef } from 'react'
import { CloudUpload, Camera } from 'lucide-react'

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
          background: isDragging ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: isDragging ? '2px dashed #6366f1' : '2px dashed rgba(255, 255, 255, 0.2)',
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

        <CloudUpload size={64} style={{ color: '#6366f1', margin: '0 auto', marginBottom: '1.5rem' }} />

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
            style={{ background: '#6366f1', color: '#ffffff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
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

function Identify() {
  const [uploadedImage, setUploadedImage] = useState(null)

  return (
    <div className="min-h-screen px-6 py-32">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#e8e8f0', marginBottom: '1rem' }}>
            Identify a Constellation
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#9999b3' }}>
            Upload a photo of the night sky and let AI do the rest
          </p>
        </div>

        <UploadZone onImageUpload={(file) => setUploadedImage(file)} />

        {uploadedImage && (
          <div className="text-center" style={{ color: '#9999b3' }}>
            <p>Analyzing <span style={{ color: '#6366f1' }}>{uploadedImage.name}</span>...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Identify
