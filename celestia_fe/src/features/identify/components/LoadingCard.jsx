function LoadingCard({ label }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "1.5rem",
        padding: "clamp(1.25rem, 4vw, 2rem)",
        color: "#ffffff",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "#9999b3",
          textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#4a90d9",
            animation: "spin 0.9s linear infinite",
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              color: "#c4c4d8",
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              marginBottom: "0.25rem",
            }}
          >
            Analyzing your image...
          </p>
          {label === "Astrometry.net" && (
            <p style={{ color: "#9999b3", fontSize: "0.8rem" }}>
              This can take up to 2 minutes — plate solving in progress
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadingCard;
