import { Megaphone } from "lucide-react";

const message = "PHÒNG CUỐI CÙNG - ĐỪNG BỎ LỠ!";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#465362] text-white overflow-hidden py-3">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 20s linear infinite" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="flex items-center gap-3 mx-10 text-base font-semibold tracking-wide">
            <Megaphone className="w-6 h-6 shrink-0 text-[#C0DFA1]" />
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
