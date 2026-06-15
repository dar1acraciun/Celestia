import { useEffect, useState } from "react";

function ConstellationImageToggle({ imageUrl, imageUrlNoLines, name }) {
  const [showLines, setShowLines] = useState(true);
  if (!imageUrl && !imageUrlNoLines) return null;
  const src = showLines ? imageUrl : imageUrlNoLines;
  return (
    <div style={{ marginTop: "1rem" }}>
      {imageUrl && imageUrlNoLines && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {[
            { label: "Lines", val: true },
            { label: "No lines", val: false },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setShowLines(val)}
              style={{
                padding: "0.3rem 0.85rem",
                borderRadius: "2rem",
                border: "1px solid",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  showLines === val ? "rgba(74,144,217,0.2)" : "transparent",
                borderColor:
                  showLines === val
                    ? "rgba(74,144,217,0.6)"
                    : "rgba(255,255,255,0.15)",
                color: showLines === val ? "#7ab3e8" : "#9999b3",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={`${name} constellation ${showLines ? "with" : "without"} lines`}
          style={{
            width: "100%",
            borderRadius: "1rem",
            border: "1px solid rgba(255,255,255,0.07)",
            objectFit: "contain",
            background: "#060a12",
          }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
    </div>
  );
}

export default ConstellationImageToggle;
