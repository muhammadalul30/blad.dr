import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Genitourinaria",
    short_name: "Genitourinaria",
    description: "Catatan berkemih, hidrasi, dan IPSS pribadi.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f4f0",
    theme_color: "#1c4f6e",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
