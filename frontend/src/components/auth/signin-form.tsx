'use client'
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { signinFormText } from "@/locales/auth/signinForm";

const makeSchema = (t: typeof signinFormText.vi) => z.object({
    email: z.string().email(t.usernameError),
    password: z.string().min(6, t.passwordError),
});

// EQ bar heights for left panel animation
const EQ_BARS = [55, 80, 45, 90, 60, 75, 35, 88, 50, 70, 40, 85, 65, 78, 42, 92, 58, 68, 48, 82, 38, 76, 52, 86, 44, 72, 56, 88];

export function SigninForm({ className, ...props }: React.ComponentProps<"div">) {
    const { signIn } = useAuthStore();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const { lang } = useLanguageStore();
    const t = signinFormText[lang];
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const signInSchema = makeSchema(t);
    type SignInFormValues = z.infer<typeof signInSchema>;

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInFormValues) => {
        await signIn(data.email, data.password);
        router.push("/admin");
    };

    // Waveform canvas animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let t = 0;
        const draw = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const bars = 48;
            const barW = W / bars - 2;

            for (let i = 0; i < bars; i++) {
                const baseH = EQ_BARS[i % EQ_BARS.length] / 100;
                const h = (baseH * 0.6 + Math.sin(t * 2.5 + i * 0.4) * 0.2 + Math.sin(t * 1.8 + i * 0.7) * 0.1 + 0.1) * H * 0.75;
                const x = i * (barW + 2);
                const y = H - h;

                const grad = ctx.createLinearGradient(0, y, 0, H);
                grad.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
                grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.7)');
                grad.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, h, [3, 3, 0, 0]);
                ctx.fill();
            }
            t += 0.018;
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    return (
        <div className={cn(className)} {...props}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');

                .wm-root {
                    font-family: 'Inter', sans-serif;
                    min-height: 100svh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #08080F;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                }

                /* Ambient glow blobs */
                .wm-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                }
                .wm-blob-1 {
                    width: 600px; height: 600px;
                    top: -200px; left: -200px;
                    background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
                }
                .wm-blob-2 {
                    width: 500px; height: 500px;
                    bottom: -150px; right: -100px;
                    background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
                }
                .wm-blob-3 {
                    width: 300px; height: 300px;
                    top: 50%; left: 50%;
                    transform: translate(-50%,-50%);
                    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
                }

                /* Card */
                .wm-card {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    width: 100%;
                    max-width: 960px;
                    min-height: 580px;
                    border-radius: 28px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.07);
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.04),
                        0 40px 80px rgba(0,0,0,0.6),
                        0 0 120px rgba(139,92,246,0.08);
                }

                /* Left panel */
                .wm-left {
                    position: relative;
                    flex: 1;
                    background: linear-gradient(145deg, #0F0F1E 0%, #12102A 50%, #0A0A18 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 40px 36px 0;
                    overflow: hidden;
                }

                /* Grid texture */
                .wm-left::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 40px 40px;
                    pointer-events: none;
                }

                /* Glow ring on left */
                .wm-left::after {
                    content: '';
                    position: absolute;
                    top: -100px; left: -100px;
                    width: 400px; height: 400px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%);
                    pointer-events: none;
                }

                .wm-brand {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                .wm-brand img {
                    width: 36px; height: 36px;
                    object-fit: contain;
                    filter: brightness(0) invert(1);
                }
                .wm-brand-name {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .wm-left-content {
                    position: relative;
                    z-index: 2;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 32px 0 24px;
                }

                .wm-eyebrow {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 14px;
                }
                .wm-eyebrow-line {
                    width: 24px; height: 2px;
                    background: linear-gradient(90deg, #00D4FF, #8B5CF6);
                    border-radius: 2px;
                }
                .wm-eyebrow-text {
                    font-size: 0.68rem;
                    font-weight: 600;
                    color: #00D4FF;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                }

                .wm-left-heading {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: clamp(28px, 3vw, 40px);
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.15;
                    margin-bottom: 16px;
                }
                .wm-left-heading span {
                    background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .wm-left-sub {
                    font-size: 0.84rem;
                    color: rgba(255,255,255,0.45);
                    line-height: 1.6;
                    max-width: 280px;
                }

                /* Stats row */
                .wm-stats {
                    display: flex;
                    gap: 28px;
                    margin-top: 28px;
                }
                .wm-stat-val {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                }
                .wm-stat-label {
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.35);
                    margin-top: 2px;
                    letter-spacing: 0.05em;
                }

                /* EQ canvas at bottom */
                .wm-canvas-wrap {
                    position: relative;
                    z-index: 2;
                    height: 80px;
                    margin: 0 -36px;
                }
                .wm-canvas-wrap canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                /* Right panel */
                .wm-right {
                    width: 400px;
                    background: #0D0D18;
                    border-left: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 48px 40px;
                }

                .wm-form-heading {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 4px;
                }
                .wm-form-sub {
                    font-size: 0.82rem;
                    color: rgba(255,255,255,0.38);
                    margin-bottom: 32px;
                }

                /* Form fields */
                .wm-field { margin-bottom: 18px; }
                .wm-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-bottom: 7px;
                }
                .wm-input-wrap { position: relative; }
                .wm-input {
                    width: 100%;
                    padding: 11px 14px 11px 40px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 10px;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.88rem;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                    -webkit-appearance: none;
                }
                .wm-input::placeholder { color: rgba(255,255,255,0.2); }
                .wm-input:focus {
                    border-color: rgba(0,212,255,0.5);
                    background: rgba(0,212,255,0.04);
                    box-shadow: 0 0 0 3px rgba(0,212,255,0.08);
                }
                .wm-input.is-error {
                    border-color: rgba(239,68,68,0.5);
                    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
                }
                .wm-input-pr { padding-right: 40px; }

                .wm-ico {
                    position: absolute;
                    left: 13px; top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.25);
                    pointer-events: none;
                    transition: color 0.2s;
                    display: flex;
                }
                .wm-input-wrap:focus-within .wm-ico { color: rgba(0,212,255,0.7); }

                .wm-toggle {
                    position: absolute;
                    right: 11px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none;
                    cursor: pointer;
                    color: rgba(255,255,255,0.25);
                    display: flex;
                    padding: 2px;
                    transition: color 0.2s;
                }
                .wm-toggle:hover { color: rgba(255,255,255,0.6); }

                .wm-field-error {
                    margin-top: 5px;
                    font-size: 0.72rem;
                    color: #EF4444;
                }

                /* Submit button */
                .wm-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
                    box-shadow: 0 4px 24px rgba(0,212,255,0.2), 0 0 0 1px rgba(255,255,255,0.08) inset;
                }
                .wm-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
                    pointer-events: none;
                }
                .wm-btn:hover:not(:disabled) {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 32px rgba(0,212,255,0.3);
                }
                .wm-btn:active:not(:disabled) { transform: translateY(0); }
                .wm-btn:disabled { opacity: 0.55; cursor: not-allowed; }

                /* Spinner dots */
                .wm-dots { display: flex; gap: 5px; }
                .wm-dots span {
                    width: 6px; height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    animation: wmBounce 1s ease-in-out infinite;
                }
                .wm-dots span:nth-child(2) { animation-delay: 0.15s; }
                .wm-dots span:nth-child(3) { animation-delay: 0.3s; }
                @keyframes wmBounce {
                    0%,100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }

                .wm-footer {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.2);
                }
                .wm-footer a { color: rgba(0,212,255,0.5); text-decoration: none; }
                .wm-footer a:hover { color: rgba(0,212,255,0.8); }

                /* Divider */
                .wm-divider {
                    display: flex; align-items: center; gap: 10px;
                    margin: 20px 0 0;
                }
                .wm-divider hr {
                    flex: 1; border: none;
                    border-top: 1px solid rgba(255,255,255,0.07);
                }
                .wm-divider span {
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.2);
                }

                @media (max-width: 720px) {
                    .wm-left { display: none; }
                    .wm-card { max-width: 420px; }
                    .wm-right { width: 100%; padding: 40px 28px; }
                }
            `}</style>

            <div className="wm-root">
                {/* Ambient blobs */}
                <div className="wm-blob wm-blob-1" />
                <div className="wm-blob wm-blob-2" />
                <div className="wm-blob wm-blob-3" />

                <div className="wm-card">
                    {/* ── Left panel ── */}
                    <div className="wm-left">
                        {/* Brand */}
                        <Link href="/" className="wm-brand">
                            <img src="/logoBlack.png" alt="Won Music" />
                            <span className="wm-brand-name">Won Music</span>
                        </Link>

                        {/* Center content */}
                        <div className="wm-left-content">
                            <div className="wm-eyebrow">
                                <span className="wm-eyebrow-line" />
                                <span className="wm-eyebrow-text">Admin Portal</span>
                            </div>

                            <h2 className="wm-left-heading">
                                Âm nhạc<br />
                                <span>Việt Nam #1</span>
                            </h2>

                            <p className="wm-left-sub">
                                Nền tảng quản lý âm nhạc hàng đầu. Theo dõi nghệ sĩ, bài hát và xu hướng trong thời gian thực.
                            </p>

                            <div className="wm-stats">
                                <div>
                                    <div className="wm-stat-val">6+</div>
                                    <div className="wm-stat-label">Nghệ sĩ</div>
                                </div>
                                <div>
                                    <div className="wm-stat-val">12+</div>
                                    <div className="wm-stat-label">Bài hát</div>
                                </div>
                                <div>
                                    <div className="wm-stat-val">100M+</div>
                                    <div className="wm-stat-label">Lượt nghe</div>
                                </div>
                            </div>
                        </div>

                        {/* EQ canvas */}
                        <div className="wm-canvas-wrap">
                            <canvas ref={canvasRef} />
                        </div>
                    </div>

                    {/* ── Right panel ── */}
                    <div className="wm-right">
                        <div className="wm-form-heading">Chào mừng 👋</div>
                        <div className="wm-form-sub">Đăng nhập để quản lý Won Music</div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {/* Email */}
                            <div className="wm-field">
                                <label htmlFor="email" className="wm-label">{t.usernameLabel}</label>
                                <div className="wm-input-wrap">
                                    <span className="wm-ico">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <rect x="2" y="4" width="20" height="16" rx="3"/>
                                            <path d="M2 7l10 7 10-7"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="admin@wonmusic.vn"
                                        autoComplete="email"
                                        className={cn("wm-input", errors.email && "is-error")}
                                        {...register("email")}
                                    />
                                </div>
                                {errors.email && <p className="wm-field-error">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div className="wm-field">
                                <label htmlFor="password" className="wm-label">{t.passwordLabel}</label>
                                <div className="wm-input-wrap">
                                    <span className="wm-ico">
                                        <Lock size={15} />
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={cn("wm-input wm-input-pr", errors.password && "is-error")}
                                        {...register("password")}
                                    />
                                    <button
                                        type="button"
                                        className="wm-toggle"
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                                    >
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.password && <p className="wm-field-error">{errors.password.message}</p>}
                            </div>

                            <button type="submit" className="wm-btn" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <div className="wm-dots">
                                        <span /><span /><span />
                                    </div>
                                ) : (
                                    <>
                                        <LogIn size={16} />
                                        {t.loginBtn}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="wm-divider">
                            <hr />
                            <span>WON MUSIC ADMIN</span>
                            <hr />
                        </div>

                        <div className="wm-footer">
                            © {new Date().getFullYear()} Won Music ·{" "}
                            <Link href="#">{t.tosLink}</Link>{" "}·{" "}
                            <Link href="#">{t.privacyLink}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
