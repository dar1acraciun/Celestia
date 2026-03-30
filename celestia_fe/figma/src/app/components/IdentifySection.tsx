import { useState, useRef } from 'react';
import { Upload, X, Sparkles } from 'lucide-react';

export function IdentifySection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    confidence: number;
    description: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);

    // Mock AI analysis
    setTimeout(() => {
      const mockResults = [
        {
          name: 'Orion',
          confidence: 94,
          description: 'One of the most recognizable constellations in the night sky. Named after a hunter in Greek mythology.',
        },
        {
          name: 'Ursa Major',
          confidence: 87,
          description: 'Also known as the Great Bear. Contains the famous Big Dipper asterism.',
        },
        {
          name: 'Cassiopeia',
          confidence: 91,
          description: 'A distinctive W-shaped constellation representing a queen in Greek mythology.',
        },
      ];

      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section
      className="py-32 px-6 relative"
      style={{
        background: 'linear-gradient(180deg, #0d0f1a 0%, #0a0a0f 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: '#e8e8f0',
            }}
          >
            Identify Constellations
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#9999b3',
            }}
          >
            Upload a photo of the night sky and discover what you're looking at
          </p>
        </div>

        {!selectedFile ? (
          <div
            className="relative rounded-2xl p-16 cursor-pointer transition-all duration-300"
            style={{
              border: isDragging
                ? '2px dashed #4f8ef7'
                : '2px dashed rgba(255, 255, 255, 0.2)',
              background: isDragging
                ? 'rgba(79, 142, 247, 0.05)'
                : 'rgba(255, 255, 255, 0.02)',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(79, 142, 247, 0.1)',
                  border: '2px solid rgba(79, 142, 247, 0.3)',
                }}
              >
                <Upload size={36} color="#4f8ef7" strokeWidth={2} />
              </div>

              <h3
                className="mb-3"
                style={{
                  color: '#e8e8f0',
                  fontSize: '1.375rem',
                  fontWeight: 600,
                }}
              >
                Drop your night sky photo here
              </h3>

              <p
                style={{
                  color: '#9999b3',
                  fontSize: '1rem',
                }}
              >
                or click to browse files
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={handleReset}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <X size={20} color="#e8e8f0" />
              </button>

              <img
                src={previewUrl}
                alt="Night sky"
                className="w-full h-auto max-h-96 object-cover"
              />

              {result && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                >
                  <line
                    x1="30%"
                    y1="40%"
                    x2="45%"
                    y2="35%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1="45%"
                    y1="35%"
                    x2="55%"
                    y2="30%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1="55%"
                    y1="30%"
                    x2="70%"
                    y2="40%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1="45%"
                    y1="35%"
                    x2="50%"
                    y2="50%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1="50%"
                    y1="50%"
                    x2="40%"
                    y2="70%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1="50%"
                    y1="50%"
                    x2="60%"
                    y2="70%"
                    stroke="#4f8ef7"
                    strokeWidth="2"
                    opacity="0.7"
                  />

                  <circle cx="30%" cy="40%" r="4" fill="#e8e8f0" />
                  <circle cx="45%" cy="35%" r="3" fill="#e8e8f0" />
                  <circle cx="55%" cy="30%" r="3" fill="#e8e8f0" />
                  <circle cx="70%" cy="40%" r="3" fill="#e8e8f0" />
                  <circle cx="50%" cy="50%" r="4" fill="#4f8ef7" />
                  <circle cx="40%" cy="70%" r="3" fill="#e8e8f0" />
                  <circle cx="60%" cy="70%" r="3" fill="#e8e8f0" />
                </svg>
              )}
            </div>

            {!result && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                className="w-full py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,142,247,0.3)] flex items-center justify-center gap-3"
                style={{
                  background: '#4f8ef7',
                  color: '#e8e8f0',
                  fontWeight: 600,
                  fontSize: '1.0625rem',
                }}
              >
                <Sparkles size={20} />
                Analyze with AI
              </button>
            )}

            {isAnalyzing && (
              <div
                className="p-8 rounded-2xl text-center"
                style={{
                  background: 'rgba(79, 142, 247, 0.05)',
                  border: '1px solid rgba(79, 142, 247, 0.2)',
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Sparkles size={24} color="#4f8ef7" className="animate-pulse" />
                  <p
                    style={{
                      color: '#4f8ef7',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                    }}
                  >
                    Analyzing the stars...
                  </p>
                </div>
                <p style={{ color: '#9999b3', fontSize: '0.9375rem' }}>
                  Our AI is identifying constellations in your photo
                </p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    style={{
                      color: '#e8e8f0',
                      fontSize: '1.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {result.name}
                  </h3>
                  <div
                    className="px-4 py-2 rounded-lg"
                    style={{
                      background: 'rgba(79, 142, 247, 0.15)',
                      border: '1px solid rgba(79, 142, 247, 0.3)',
                    }}
                  >
                    <p
                      style={{
                        color: '#4f8ef7',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      {result.confidence}% confident
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    color: '#9999b3',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                  }}
                >
                  {result.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
