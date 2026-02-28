import { Phone, Mail } from "lucide-react";
import fscapeLogo from "../../assets/fscape-logo.svg";

const locationBuildings = [
  {
    city: "Hà Nội",
    buildings: [
      "FScape Cầu Giấy",
      "FScape Đống Đa",
      "FScape Hai Bà Trưng",
      "FScape Hoàn Kiếm",
      "FScape Thanh Xuân",
      "FScape Ba Đình",
    ],
  },
  {
    city: "TP.HCM",
    buildings: [
      "FScape Quận 1",
      "FScape Quận 7",
      "FScape Thủ Đức",
      "FScape Bình Thạnh",
      "FScape Phú Nhuận",
      "FScape Tân Bình",
    ],
  },
  {
    city: "Đà Nẵng",
    buildings: [
      "FScape Hải Châu",
      "FScape Thanh Khê",
      "FScape Sơn Trà",
      "FScape Ngũ Hành Sơn",
    ],
  },
];

function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function GmailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

const socials = [
  { icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com/hminq" },
  { icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com/toilam0nesy/" },
  { icon: GmailIcon, label: "Email", href: "mailto:hminh250104@gmail.com" },
];

export default function Footer() {
  return (
    <footer className="bg-[#011936] text-white">
      {/* Top section — Brand + links + socials */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-14 md:pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand + socials */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <img src={fscapeLogo} alt="FScape" className="w-10 h-10" />
              <span className="text-2xl text-white font-display tracking-wide leading-none translate-y-px">
                FSCAPE
              </span>
            </a>

            <p className="text-sm font-semibold text-white/80 mb-3">
              Theo dõi chúng tôi
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white/60 hover:bg-[#9FC490] hover:border-[#9FC490] hover:text-[#011936] transition-colors"
                >
                  <s.icon className="w-4.5 h-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div>
            <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-4">
              Về FScape
            </p>
            <ul className="flex flex-col gap-2.5">
              {["Giới thiệu", "Đội ngũ", "Tuyển dụng", "Đối tác đại học", "Tìm phòng"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-4">
              Hỗ trợ
            </p>
            <ul className="flex flex-col gap-2.5">
              {["Câu hỏi thường gặp", "Hướng dẫn đặt phòng", "Chính sách hoàn tiền", "Ưu đãi hiện tại"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-4">
              Liên hệ
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href="tel:+84852325683" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#9FC490] shrink-0" />
                  +84 852 325 683
                </a>
              </li>
              <li>
                <a href="mailto:hminh250104@gmail.com" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#9FC490] shrink-0" />
                  hminh250104@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="border-t border-white/10" />
      </div>

      {/* Bottom section — Location buildings grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-8">
          {locationBuildings.slice(0, 4).map((loc) => (
            <div key={loc.city}>
              <p className="inline-block text-sm font-bold uppercase tracking-wider text-[#011936] bg-[#9FC490] px-2 py-0.5 mb-5">
                {loc.city}
              </p>
              <ul className="flex flex-col gap-2.5">
                {loc.buildings.slice(0, 5).map((b) => (
                  <li key={b}>
                    <a
                      href="#"
                      className="nav-underline inline-block text-sm text-white/50 hover:text-white pb-0.5 transition-colors"
                    >
                      {b}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © 2026 FScape. Mọi quyền được bảo lưu.
          </p>
          <div className="flex gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
