'use client'
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User, Lock, Eye, EyeOff, LogIn } from "lucide-react";

const signInSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const EQ_HEIGHTS = [22, 34, 28, 40, 18, 36, 25, 42, 20, 32, 38, 26, 44, 22, 30, 35, 24, 40, 28, 20, 36, 32, 26, 42, 18, 34, 28, 22];
const VP_EQ = [35, 60, 45, 75, 30, 65, 50, 80, 40, 60];

export function SigninForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { signIn } = useAuthStore();
    const router = useRouter();
    const barsRef = useRef<HTMLDivElement>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInFormValues) => {
        await signIn(data.username, data.password);
        router.push("/admin");
    };

    // Set waveform bar heights
    useEffect(() => {
        if (!barsRef.current) return;
        const bars = barsRef.current.querySelectorAll<HTMLSpanElement>(".wv-bar");
        bars.forEach((bar, i) => {
            bar.style.setProperty("--h", `${EQ_HEIGHTS[i] ?? 18}px`);
            bar.style.animationDelay = `${(i * 0.06).toFixed(2)}s`;
        });
    }, []);

    return (
        <div className={cn("signin-music-root", className)} {...props}>
            {/* Background */}
            <div className="signin-bg">
                <div className="signin-ring r1" />
                <div className="signin-ring r2" />
                <div className="signin-ring r3" />
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="signin-particle"
                        style={{
                            left:  `${8 + (i * 7.5) % 84}%`,
                            top:   `${5 + (i * 11) % 88}%`,
                            animationDelay:    `${(i * 0.6) % 5}s`,
                            animationDuration: `${5 + (i * 0.7) % 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Card */}
            <div className="signin-card">

                {/* ── Left: form panel ── */}
                <div className="signin-form-panel">
                    {/* Logo */}
                    <Link href="/" className="signin-logo-link">
                        <img src="/logoBlack.png" alt="Won Music" className="signin-logo-img" />
                        <span className="signin-logo-text">WON MUSIC</span>
                    </Link>

                    {/* Heading */}
                    <div className="signin-heading">
                        <h1 className="signin-title">
                            Chào mừng<br />
                            <em>quay lại</em>
                        </h1>
                        <p className="signin-sub">Đăng nhập để tiếp tục thưởng thức âm nhạc</p>
                    </div>

                    {/* Waveform */}
                    <div className="signin-waveform" ref={barsRef} aria-hidden="true">
                        {EQ_HEIGHTS.map((_, i) => <span key={i} className="wv-bar" />)}
                    </div>

                    {/* Form */}
                    <form className="signin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Username */}
                        <div className="signin-field">
                            <label htmlFor="username" className="signin-label">Tên đăng nhập</label>
                            <div className="signin-input-wrap">
                                <span className="signin-input-icon">
                                    <User size={15} />
                                </span>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="wonmusic_user"
                                    autoComplete="username"
                                    className={cn("signin-input no-right-pad", errors.username && "is-error")}
                                    {...register("username")}
                                />
                            </div>
                            {errors.username && (
                                <p className="signin-error">{errors.username.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="signin-field">
                            <label htmlFor="password" className="signin-label">Mật khẩu</label>
                            <div className="signin-input-wrap">
                                <span className="signin-input-icon">
                                    <Lock size={15} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className={cn("signin-input", errors.password && "is-error")}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    className="signin-input-toggle"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="signin-error">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button type="submit" className="signin-btn" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="signin-btn-loading">
                                    <span /><span /><span />
                                </span>
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>

                    <p className="signin-tos">
                        Bằng cách tiếp tục, bạn đồng ý với{" "}
                        <Link href="#">Điều khoản dịch vụ</Link> và{" "}
                        <Link href="#">Chính sách bảo mật</Link>.
                    </p>
                </div>

                {/* ── Right: visual panel ── */}
                <div className="signin-visual-panel" aria-hidden="true">
                    <div className="vp-circle c1" />
                    <div className="vp-circle c2" />

                    {/* Vinyl */}
                    <div className="vinyl-wrap">
                        <div className="vinyl-disk">
                            <div className="vinyl-g g1" />
                            <div className="vinyl-g g2" />
                            <div className="vinyl-g g3" />
                            <div className="vinyl-center" />
                            <div className="vinyl-hole" />
                        </div>
                        <div className="vinyl-needle" />
                        <div className="vinyl-shadow" />
                    </div>

                    {/* EQ bars */}
                    <div className="vp-eq">
                        {VP_EQ.map((h, i) => (
                            <div
                                key={i}
                                className="vp-eq-bar"
                                style={{
                                    height: `${h}%`,
                                    animationDuration: `${0.6 + (i % 5) * 0.18}s`,
                                    animationDelay: `${i * 0.07}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Tagline */}
                    <div className="visual-tagline">
                        <span className="vt-line" />
                        <span>Âm nhạc #1 Việt Nam</span>
                        <span className="vt-line" />
                    </div>
                </div>
            </div>
        </div>
    );
}
