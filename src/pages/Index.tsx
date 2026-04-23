//src/pages/Index.tsx

import { useEffect } from "react";
import { useStore } from "@/store";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsBarSection from "@/components/landing/BenefitsBarSection";
import EquipmentSection from "@/components/landing/EquipmentSection";
import PresenceSection from "@/components/landing/PresenceSection";
import ResultsSection from "@/components/landing/ResultsSection";
import VideoShowcaseSection from "@/components/landing/VideoShowcaseSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsBarSection />
        <EquipmentSection />
        <PresenceSection />
        <ResultsSection />
        <VideoShowcaseSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
