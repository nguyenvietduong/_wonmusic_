import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import "@/styles/signin.css";

const signInSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { signIn } = useAuthStore();
    const navigate = useNavigate();
    const barsRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInFormValues) => {
        await signIn(data.username, data.password);
        navigate("/admin");
    };

    // Generate random bar heights for the waveform
    useEffect(() => {
        if (!barsRef.current) return;
        const bars = barsRef.current.querySelectorAll<HTMLSpanElement>(".wv-bar");
        bars.forEach((bar, i) => {
            bar.style.setProperty("--h", `${18 + Math.sin(i * 0.55) * 12 + Math.random() * 22}px`);
            bar.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
        });
    }, []);

    const logoPath = `/logoBlack.png`;

    return (
        <div className={cn("signin-music-root", className)} {...props}>
            {/* ── Background decorations ── */}
            <div className="signin-bg">
                <div className="signin-ring r1" />
                <div className="signin-ring r2" />
                <div className="signin-ring r3" />
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="signin-particle"
                        style={{
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${4 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Card ── */}
            <div className="signin-card">
                {/* Left — form panel */}
                <div className="signin-form-panel">
                    {/* Logo */}
                    <Link to="/" className="signin-logo-link">
                        <img src={logoPath} alt="Won Music" className="signin-logo-img" />
                        <span className="signin-logo-text">WON MUSIC</span>
                    </Link>

                    {/* Heading */}
                    <div className="signin-heading">
                        <h1 className="signin-title">Chào mừng<br />quay lại</h1>
                        <p className="signin-sub">Đăng nhập để tiếp tục thưởng thức âm nhạc</p>
                    </div>

                    {/* Waveform decoration */}
                    <div className="signin-waveform" ref={barsRef} aria-hidden="true">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <span key={i} className="wv-bar" />
                        ))}
                    </div>

                    {/* Form */}
                    <form className="signin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Username */}
                        <div className="signin-field">
                            <label htmlFor="username" className="signin-label">
                                Tên đăng nhập
                            </label>
                            <div className="signin-input-wrap">
                                <span className="signin-input-icon">♪</span>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="wonmusic_user"
                                    className={cn("signin-input", errors.username && "is-error")}
                                    {...register("username")}
                                />
                            </div>
                            {errors.username && (
                                <p className="signin-error">{errors.username.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="signin-field">
                            <label htmlFor="password" className="signin-label">
                                Mật khẩu
                            </label>
                            <div className="signin-input-wrap">
                                <span className="signin-input-icon">🔑</span>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    className={cn("signin-input", errors.password && "is-error")}
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && (
                                <p className="signin-error">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="signin-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="signin-btn-loading">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                            ) : (
                                <>
                                    <span className="signin-btn-icon">▶</span>
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    {/* <p className="signin-footer-link">
                        Chưa có tài khoản?{" "}
                        <Link to="/signup">Đăng ký ngay</Link>
                    </p> */}
                    <p className="signin-tos">
                        Bằng cách tiếp tục, bạn đồng ý với{" "}
                        <Link to="#">Điều khoản dịch vụ</Link> và{" "}
                        <Link to="#">Chính sách bảo mật</Link>.
                    </p>
                </div>

                {/* Right — visual panel */}
                <div className="signin-visual-panel" aria-hidden="true">
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

                    <div className="np-card">
                        <div className="np-bars">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className="np-bar" style={{ animationDelay: `${i * 0.18}s` }} />
                            ))}
                        </div>
                        <div>
                            <div className="np-title">Nơi Này Có Anh</div>
                            <div className="np-artist">Sơn Tùng M-TP</div>
                        </div>
                    </div>

                    <div className="visual-tagline">
                        <span className="vt-line" />
                        <span>Nền tảng âm nhạc #1 Việt Nam</span>
                        <span className="vt-line" />
                    </div>
                </div>
            </div>
        </div>
    );
}