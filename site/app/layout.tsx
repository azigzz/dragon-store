import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dragon-store.vercel.app";
const title = process.env.DRAGON_STORE_NAME || "Dragon Store";
const description = process.env.STORE_HERO_TEXT || "Produtos digitais com compra rapida pelo Discord.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${title} | Loja digital pelo Discord`,
    template: `%s | ${title}`
  },
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    images: [{ url: "/dragon-store-hero.png", width: 1792, height: 1024 }],
    locale: "pt_BR",
    type: "website"
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
