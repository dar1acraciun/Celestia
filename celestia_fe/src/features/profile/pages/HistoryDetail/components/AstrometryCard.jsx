function AstrometryCard({ data }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.5rem",
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
        Astrometry.net
      </p>
      {entry.astrometry.constellation ? (
        <>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "2rem",
              color: "#e8e8f0",
              marginBottom: "0.5rem",
            }}
          >
            {entry.astrometry.constellation}
          </h2>
          {entry.astrometry.objects_in_field?.length > 0 && (
            <>
              <p
                style={{
                  color: "#c4c4d8",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                Objects in field:
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
                {entry.astrometry.objects_in_field.map((obj) => (
                  <li
                    key={obj}
                    style={{ color: "#9999b3", fontSize: "0.9rem" }}
                  >
                    {obj}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p style={{ color: "#f87171" }}>Astrometry.net job failed</p>
      )}
    </div>
  );
}
export default AstrometryCard;
