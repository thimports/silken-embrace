import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { track } from "@/hooks/use-tracking";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { ProductSection } from "@/components/site/ProductSection";
import { Benefits } from "@/components/site/Benefits";
import { Comparison } from "@/components/site/Comparison";
import { Lookbook } from "@/components/site/Lookbook";
import { Testimonials } from "@/components/site/Testimonials";
import { Faq } from "@/components/site/Faq";

import { Footer } from "@/components/site/Footer";
import { MobileBuyBar } from "@/components/site/MobileBuyBar";
import lcpImage from "@/assets/product-lifestyle.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "2 Meia-Calça Forrada Térmica Translúcida Plus · Lumière" },
      {
        name: "description",
        content:
          "2 meias-calças forradas com lã peluciada, translúcida e modeladora. Conforto térmico premium, elegância europeia. Frete rápido e garantia.",
      },
      { property: "og:title", content: "2 Meia-Calça Forrada Térmica Translúcida · Lumière" },
      { property: "og:description", content: "Aqueça seus dias frios com elegância. Coleção Hiver '26." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap",
      },
      { rel: "preload", as: "image", href: lcpImage, fetchpriority: "high" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => { track("product_view"); }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24 lg:pb-0">
        <ProductSection />
        <Benefits />
        <Comparison />
        <Lookbook />
        <Testimonials />
        <Faq />
        
      </main>
      <Footer />
      <MobileBuyBar />
    </div>
  );
}
