import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getHistoryById } from "./api";
import { useHistoryDetail } from "./hooks/useHistoryDetail";
import GnnCard from "./components/GnnCard";
import AstrometryCard from "./components/AstrometryCard";

function HistoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { entry, loading } = useHistoryDetail(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#9999b3" }}>Loading...</p>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-24 sm:py-32">
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {}
        <button
          onClick={() => navigate("/profile")}
          style={{
            background: "transparent",
            border: "none",
            color: "#9999b3",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: 0,
          }}
        >
          ← Back to profile
        </button>

        {}
        {entry.imageName && (
          <img
            src={entry.imageName}
            alt="constellation"
            style={{
              width: "100%",
              borderRadius: "1.25rem",
              marginBottom: "2rem",
              border: "1px solid rgba(255,255,255,0.08)",
              objectFit: "cover",
              maxHeight: "360px",
            }}
          />
        )}

        {}
        <p
          style={{
            color: "#9999b3",
            fontSize: "0.85rem",
            marginBottom: "2rem",
          }}
        >
          {new Date(entry.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        {}
        {entry.gnn && <GnnCard entry={entry} />}

        {}
        {entry.astrometry && <AstrometryCard data={entry.astrometry} />}
      </div>
    </div>
  );
}

export default HistoryDetail;
