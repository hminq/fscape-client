import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { socials } from "@/components/icons/SocialIcons";
import fscapeLogoFull from "../../assets/fscape-logo-full.svg";
import defaultAvatar from "../../assets/default_room_img.jpg";

const navLinks = [
  { label: "Hồ sơ của tôi", path: "/profile" },
  { label: "Phòng của tôi", path: "/my-rooms" },
  { label: "Đơn đặt phòng", path: "/my-bookings" },
  { label: "Hóa đơn", path: "/my-invoices" },
  { label: "Hợp đồng", path: "/my-contracts" },
];

export default function UserDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] bg-primary text-white flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <img src={fscapeLogoFull} alt="FScape" className="h-10" />
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-white/10">
          <img
            src={user?.avatar_url || defaultAvatar}
            alt="Avatar"
            className="size-14 rounded-full border-2 border-olive object-cover bg-white"
          />
          <div className="min-w-0">
            <p className="font-bold text-base truncate">
              {user?.full_name || user?.email || "Sinh viên FScape"}
            </p>
            {user?.full_name && user?.email && (
              <p className="text-sm text-white/50 truncate">{user.email}</p>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-8 py-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <button
                  onClick={() => handleNav(link.path)}
                  className="w-full text-left text-base font-semibold text-olive hover:text-white py-2.5 transition-colors"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* QR Section */}
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-white/10 px-5 py-4">
            <QrCode className="size-10 text-olive shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold">Tải ứng dụng Android</p>
              <p className="text-xs text-white/50">Quét mã QR để tải về</p>
            </div>
          </div>
        </nav>

        {/* Footer — socials + logout */}
        <div className="px-8 pb-8 pt-4 border-t border-white/10">
          <p className="text-sm font-semibold text-white/80 mb-3">
            Các nền tảng MXH của chúng tôi
          </p>
          <div className="flex items-center gap-3 mb-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-10 rounded-full border border-white/20 text-white/60 hover:bg-olive hover:border-olive hover:text-primary transition-colors"
              >
                <s.icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full rounded-full border border-white/40 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
