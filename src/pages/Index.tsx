import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import EquipmentSection from "@/components/landing/EquipmentSection";
import DifferentialsSection from "@/components/landing/DifferentialsSection";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <EquipmentSection />
    <DifferentialsSection />
    <AboutSection />
    <ContactSection />
    <Footer />
  </div>
);

export default Index;
