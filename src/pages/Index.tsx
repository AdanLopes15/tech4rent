//src/pages/Index.tsx

import { useEffect } from "react";
import { useStore } from "@/store";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturedProductSection from "@/components/landing/FeaturedProductSection";
import EquipmentSection from "@/components/landing/EquipmentSection";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
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
        <FeaturedProductSection />
        <EquipmentSection />
        <DifferentialsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
