import AppNavbar from "../components/layout/AppNavbar";
import AnnouncementBar from "../components/layout/AnnouncementBar";
import HeroSection from "../components/home/HeroSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <AppNavbar />
      <AnnouncementBar />
      <HeroSection />
    </div>
  );
}
