import { useEffect, useRef } from "react";
import { Telescope, Camera, Star } from "lucide-react";

function FadeBox({ children, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, delay);
        } else {
          el.style.opacity = "0";
          el.style.transform = "translateY(30px)";
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

function CardBoxes({ cards, title, subtitle, cols = 3 }) {
  return (
    <section
      className="py-20 sm:py-32 px-6"
      style={{ background: "transparent" }}
    >
      <div className="max-w-6xl mx-auto">
        <FadeBox>
          <div className="mb-12 sm:mb-20 text-center">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#e8e8f0",
                marginBottom: "1rem",
              }}
            >
              {title}
            </h2>
            <p style={{ color: "#9999b3", fontSize: "1.1rem" }}>{subtitle}</p>
          </div>
        </FadeBox>

        <div
          className={`grid grid-cols-1 gap-8 items-stretch ${cols === 4 ? "md:grid-cols-4" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}
        >
          {cards.map(({ icon: Icon, title, description }, i) => (
            <FadeBox key={title} delay={i * 150}>
              <div
                className="p-6 sm:p-8 rounded-2xl h-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Icon size={36} color="#4f8ef7" className="mb-4" />
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#e8e8f0",
                    fontSize: "1.3rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {title}
                </h3>
                <p style={{ color: "#9999b3", lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>
            </FadeBox>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CardBoxes;
