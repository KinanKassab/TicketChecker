"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import fxiLogo from "../../public/assets/White Logo.png";
import fxiSlogan from "../../public/assets/White Slogan.png";
import styles from "./EventLandingContent.module.css";

type EventLandingContentProps = {
  initialNowMs?: number;
  // Kept for compatibility with current page usage.
  eventConfig?: unknown;
  teamMembers?: unknown[];
  agentCode?: string;
};

const eventConfig = {
  name: "FXI Summit 2026",
  date: "١٥ أبريل ٢٠٢٦",
  targetDate: new Date("2026-04-15T09:00:00"),
  location: "الرياض، المملكة العربية السعودية",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function useCountdown(target: Date, initialNowMs: number) {
  const calc = (nowMs: number) => {
    const diff = Math.max(0, target.getTime() - nowMs);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(() => calc(initialNowMs));
  useEffect(() => {
    setTime(calc(Date.now()));
    const id = setInterval(() => setTime(calc(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const Index = ({
  initialNowMs = Date.now(),
  agentCode,
}: EventLandingContentProps) => {
  const countdown = useCountdown(eventConfig.targetDate, initialNowMs);
  const eventsHref = agentCode ? `/events?ref=${encodeURIComponent(agentCode)}` : "/events";

  return (
    <div dir="rtl" lang="ar" className={`${styles.root} min-h-screen overflow-x-hidden relative font-sans`}>
      {/* Ambient glow orbs floating on gradient */}
      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 opacity-40" style={{ background: "radial-gradient(circle, rgba(180,226,55,0.3), transparent 70%)" }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none z-0 opacity-30" style={{ background: "radial-gradient(circle, rgba(39,170,226,0.4), transparent 70%)" }} />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none z-0 opacity-20" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)" }} />

      <div className="relative z-10">
        {/* Hero */}
        <section className="relative min-h-[92vh] flex items-center justify-center px-6">
          <motion.div
            className="container max-w-4xl mx-auto text-center flex flex-col items-center gap-7 py-24"
            initial="hidden"
            animate="visible"
          >            
            {/* Logo */}
            <motion.div variants={fadeUp} custom={0}>
              <div className="p-3 rounded-3xl inline-block">
                <img
                  src={fxiLogo.src}
                  alt="شعار فريق FXI"
                // add padding
                style={{ 
                  padding: "2rem",
                  borderRadius: "2rem",
                  width: "25rem",
                }}
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Glow separator */}
        <div className="glow-line w-2/3 mx-auto" />
        
        {/* About */}
        <motion.section
          className="container max-w-4xl mx-auto py-20 px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="liquid-glass-strong p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6 liquid-glass-pill">
            <span className="highlight-dot" />
            <h2 className="text-2xl md:text-3xl font-black">من نحن؟</h2>
          </div>

          <p
            className="text-base md:text-lg leading-[1.9]"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <span className="font-bold text-white"> FXI بدأت بسؤال بسيط:</span>{" "}
            كيف يمكن للشباب الطموح أن يجد الطريق الحقيقي للنجاح؟
            <br />
            <br />
            اليوم، <span className="font-bold text-white">FXI</span> ليست مجرد شركة.
            إنها مجتمع يجمع بين الطموح والخبرة.
            <br />
            نحن نربط الشباب الذين يملكون الشغف بأشخاص سبق لهم أن بنوا الطريق.
            <br />
            من خلال إيفنتات مؤثرة، مجتمع فعّال، ومنصة تفتح أبواب العلاقات والفرص.
            <br />
            نساعدك على بناء شبكة قوية وتطوير مهاراتك.
            <br />
            لأن النجاح لا يحدث وحده،
            <br />
            بل يحدث عندما تلتقي الأفكار الطموحة مع الخبرة الصحيحة.
            <br />
            <br />
            <span className="font-bold text-white">
               FXI المكان الذي يبدأ فيه الطريق إلى حلمك.
            </span>
          </p>            
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section
          id="register"
          className="container max-w-4xl mx-auto pb-20 px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="liquid-glass-strong rounded-4xl p-10 md:p-16 text-center"
          >
            <h2 className="text-2xl md:text-4xl font-black mb-4">اطّلع على آخر الأحداث</h2>
            <p className="max-w-lg mx-auto text-base mb-10" style={{ color: "rgba(255,255,255,0.6)" }}>
              تابع آخر فعاليات FXI القادمة، وتعرّف على التفاصيل الكاملة لكل حدث في صفحة الأحداث.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href={eventsHref} className="liquid-glass-button liquid-glass-button-lg inline-flex">
                آخر الأحداث
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Glow separator */}
        <div className="glow-line w-1/2 mx-auto" />

        {/* Footer / Team Slogan */}
        <motion.section
          className="py-14 px-4 sm:py-16 sm:px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} custom={0} className="container text-center">
            <img
              src={fxiSlogan.src}
              alt="شعار فريق FXI"
              className="mx-auto w-full max-w-[280px] sm:max-w-[360px] md:max-w-[460px] lg:max-w-[560px] h-auto opacity-80 object-contain"
            />
          </motion.div>
        </motion.section>

        <div className="glow-line w-1/3 mx-auto mb-12" />
      </div>
    </div>
  );
};

export default Index;
