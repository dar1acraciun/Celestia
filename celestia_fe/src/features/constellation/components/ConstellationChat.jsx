import { useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useChat } from "../hooks/useChat";

export default function ConstellationChat({ constellationName, onClose }) {
  const { messages, input, setInput, loading, send, onKey, handleClose } = useChat(constellationName, onClose)
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "min(420px, calc(100vw - 2rem))",
          height: "min(560px, calc(100vh - 4rem))",
          background: "rgba(10, 14, 28, 0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1.25rem",
          display: "flex",
          flexDirection: "column",
          zIndex: 101,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Sparkles size={16} style={{ color: "#4a90d9" }} />
            <span
              style={{ color: "#e8e8f0", fontWeight: 600, fontSize: "0.95rem" }}
            >
              Ask about {constellationName}
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#9999b3",
              padding: "0.2rem",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "0.65rem 0.95rem",
                  borderRadius:
                    msg.role === "user"
                      ? "1rem 1rem 0.2rem 1rem"
                      : "1rem 1rem 1rem 0.2rem",
                  background:
                    msg.role === "user"
                      ? "rgba(74, 144, 217, 0.25)"
                      : "rgba(255,255,255,0.06)",
                  border:
                    msg.role === "user"
                      ? "1px solid rgba(74,144,217,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: "#e8e8f0",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "0.65rem 0.95rem",
                  borderRadius: "1rem 1rem 1rem 0.2rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#9999b3",
                      animation: "bounce 1.2s infinite",
                      animationDelay: `${d * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "0.85rem",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything..."
            rows={1}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "0.6rem 0.85rem",
              color: "#e8e8f0",
              fontSize: "0.875rem",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              background:
                input.trim() && !loading ? "#4a90d9" : "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0 1rem",
              cursor: input.trim() && !loading ? "pointer" : "default",
              color: input.trim() && !loading ? "#fff" : "#9999b3",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}
