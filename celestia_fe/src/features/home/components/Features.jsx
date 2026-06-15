import { useEffect, useRef } from "react";
import { Telescope, Camera, Star } from "lucide-react";
import CardBoxes from "./CardBoxes";

function Features() {
  const cards = [
    {
      icon: Telescope,
      title: "Learn Constellations",
      description:
        "Browse through 88 official constellations, their mythology, and the stories behind them.",
    },
    {
      icon: Camera,
      title: "Identify from Photos",
      description:
        "Upload a photo of the night sky and let AI identify the constellations for you instantly.",
    },
    {
      icon: Star,
      title: "Explore the Sky",
      description:
        "Discover star maps, mythology, and deep space facts for every constellation.",
    },
  ];
  return (
    <section
      className="py-20 sm:py-32 px-6"
      style={{ background: "transparent" }}
    >
      <CardBoxes
        cards={cards}
        title="Everything you need"
        subtitle="Explore the night sky like never before"
      />
    </section>
  );
}

export default Features;
