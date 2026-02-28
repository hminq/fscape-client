import { useState, useRef } from "react";
import { Button } from "@heroui/react";
import { motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import defaultRoomImg from "../../assets/default_room_img.jpg";

const locations = [
  {
    name: "Hà Nội",
    buildings: [
      { label: "Cầu Giấy", price: "2.500.000đ" },
      { label: "Đống Đa", price: "2.200.000đ" },
      { label: "Hai Bà Trưng", price: "2.800.000đ" },
      { label: "Hoàn Kiếm", price: "3.000.000đ" },
      { label: "Thanh Xuân", price: "2.100.000đ" },
      { label: "Ba Đình", price: "2.400.000đ" },
    ],
  },
  {
    name: "TP.HCM",
    buildings: [
      { label: "Quận 1", price: "3.200.000đ" },
      { label: "Quận 7", price: "2.600.000đ" },
      { label: "Thủ Đức", price: "2.000.000đ" },
      { label: "Bình Thạnh", price: "2.300.000đ" },
      { label: "Phú Nhuận", price: "2.500.000đ" },
      { label: "Tân Bình", price: "2.100.000đ" },
    ],
  },
  {
    name: "Đà Nẵng",
    buildings: [
      { label: "Hải Châu", price: "1.900.000đ" },
      { label: "Thanh Khê", price: "1.700.000đ" },
      { label: "Sơn Trà", price: "2.000.000đ" },
      { label: "Ngũ Hành Sơn", price: "1.800.000đ" },
    ],
  },
  {
    name: "Cần Thơ",
    buildings: [
      { label: "Ninh Kiều", price: "1.600.000đ" },
      { label: "Cái Răng", price: "1.500.000đ" },
      { label: "Bình Thủy", price: "1.500.000đ" },
    ],
  },
];

export default function LocationsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const activeLocation = locations[activeIndex];

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Heading */}
        <Motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#011936] leading-tight tracking-tight">
            Phòng sẵn sàng
            <br />
            tại mọi thành phố lớn
          </h2>
          <p className="text-[#465362] text-base md:text-lg mt-4 max-w-lg mx-auto">
            Chúng tôi giúp việc chuyển đến trở nên đơn giản, an toàn và dễ
            dàng.
          </p>
        </Motion.div>

        {/* Location tabs + scroll arrow */}
        <Motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-1 bg-[#011936]/5 rounded-full p-1">
            {locations.map((loc, i) => (
              <button
                key={loc.name}
                onClick={() => setActiveIndex(i)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-[#9FC490] text-[#011936] shadow-md"
                    : "text-[#465362] hover:text-[#011936]"
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[#C0DFA1] hover:bg-[#9FC490] text-[#011936] transition-colors shadow-md"
            aria-label="Cuộn sang phải"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </Motion.div>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        >
          {activeLocation.buildings.map((building, i) => (
            <Motion.div
              key={building.label}
              className="snap-start shrink-0 w-[280px] md:w-[320px] lg:w-[360px] group"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {/* Card — image fills entire area, panel overlays from bottom */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer">
                <img
                  src={defaultRoomImg}
                  alt={`FScape ${building.label}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Panel — anchored to bottom, slides up on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#011936] px-5 pt-4 pb-4 transition-all duration-300">
                  {/* Name */}
                  <p className="leading-tight">
                    <span className="font-display text-xl md:text-2xl text-[#C0DFA1] tracking-wider">
                      FSCAPE
                    </span>
                    <span className="text-lg md:text-xl font-bold text-white ml-1.5">
                      {building.label.toUpperCase()}
                    </span>
                  </p>

                  {/* Price */}
                  <p className="text-white/60 text-sm mt-1.5">
                    Phòng từ {building.price}/tháng
                  </p>

                  {/* Hover-reveal buttons — grows upward */}
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
                    <div className="overflow-hidden">
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="bordered"
                          radius="full"
                          size="sm"
                          className="border-white/60 text-white font-semibold text-xs px-5 h-9 hover:bg-white hover:text-[#011936]"
                        >
                          Khám phá
                        </Button>
                        <Button
                          radius="full"
                          size="sm"
                          className="bg-[#9FC490] text-[#011936] font-semibold text-xs px-5 h-9 hover:bg-[#C0DFA1]"
                        >
                          Đặt phòng
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>

        {/* View more button */}
        <Motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            variant="bordered"
            radius="full"
            size="lg"
            endContent={<ArrowRight className="w-4 h-4" />}
            className="border-[#011936] text-[#011936] font-semibold text-sm px-8 h-12 hover:bg-[#011936] hover:text-white transition-colors"
          >
            Xem tất cả tại {activeLocation.name}
          </Button>
        </Motion.div>
      </div>
    </section>
  );
}
