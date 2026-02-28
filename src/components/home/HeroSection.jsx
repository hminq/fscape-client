import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { motion as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import slide1 from "../../assets/slideshow/slideshow_1.webp";
import slide2 from "../../assets/slideshow/slideshow_2.jpg";
import slide3 from "../../assets/slideshow/slideshow_3.jpg";
import slide4 from "../../assets/slideshow/slideshow_4.webp";

const slides = [slide1, slide2, slide3, slide4];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Slideshow background */}
      {slides.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url('${src}')`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Dark scrim */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-20 md:pb-28">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl bg-primary/60 backdrop-blur-sm rounded-2xl p-8 md:p-10">
            <Motion.p
              className="text-tea text-sm font-semibold tracking-widest uppercase mb-3"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              Nơi ở cho sinh viên tại Việt Nam
            </Motion.p>

            <Motion.h1
              className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              BẠN PHẢI
              <br />
              Ở ĐÂY MỚI HIỂU
            </Motion.h1>

            <Motion.p
              className="text-white/80 text-base md:text-lg mb-8 max-w-lg"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              Hãy trải nghiệm. Đừng bỏ lỡ. Đặt phòng ngay.
            </Motion.p>

            <Motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              <Button
                radius="full"
                size="lg"
                endContent={<ArrowRight className="w-5 h-5" />}
                className="bg-olive text-primary font-bold text-base px-10 h-12"
              >
                Khám phá ngay
              </Button>
            </Motion.div>
          </div>

          {/* Slide indicators */}
          <Motion.div
            className="flex gap-2 mt-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === current
                    ? "w-8 bg-olive"
                    : "w-4 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </Motion.div>
        </div>
      </div>
    </section>
  );
}
