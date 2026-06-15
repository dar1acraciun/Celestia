function GnnCard({ entry }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "#9999b3",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}
      >
        GNN Model
      </p>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          color: "#e8e8f0",
          marginBottom: "0.5rem",
        }}
      >
        {entry.gnn?.constellation}
      </h2>
      <p style={{ color: "#9999b3", marginBottom: "1rem" }}>
        Confidence: {((entry.gnn?.confidence || 0) * 100).toFixed(1)}%
      </p>
      {entry.gnn?.top5?.length > 0 && (
        <>
          <p
            style={{
              color: "#c4c4d8",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            Top 5:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {entry.gnn.top5.map((item) => (
              <li
                key={item.name}
                style={{ color: "#9999b3", fontSize: "0.9rem" }}
              >
                {item.name} — {((item.confidence || 0) * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
export default GnnCard;
