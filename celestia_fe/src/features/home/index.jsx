import { Link } from "react-router-dom";
import logo from "../../assets/fullLogo.png";
import Features from "./components/Features";
import SkyMapSection from "./components/SkyMapSection";
import HowItWorks from "./components/HowItWorks";
import CallToAction from "./components/CallToAction";

function Home() {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <img
            src={logo}
            alt="Celestia"
            className="mb-2 mx-auto w-56 h-56 sm:w-[350px] sm:h-[350px] -mb-20 sm:-mb-[140px]"
            style={{ objectFit: "contain" }}
          />

          <p
            className="mb-6 max-w-2xl mx-auto"
            style={{
              fontSize: "clamp(1.125rem, 2vw, 1.5rem)",
              color: "#9999b3",
              lineHeight: 1.6,
              fontStyle: "italic",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Learn and identify constellations with AI
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/skymap"
              className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: "#0d2857",
                color: "#e8e8f0",
                fontWeight: 600,
                fontSize: "1.0625rem",
              }}
            >
              Start Learning
            </Link>

            <Link
              to="/identify"
              className="px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                color: "#e8e8f0",
                fontWeight: 600,
                fontSize: "1.0625rem",
              }}
            >
              Try Identifying
            </Link>
          </div>
        </div>
      </section>
      <Features />
      <HowItWorks />
      <SkyMapSection />
      <CallToAction />
    </>
  );
}

export default Home;
