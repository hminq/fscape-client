import AppNavbar from "../components/layout/AppNavbar";
import AnnouncementBar from "../components/layout/AnnouncementBar";
import HeroSection from "../components/home/HeroSection";
import LocationsSection from "../components/home/LocationsSection";
import WhyChooseSection from "../components/home/WhyChooseSection";
import Footer from "../components/layout/Footer";
import { LocationsProvider } from "../contexts/LocationsContext";

export default function HomePage() {
  return (
    <LocationsProvider>
      <div className="min-h-screen">
        <AppNavbar />
        <AnnouncementBar />
        <HeroSection />
        <div className="relative z-10 bg-white">
          <LocationsSection />
        </div>
        <WhyChooseSection />
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </LocationsProvider>
  );
}
