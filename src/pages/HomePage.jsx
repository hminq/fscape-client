import AppNavbar from "../components/layout/AppNavbar";
import AnnouncementBar from "../components/layout/AnnouncementBar";
import HeroSection from "../components/home/HeroSection";
import LocationsSection from "../components/home/LocationsSection";
import WhyChooseSection from "../components/home/WhyChooseSection";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <AnnouncementBar />
      <HeroSection />
      {/* Sections with solid bg sit above the sticky WhyChoose image */}
      <div className="relative z-10 bg-white">
        <LocationsSection />
      </div>
      <WhyChooseSection />
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
