//src/pages/Index.tsx

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import EquipmentSection from "@/components/landing/EquipmentSection";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
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
