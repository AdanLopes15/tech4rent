// src/pages/Index.tsx

import { useEffect, useMemo } from "react";
import { useStore } from "@/store";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsBarSection from "@/components/landing/BenefitsBarSection";
import EquipmentSection from "@/components/landing/EquipmentSection";
import PresenceSection from "@/components/landing/PresenceSection";
import ResultsSection from "@/components/landing/ResultsSection";
import VideoShowcaseSection from "@/components/landing/VideoShowcaseSection";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import { renderBlock } from "@/lib/site-builder/registry";
import type { Block, PageSeo } from "@/lib/site-builder/types";
import PageSeoHead from "@/components/site-builder/PageSeoHead";

const Index = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const homePage = useStore((s) => s.homePage);
  const sitePages = useStore((s) => s.sitePages);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const publishedBlocks = useMemo<Block[]>(() => (homePage?.published || []) as Block[], [homePage?.published]);
  const usePublished = publishedBlocks.length > 0;
  const seo = (sitePages?.home?.seo as PageSeo) || {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeoHead
        seo={seo}
        fallbackTitle="TECH4RENT — Equipamentos para sua operação"
        fallbackDescription="Locação e venda de equipamentos profissionais para logística, varejo e indústria."
      />
      <Navbar />
      <main>
        {usePublished ? (
          publishedBlocks.filter((b) => b.visible !== false).map((b) => <div key={b.id}>{renderBlock(b)}</div>)
        ) : (
          <>
            <HeroSection />
            <EquipmentSection />
            <PresenceSection />
            <ResultsSection />
          </>
        )}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
