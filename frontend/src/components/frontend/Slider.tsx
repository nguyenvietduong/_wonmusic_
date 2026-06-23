'use client'
import React, { useRef, useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    useMotionValue,
    useMotionTemplate,
    AnimatePresence,
} from "framer-motion";

import type { Variants } from "framer-motion";

interface NoteProps {
    id: number; x: number; size: number;
    delay: number; duration: number;
    symbol: string; color: string;
}
const MusicNote: React.FC<NoteProps> = ({ id, x, size, delay, duration, symbol, color }) => (
    <motion.span
        className="absolute bottom-0 pointer-events-none select-none font-black z-10"
        style={{ left: `${x}%`, fontSize: size, color, opacity: 0 }}
        animate={{ y: [0, -680], opacity: [0, 0.65, 0.4, 0], rotate: [0, 40], scale: [0.6, 1.1, 0.9] }}
        transition={{ duration, delay, repeat: Infinity, repeatDelay: (id % 6) + 2, ease: "easeOut" }}
    >{symbol}</motion.span>
);

const EqBar: React.FC<{ delay: number; baseH: number; hot: boolean }> = ({ delay, baseH, hot }) => (
    <motion.div
        className={`w-[3px] rounded-full bg-gradient-to-t ${hot ? "from-teal-400 to-teal-200" : "from-teal-600 to-teal-300"}`}
        style={{ height: baseH }}
        animate={{ scaleY: hot ? [1, 4.2, 0.3, 3.8, 1] : [1, 2.8, 0.5, 2.1, 1] }}
        transition={{ duration: hot ? 0.42 : 0.8, delay, repeat: Infinity, ease: "easeInOut" }}
    />
);

interface RippleItem { id: number; x: number; y: number; }

interface PlatformBtnProps { icon: React.ReactNode; label: string; delay: number; href?: string; }
const PlatformBtn: React.FC<PlatformBtnProps> = ({ icon, label, delay, href = "#" }) => (
    <motion.a
        href={href} target="_blank" rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        whileHover={{ scale: 1.07, y: -3 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#00A98F] hover:bg-[#34D4B8] text-black font-bold text-[11px] sm:text-sm shadow-[0_4px_20px_rgba(0,169,143,0.4)] hover:shadow-[0_4px_28px_rgba(52,212,184,0.5)] transition-colors duration-200 cursor-pointer"
    >
        {icon}
        <span>{label}</span>
    </motion.a>
);

const SoundCloudIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
        <path d="M1.175 12.225c-.056 0-.094.05-.101.13l-.233 2.154.233 2.105c.007.08.045.13.101.13.055 0 .094-.05.101-.13l.265-2.105-.265-2.154c-.007-.08-.046-.13-.101-.13zm.899-.309c-.068 0-.117.058-.124.143l-.2 2.463.2 2.394c.007.085.056.143.124.143.067 0 .117-.058.124-.143l.227-2.394-.227-2.463c-.007-.085-.057-.143-.124-.143zm.932-.287c-.082 0-.14.068-.147.158l-.166 2.75.166 2.676c.007.09.065.158.147.158.08 0 .14-.068.147-.158l.19-2.676-.19-2.75c-.007-.09-.067-.158-.147-.158zm.944-.197c-.095 0-.163.078-.168.18l-.133 2.947.133 2.852c.005.101.073.18.168.18.093 0 .162-.079.168-.18l.15-2.852-.15-2.947c-.006-.102-.075-.18-.168-.18zm.957-.12c-.109 0-.186.087-.19.202l-.1 3.067.1 3.026c.004.114.081.202.19.202.107 0 .185-.088.19-.202l.114-3.026-.114-3.067c-.005-.115-.083-.202-.19-.202zm10.267-2.57c-.28 0-.548.056-.797.158-.164-3.405-2.97-6.113-6.42-6.113-1.02 0-1.986.248-2.832.686-.313.163-.396.33-.4.476v12.055c.004.153.122.279.274.293h10.175c.835 0 1.512-.676 1.512-1.512V10.64c0-.835-.677-1.511-1.512-1.511z" />
    </svg>
);
const SpotifyIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);
const AppleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

const Slider: React.FC = () => {
    const { sliderBoldLine, sliderSpotifyUrl, sliderSoundcloudUrl, sliderAppleUrl, loaded, fetch: fetchSettings } = useSettingsStore();
    useEffect(() => { if (!loaded) fetchSettings(); }, [loaded, fetchSettings]);

    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.15, once: false });
    const [tick, setTick] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState<RippleItem[]>([]);
    const rippleIdRef = useRef(0);
    const lastRippleRef = useRef(0);

    // Smooth cursor position for the glow effect
    const cursorX = useMotionValue(50);
    const cursorY = useMotionValue(50);
    const smoothX = useSpring(cursorX, { stiffness: 90, damping: 22 });
    const smoothY = useSpring(cursorY, { stiffness: 90, damping: 22 });
    const cursorGlow = useMotionTemplate`radial-gradient(320px circle at ${smoothX}% ${smoothY}%, rgba(0,169,143,0.22), rgba(52,212,184,0.06) 45%, transparent 70%)`;

    useEffect(() => {
        const t = setInterval(() => setTick((p) => p + 1), 12000);
        return () => clearInterval(t);
    }, []);

    const rawMX = useSpring(0, { stiffness: 45, damping: 22 });

    const handleMouseMove = (e: React.MouseEvent) => {
        rawMX.set((e.clientX / window.innerWidth - 0.5) * 18);

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            cursorX.set(x);
            cursorY.set(y);

            // Emit a ripple ring every 650ms while moving
            const now = Date.now();
            if (now - lastRippleRef.current > 650) {
                const id = rippleIdRef.current++;
                setRipples(prev => [...prev.slice(-7), { id, x, y }]);
                setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1600);
                lastRippleRef.current = now;
            }
        }
    };

    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
    const bgScale   = useTransform(scrollYProgress, [0, 0.5], [1.1, 1]);
    const bgY       = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
    const textY     = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
    // Start visible (0.5 = midpoint = slider fully in view on load), fade out when scrolled past
    const wrapAlpha = useTransform(scrollYProgress, [0, 0.05, 0.9, 1], [1, 1, 1, 0]);

    const symbols    = ["♩","♪","♫","♬","𝄞","𝄢","♭","♮","♯"];
    const noteColors = ["#34D4B8","#00A98F","#6ee7b7","#ffffff66","#6366F144"];
    const notes: NoteProps[] = Array.from({ length: 14 }, (_, i) => ({
        id: i + tick * 100,
        x: ((i * 37 + 13) % 94) + 2,
        size: (i % 3) * 6 + 12,
        delay: (i * 0.71) % 8,
        duration: (i % 5) + 6,
        symbol: symbols[i % symbols.length],
        color: noteColors[i % noteColors.length],
    }));

    const boldLine = sliderBoldLine || "TO US DAILY";

    const letterVariants : Variants = {
        hidden:  { y: "110%", opacity: 0, rotateX: -70, filter: "blur(10px)" },
        visible: (i: number) => ({
            y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)",
            transition: { duration: 1.0, delay: 0.4 + i * 0.04, ease: [0.16, 1, 0.3, 1] as const },
        }),
    };

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setRipples([]); }}
            style={{ opacity: wrapAlpha }}
            className="relative w-full h-[80vh] xl:h-screen overflow-hidden text-white select-none bg-[#242424] z-30 flex items-center justify-center"
        >
            {/* ══ BG ══ */}
            <motion.div
                style={{ scale: bgScale, y: bgY, x: rawMX, rotate: useTransform(rawMX, [-9, 9], [-0.3, 0.3]) }}
                className="absolute inset-0 w-[106%] h-[106%] -left-[3%] -top-[3%]"
            >
                <img
                    src="/setups/banners/banner.png" alt="Artist"
                    className="w-full h-full object-cover object-top brightness-[0.72] saturate-[1.15]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
                <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:3px_3px]" />
            </motion.div>

            {/* ══ CURSOR GLOW — follows mouse smoothly ══ */}
            <motion.div
                className="absolute inset-0 pointer-events-none z-[5]"
                style={{ background: cursorGlow }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.4 }}
            />

            {/* ══ SOUND RIPPLE RINGS ══ */}
            <AnimatePresence>
                {ripples.map(r => (
                    <motion.div
                        key={r.id}
                        className="absolute pointer-events-none z-[6] rounded-full"
                        style={{
                            left: `${r.x}%`,
                            top: `${r.y}%`,
                            width: 180,
                            height: 180,
                            border: "1.5px solid rgba(52,212,184,0.55)",
                            boxShadow: "0 0 12px rgba(0,169,143,0.25)",
                        }}
                        initial={{ scale: 0, opacity: 0.85, x: "-50%", y: "-50%" }}
                        animate={{ scale: 2.0, opacity: 0, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4, ease: [0.2, 0, 0.8, 1] }}
                    />
                ))}
            </AnimatePresence>

            {/* Second inner ripple (smaller, faster) */}
            <AnimatePresence>
                {ripples.map(r => (
                    <motion.div
                        key={`${r.id}-inner`}
                        className="absolute pointer-events-none z-[6] rounded-full"
                        style={{
                            left: `${r.x}%`,
                            top: `${r.y}%`,
                            width: 80,
                            height: 80,
                            border: "1px solid rgba(0,169,143,0.7)",
                        }}
                        initial={{ scale: 0, opacity: 1, x: "-50%", y: "-50%" }}
                        animate={{ scale: 2.5, opacity: 0, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: [0.2, 0, 0.8, 1] }}
                    />
                ))}
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#242424] via-[#242424]/70 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

            <AnimatePresence>{notes.map((n) => <MusicNote key={n.id} {...n} />)}</AnimatePresence>

            <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent pointer-events-none z-20"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {(["top-0 left-0","top-0 right-0","bottom-0 left-0","bottom-0 right-0"] as const).map((pos, i) => (
                <motion.div key={i} className={`absolute ${pos} w-8 h-8 sm:w-12 sm:h-12 pointer-events-none z-30`}
                    initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.6 + i * 0.08 }}>
                    <div className={`absolute ${i < 2 ? "top-0" : "bottom-0"} ${i % 2 === 0 ? "left-0" : "right-0"} w-6 sm:w-9 h-[1.5px] bg-teal-400/30`} />
                    <div className={`absolute ${i < 2 ? "top-0" : "bottom-0"} ${i % 2 === 0 ? "left-0" : "right-0"} w-[1.5px] h-6 sm:h-9 bg-teal-400/30`} />
                </motion.div>
            ))}

            {/* ══ WAVEFORM SVG — brightens on hover ══ */}
            <motion.svg viewBox="0 0 200 60" className="absolute top-6 right-6 w-24 sm:w-36 z-20"
                initial={{ opacity: 0, x: 16 }}
                animate={isInView ? { opacity: isHovered ? 0.5 : 0.15, x: 0 } : {}}
                transition={{ delay: isInView ? 1.3 : 0, duration: 0.9 }}>
                {Array.from({ length: 40 }, (_, i) => {
                    const h = Math.abs(Math.sin(i * 0.55)) * 16 + 6;
                    return <motion.rect key={i} x={i * 5} y={30 - h / 2} width={3} height={h} rx={1.5} fill="#34D4B8"
                        initial={{ height: h }}
                        animate={{ height: [h, h * 1.9, h * 0.4, h] }}
                        transition={{ duration: 1.1, delay: i * 0.04, repeat: Infinity, ease: "easeInOut" }} />;
                })}
            </motion.svg>

            {/* ══ CENTRE TEXT BLOCK ══ */}
            <motion.div
                style={{ y: textY }}
                className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-5xl mx-auto"
            >
                {/* Script image */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="mb-1 sm:mb-2"
                >
                    <img
                        src="/setups/banners/listing-text.png"
                        alt="Listen"
                        className="w-40 sm:w-64 xl:w-80 mx-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
                    />
                </motion.div>

                {/* Bold text + arrow side by side */}
                <div className="relative flex items-center justify-center">

                    {/* Bold caps */}
                    <div className="overflow-hidden perspective-[800px] flex justify-center flex-wrap">
                        {boldLine.split("").map((char, i) => (
                            <motion.span
                                key={i}
                                custom={i}
                                variants={letterVariants}
                                initial="hidden"
                                animate={isInView ? "visible" : "hidden"}
                                className={`
                                    inline-block
                                    text-[40px] sm:text-[90px] xl:text-[6rem]
                                    font-black tracking-tight leading-none
                                    text-white
                                    drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)]
                                    ${char === " " ? "mx-2 sm:mx-4" : ""}
                                `}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </div>

                    {/* Arrow image */}
                    <motion.div
                        initial={{ opacity: 0, x: -10, y: -10 }}
                        animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 1.0 }}
                        className="
                            absolute
                            -right-10 sm:-right-14 xl:-right-20
                            top-1/2
                            translate-y-1/4
                            pointer-events-none
                        "
                    >
                        <motion.img
                            src="/setups/banners/bn-arrowv.png"
                            alt="arrow"
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                            className="w-8 sm:w-10 xl:w-14 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                        />
                    </motion.div>
                </div>

                {/* Platform buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10">
                    <PlatformBtn icon={<SoundCloudIcon />} label="SOUNDCLOUD" delay={0.9}  href={sliderSoundcloudUrl || "#"} />
                    <PlatformBtn icon={<SpotifyIcon />}    label="SPOTIFY"    delay={1.05} href={sliderSpotifyUrl    || "#"} />
                    <PlatformBtn icon={<AppleIcon />}      label="APPLE"      delay={1.2}  href={sliderAppleUrl      || "#"} />
                </div>
            </motion.div>

            {/* ══ EQ BARS — amp up on hover ══ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.6, duration: 0.8 }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-end gap-[3px]"
            >
                {Array.from({ length: 32 }, (_, i) => (
                    <EqBar key={i} delay={i * 0.048} baseH={((i * 7 + 3) % 16) + 7} hot={isHovered} />
                ))}
            </motion.div>
        </motion.div>
    );
};

export default Slider;
