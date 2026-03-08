"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Sparkles, ArrowLeft } from "lucide-react";
import RegistrationForm from "@/components/RegistrationForm";
import fxiLogo from "../../public/assets/White Logo.png";
import fxiSlogan from "../../public/assets/White Slogan.png";
import "./EventLandingContent.module.css";

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

  return (
    <div dir="rtl" lang="ar" className="min-h-screen font-tajawal overflow-x-hidden relative">
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
              <div className="liquid-glass p-3 rounded-3xl inline-block">
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
            
            {/* Title */}
            <motion.h1
              variants={fadeUp}
              custom={2}
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08]"
            >
              <span className="gradient-text">{eventConfig.name}</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              custom={3}
              className="max-w-2xl text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              تجربة حدث حديثة تمزج الأفكار والمواهب والابتكار في يوم واحد لا يُنسى — انضم إلينا لتتعلم، تتواصل، وتبني فرص حقيقية.
            </motion.p>

            {/* Countdown */}
            <motion.div variants={fadeUp} custom={4} className="flex gap-3 md:gap-4 mt-2">
              {([
                { label: "يوم", value: countdown.days },
                { label: "ساعة", value: countdown.hours },
                { label: "دقيقة", value: countdown.minutes },
                { label: "ثانية", value: countdown.seconds },
              ] as const).map((unit) => (
                <div key={unit.label} className="liquid-countdown-cell">
                  <span className="text-2xl md:text-4xl font-black tabular-nums" style={{ color: "rgba(255,255,255,0.95)" }}>
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {unit.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Info pills */}
            <motion.div variants={fadeUp} custom={5} className="flex flex-wrap justify-center gap-3 mt-2">
              <div className="liquid-glass-pill text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <Calendar className="w-4 h-4 text-accent" />
                {eventConfig.date}
              </div>
              <div className="liquid-glass-pill text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <MapPin className="w-4 h-4 text-primary" />
                {eventConfig.location}
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              variants={fadeUp}
              custom={6}
              className="mt-4"
            >
              {agentCode ? (
                <RegistrationForm
                  agentCode={agentCode}
                  triggerLabel="احجز مكانك الآن"
                  triggerClassName="liquid-glass-button"
                />
              ) : (
                <a href="#register" className="liquid-glass-button">
                  احجز مكانك الآن
                  <ArrowLeft className="w-4 h-4" />
                </a>
              )}
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
            <div className="flex items-center gap-3 mb-6">
              <span className="highlight-dot" />
              <h2 className="text-2xl md:text-3xl font-black">عن فريق FXI</h2>
            </div>
            <p className="text-base md:text-lg leading-[1.9]" style={{ color: "rgba(255,255,255,0.65)" }}>
            <strong> FXI بدأت بسؤال بسيط: </strong>
            كيف يمكن للشباب الطموح أن يجد الطريق الحقيقي للنجاح؟
            اليوم، FXI ليست مجرد شركة.
            إنها مجتمع يجمع بين الطموح والخبرة.
            نحن نربط الشباب الذين يملكون الشغف
            بأشخاص سبق لهم أن بنوا الطريق.
            من خلال إيفنتات مؤثرة، مجتمع فعّال، ومنصة تفتح أبواب العلاقات والفرص
            نساعدك على بناء شبكة قوية وتطوير مهاراتك.
            لأن النجاح لا يحدث وحده.
            بل يحدث عندما تلتقي الأفكار الطموحة مع الخبرة الصحيحة.
            FXI — المكان الذي يبدأ فيه الطريق إلى حلمك.            </p>
          </motion.div>
        </motion.section>

        {/* Event Details */}
        <motion.section
          className="container max-w-4xl mx-auto pb-20 px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="liquid-glass-strong p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="highlight-dot" />
              <h2 className="text-2xl md:text-3xl font-black">تفاصيل الحدث</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "اسم الحدث", value: eventConfig.name, icon: Sparkles },
                { label: "التاريخ", value: eventConfig.date, icon: Calendar },
                { label: "الموقع", value: eventConfig.location, icon: MapPin, wide: true },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i + 1}
                  className={`liquid-glass-subtle p-5 group ${item.wide ? "sm:col-span-2" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold">{item.value}</p>
                </motion.div>
              ))}
            </div>
            <motion.p variants={fadeUp} custom={4} className="mt-6 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              انضم إلينا ليوم مليء بالتعلم والتواصل وفرص التعاون — جدول فعاليات مُصمَّم ليمنحك تجربة متكاملة.
            </motion.p>
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
            <h2 className="text-2xl md:text-4xl font-black mb-4">احجز مكانك الآن</h2>
            <p className="max-w-lg mx-auto text-base mb-10" style={{ color: "rgba(255,255,255,0.6)" }}>
              جاهز تنضم لتجربة FXI؟ أكمل إجراء الحجز والدفع في دقائق واحصل على تذكرتك.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {agentCode ? (
                <RegistrationForm
                  agentCode={agentCode}
                  triggerLabel="سجّل الآن"
                  triggerClassName="liquid-glass-button liquid-glass-button-lg"
                />
              ) : (
                <button className="liquid-glass-button liquid-glass-button-lg" type="button">
                  سجّل الآن
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Glow separator */}
        <div className="glow-line w-1/2 mx-auto" />

        {/* Footer / Team Slogan */}
        <motion.section
          className="py-16 px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} custom={0} className="container max-w-3xl mx-auto text-center">
            <img
              src={fxiSlogan.src}
              alt="شعار فريق FXI"
              className="mx-auto max-w-md w-full h-auto rounded-xl opacity-80"
            />
          </motion.div>
        </motion.section>

        <div className="glow-line w-1/3 mx-auto mb-12" />
      </div>
    </div>
  );
};

export default Index;
