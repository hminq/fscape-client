import { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Home, Users, Lock, ArrowLeft } from "lucide-react";
import fscapeLogo from "../../assets/fscape-logo.svg";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";

const features = [
  { icon: Home, title: "Quản Lý Phòng Dễ Dàng", desc: "Tìm kiếm, đặt phòng và quản lý nhà ở sinh viên mọi lúc, mọi nơi" },
  { icon: Users, title: "Kết Nối Bạn Cùng Phòng", desc: "Trò chuyện với bạn cùng phòng tiềm năng và xây dựng cộng đồng" },
  { icon: Lock, title: "Thanh Toán An Toàn", desc: "Xử lý tiền thuê và tiền đặt cọc an toàn thông qua nền tảng" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#011936] via-[#011936]/95 to-[#465362]">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col flex-1 max-w-xl p-12 gap-8 justify-center">
        <Motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold mb-6 transition-colors">
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <img src={fscapeLogo} alt="FScape" className="w-14 h-14" />
            <span className="text-4xl text-white font-display tracking-wide">FSCAPE</span>
          </div>
          <p className="text-lg text-[#C0DFA1] leading-relaxed">
            Nền tảng hiện đại để quản lý<br />nhà ở sinh viên một cách liền mạch.
          </p>
        </Motion.div>

        <Motion.div
          className="rounded-2xl overflow-hidden shadow-2xl"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80"
            alt="Student accommodation"
            className="w-full h-52 object-cover"
          />
        </Motion.div>

        <Motion.div className="flex flex-col gap-3" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#9FC490] shrink-0">
                <f.icon className="size-5 text-[#011936]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </Motion.div>

        <Motion.div className="flex items-center gap-7 flex-wrap" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <div className="flex items-center">
            <div className="flex -space-x-2.5">
              {["#9FC490", "#82A3A1", "#C0DFA1", "#465362"].map((bg, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#011936] flex items-center justify-center text-xs font-bold text-white" style={{ background: bg }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-white">10,000+</p>
              <p className="text-[11px] text-white/40">sinh viên đã tham gia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-white">4.8/5</p>
              <p className="text-[11px] text-white/40">2,500+ nhận xét</p>
            </div>
          </div>
        </Motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <Motion.div
          className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
            <img src={fscapeLogo} alt="FScape" className="w-10 h-10" />
            <span className="text-2xl text-[#011936] font-display tracking-wide">FSCAPE</span>
          </div>

          <h2 className="text-center text-2xl font-bold text-[#011936] mb-1">
            Chào mừng đến FScape
          </h2>
          <p className="text-center text-sm text-[#82A3A1] mb-6">
            Người bạn đồng hành nhà ở sinh viên của bạn
          </p>

          {/* Tab switcher */}
          <div className="flex bg-[#011936]/5 rounded-xl p-1 gap-1 mb-6">
            {[
              { key: "login", label: "Đăng Nhập" },
              { key: "signup", label: "Đăng Ký" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-[#011936] shadow-md"
                    : "text-[#82A3A1] hover:text-[#465362]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "login" ? <LoginForm /> : <SignUpForm />}

          {/* Badges */}
          <div className="flex justify-center gap-6 mt-7 flex-wrap">
            {[
              { icon: "🎓", label: "Xác Nhận Sinh Viên" },
              { icon: "🛡️", label: "Nền Tảng An Toàn" },
              { icon: "👥", label: "10K+ Người Dùng" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-xl">{b.icon}</span>
                <span className="text-[11px] text-[#82A3A1] font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
