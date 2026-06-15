function Section({ label, children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.25rem",
        marginBottom: "1rem",
      }}
    >
      <p
        style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "#9999b3",
          textTransform: "uppercase",
          marginBottom: "0.85rem",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
export default Section;
