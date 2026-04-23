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
import { renderBlock } from "@/lib/site-builder/registry";
import type { Block } from "@/lib/site-builder/types";

const Index = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const homePage = useStore((s) => s.homePage);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const publishedBlocks = useMemo<Block[]>(() => (homePage?.published || []) as Block[], [homePage?.published]);
  const usePublished = publishedBlocks.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {usePublished ? (
          publishedBlocks.filter((b) => b.visible !== false).map((b) => <div key={b.id}>{renderBlock(b)}</div>)
        ) : (
          <>
            <HeroSection />
            <BenefitsBarSection />
            <EquipmentSection />
            <PresenceSection />
            <ResultsSection />
            <VideoShowcaseSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
