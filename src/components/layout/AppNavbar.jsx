import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { useLocations } from "@/contexts/LocationsContext";
import fscapeLogo from "../../assets/fscape-logo.svg";
import defaultAvatar from "../../assets/default_room_img.jpg";

function TriangleIcon({ up, className }) {
  return (
    <svg
      viewBox="0 0 10 6"
      className={className}
      style={{
        transform: up ? "rotate(180deg)" : undefined,
        transition: "transform 0.2s ease",
      }}
    >
      <path d="M0 0L5 6L10 0H0Z" fill="currentColor" />
    </svg>
  );
}

export default function AppNavbar() {
  const { locations } = useLocations();
  const [openLocId, setOpenLocId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const navRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!openLocId) return;
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenLocId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openLocId]);

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 60;
      setScrolled(isScrolled);
      if (isScrolled) setOpenLocId(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onStorage = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", onStorage);
    onStorage();
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeLoc = locations.find((l) => l.id === openLocId);
  const handleBuildingSelect = (buildingId) => {
    setOpenLocId(null);
    navigate(`/buildings/${buildingId}`);
  };

  return (
    <div ref={navRef} className="sticky top-0 z-50">
      <nav className="bg-primary">
        <div
          className={`flex items-center px-5 md:px-10 py-3 transition-all duration-500 ${
            scrolled ? "justify-center" : ""
          }`}
        >
          {/* Left group */}
          <div
            className={`flex items-center gap-6 transition-all duration-500 ${
              scrolled ? "flex-none" : "flex-1 min-w-0"
            }`}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src={fscapeLogo} alt="FScape" className="w-12 h-12" />
              <span className="text-3xl text-white font-display tracking-wide leading-none translate-y-px">
                FSCAPE
              </span>
            </Link>

            {/* Locations — hidden when scrolled */}
            <div
              className={`hidden lg:flex items-center gap-1 transition-all duration-500 ${
                scrolled
                  ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                  : "opacity-100 max-w-2xl"
              }`}
            >
              {locations.map((loc) => {
                const isActive = openLocId === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setOpenLocId(isActive ? null : loc.id)}
                    className={`nav-underline flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide px-3 pb-1 pt-0.5 transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {loc.name}
                    <TriangleIcon
                      up={isActive}
                      className="w-2.5 h-2.5 text-olive"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right group — hidden when scrolled */}
          <div
            className={`flex items-center gap-3 shrink-0 transition-all duration-500 ${
              scrolled
                ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                : "opacity-100 max-w-xs"
            }`}
          >
            <Button
              radius="full"
              className="bg-olive text-primary font-semibold text-sm px-6 h-10"
            >
              Đặt phòng
            </Button>
            {isLoggedIn ? (
              <img
                src={defaultAvatar}
                alt="User avatar"
                className="h-10 w-10 rounded-full border border-white/60 object-cover"
              />
            ) : (
              <Button
                variant="bordered"
                radius="full"
                className="border-white/60 text-white font-semibold text-sm px-6 h-10"
                onPress={() => navigate("/login")}
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mega-menu */}
      {activeLoc && (
        <div className="bg-primary border-t border-white/10">
          <div className="max-w-6xl mx-auto px-10 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Buildings */}
              <div className="md:col-span-2">
                <p className="inline-block text-sm font-bold uppercase tracking-wider text-primary bg-olive px-2 py-0.5 mb-5">
                  FSCAPE {activeLoc.name.toUpperCase()}
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 justify-items-start">
                  {(activeLoc.buildings || []).slice(0, 5).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBuildingSelect(b.id)}
                      className="w-fit text-left text-white/75 hover:text-white text-sm transition-colors"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Universities */}
              <div>
                <p className="inline-block text-sm font-bold uppercase tracking-wider text-primary bg-olive px-2 py-0.5 mb-5">
                  TRƯỜNG ĐẠI HỌC TẠI {activeLoc.name.toUpperCase()}
                </p>
                <div className="flex flex-col gap-3">
                  {(activeLoc.universities || []).slice(0, 5).map((u) => (
                    <a
                      key={u.id}
                      href="#"
                      className="text-white/75 hover:text-white text-sm transition-colors"
                    >
                      {u.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                variant="bordered"
                radius="full"
                className="border-white/60 text-white font-semibold uppercase text-sm px-8 h-10"
              >
                Xem tất cả tại {activeLoc.name}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
