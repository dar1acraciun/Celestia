import { useEffect, useRef } from "react";
import { MapPin, ZoomIn, Star, Telescope } from "lucide-react";
import CardBoxes from "./CardBoxes";

const cards = [
  {
    icon: MapPin,
    title: "Location-Accurate",
    description:
      "Uses your GPS to render the exact sky above you, updated in real time based on your coordinates.",
  },
  {
    icon: Star,
    title: "True Star Colors",
    description:
      "Thousands of stars displayed with their real spectral colors — from blue giants to red dwarfs.",
  },
  {
    icon: Telescope,
    title: "Constellation Lines",
    description:
      "All 88 official constellations drawn with labels. Hover over any star for its name and magnitude.",
  },
  {
    icon: ZoomIn,
    title: "Fully Interactive",
    description:
      "Drag to rotate your view across the sky. Scroll to zoom in on any region you want to explore.",
  },
];

export default function SkyMapSection() {
  return (
    <section
      className="py-20 sm:py-32 px-6"
      style={{ background: "transparent" }}
    >
      <div className="max-w-6xl mx-auto">
        <CardBoxes
          cards={cards}
          title="Your Personal Sky Map"
          subtitle="Explore the night sky like never before"
          cols={4}
        />
      </div>
    </section>
  );
}
