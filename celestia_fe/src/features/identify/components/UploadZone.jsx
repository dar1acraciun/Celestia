import { useState, useRef } from "react";
import { CloudUpload, Camera } from "lucide-react";

function UploadZone({ onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      onImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-12">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className="cursor-pointer transition-all duration-300"
        style={{
          background: isDragging
            ? "rgba(13, 40, 87, 0.3)"
            : "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: isDragging
            ? "2px dashed #0d2857"
            : "2px dashed rgba(255, 255, 255, 0.2)",
          borderRadius: "1.5rem",
          padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)",
          textAlign: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <CloudUpload
          size={64}
          style={{ color: "#0d2857", margin: "0 auto", marginBottom: "1.5rem" }}
        />

        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: "0.75rem",
          }}
        >
          Drop your photo here
        </h3>

        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255, 255, 255, 0.6)",
            marginBottom: "1.5rem",
          }}
        >
          or click to browse from your device
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              background: "#0d2857",
              color: "#ffffff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Browse Files
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              fontWeight: 600,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              cursor: "pointer",
            }}
          >
            <Camera size={18} />
            Take a Photo
          </button>
        </div>
      </div>

      <p
        className="text-center mt-4"
        style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.4)" }}
      >
        Supported formats: JPG, PNG
      </p>
    </div>
  );
}

export default UploadZone;
