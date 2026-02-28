import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import fscapeLogo from "../../assets/fscape-logo.svg";

const locations = [
  {
    name: "Hà Nội",
    buildings: [
      "FScape Cầu Giấy",
      "FScape Đống Đa",
      "FScape Hai Bà Trưng",
      "FScape Hoàn Kiếm",
      "FScape Thanh Xuân",
      "FScape Ba Đình",
    ],
    universities: [
      "ĐH Bách khoa Hà Nội",
      "ĐH Quốc gia Hà Nội",
      "ĐH Kinh tế Quốc dân",
      "ĐH Ngoại thương",
      "ĐH FPT Hà Nội",
    ],
  },
  {
    name: "TP.HCM",
    buildings: [
      "FScape Quận 1",
      "FScape Quận 7",
      "FScape Thủ Đức",
      "FScape Bình Thạnh",
      "FScape Phú Nhuận",
      "FScape Tân Bình",
    ],
    universities: [
      "ĐH Bách khoa TP.HCM",
      "ĐH Quốc gia TP.HCM",
      "ĐH Kinh tế TP.HCM",
      "ĐH RMIT Việt Nam",
      "ĐH FPT TP.HCM",
    ],
  },
  {
    name: "Đà Nẵng",
    buildings: [
      "FScape Hải Châu",
      "FScape Thanh Khê",
      "FScape Sơn Trà",
      "FScape Ngũ Hành Sơn",
    ],
    universities: [
      "ĐH Đà Nẵng",
      "ĐH Bách khoa Đà Nẵng",
      "ĐH Kinh tế Đà Nẵng",
      "ĐH FPT Đà Nẵng",
    ],
  },
  {
    name: "Cần Thơ",
    buildings: [
      "FScape Ninh Kiều",
      "FScape Cái Răng",
      "FScape Bình Thủy",
    ],
    universities: [
      "ĐH Cần Thơ",
      "ĐH FPT Cần Thơ",
      "ĐH Y Dược Cần Thơ",
    ],
  },
];

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
  const [openLoc, setOpenLoc] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!openLoc) return;
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenLoc(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openLoc]);

  const activeLoc = locations.find((l) => l.name === openLoc);

  return (
    <div ref={navRef} className="sticky top-0 z-50">
      <nav className="bg-[#011936]">
        <div className="flex items-center px-5 md:px-10 py-3">
          {/* Left group */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0">
              <img src={fscapeLogo} alt="FScape" className="w-12 h-12" />
              <span className="text-3xl text-white font-display tracking-wide">
                FSCAPE
              </span>
            </a>

            {/* Locations */}
            <div className="hidden lg:flex items-center gap-1">
              {locations.map((loc) => {
                const isActive = openLoc === loc.name;
                return (
                  <button
                    key={loc.name}
                    onClick={() => setOpenLoc(isActive ? null : loc.name)}
                    className={`nav-underline flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide px-3 pb-1 pt-0.5 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {loc.name}
                    <TriangleIcon
                      up={isActive}
                      className="w-2.5 h-2.5 text-[#9FC490]"
                    />
                  </button>
                );
              })}
            </div>

            {/* Contact */}
            <a
              href="#"
              className="nav-underline hidden lg:inline-block text-white/75 hover:text-white text-sm font-bold uppercase tracking-wide px-3 pb-1 pt-0.5 transition-colors"
            >
              Liên hệ
            </a>
          </div>

          {/* Right group */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              radius="full"
              className="bg-[#9FC490] text-[#011936] font-semibold text-sm px-6 h-10"
            >
              Đặt phòng
            </Button>
            <Button
              variant="bordered"
              radius="full"
              className="border-white/60 text-white font-semibold text-sm px-6 h-10"
              onPress={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </nav>

      {/* Mega-menu */}
      {activeLoc && (
        <div className="bg-[#011936] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-10 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Buildings */}
              <div className="md:col-span-2">
                <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-5">
                  FSCAPE {activeLoc.name.toUpperCase()}
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {activeLoc.buildings.map((b) => (
                    <a
                      key={b}
                      href="#"
                      className="text-white/75 hover:text-white text-sm transition-colors"
                    >
                      {b}
                    </a>
                  ))}
                </div>
              </div>

              {/* Universities */}
              <div>
                <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-5">
                  TRƯỜNG ĐẠI HỌC TẠI {activeLoc.name.toUpperCase()}
                </p>
                <div className="flex flex-col gap-3">
                  {activeLoc.universities.map((u) => (
                    <a
                      key={u}
                      href="#"
                      className="text-white/75 hover:text-white text-sm transition-colors"
                    >
                      {u}
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
