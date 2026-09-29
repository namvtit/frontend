import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinPilot — Thị trường tài chính thông minh",
    short_name: "FinPilot",
    description: "Theo dõi thị trường và danh mục đầu tư cùng FinPilot.",
    start_url: "/pwa",
    display: "standalone",
    background_color: "#1b1b1b",
    theme_color: "#1b1b1b",
    icons: [
      { src: "/icons/finpilot-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/finpilot-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
