import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ConectaInsumos",
    short_name: "ConectaInsumos",
    description:
      "Plataforma comercial para insumos, matérias-primas e produtos químicos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#0070c4",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Cotações",
        url: "/cotacoes",
        description: "Nova proposta comercial",
      },
      {
        name: "Clientes",
        url: "/clientes",
      },
      {
        name: "Pedidos",
        url: "/pedidos",
      },
    ],
  };
}
