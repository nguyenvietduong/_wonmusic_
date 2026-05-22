import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import "@/styles/signup.css";

const theme = import.meta.env.VITE_APP_ASSET_THEME || "Default";

const signUpSchema = z.object({
    firstname: z.string().min(1, "Tên bắt buộc phải có"),
    lastname:  z.string().min(1, "Họ bắt buộc phải có"),
    username:  z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    email:     z.string().email("Email không hợp lệ"),
    password:  z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
    const { signUp } = useAuthStore();
    const navigate = useNavigate();
    const notesRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: SignUpFormValues) => {
        const { firstname, lastname, username, email, password } = data;
        await signUp(username, password, email, firstname, lastname);
        navigate("/signin");
    };

    // Stagger floating note animations
    useEffect(() => {
        if (!notesRef.current) return;
        const notes = notesRef.current.querySelectorAll<HTMLSpanElement>(".float-note");
        notes.forEach((n) => {
            n.style.animationDelay = `${Math.random() * 6}s`;
            n.style.animationDuration = `${5 + Math.random() * 4}s`;
            n.style.left = `${10 + Math.random() * 80}%`;
            n.style.top = `${10 + Math.random() * 80}%`;
        });
    }, []);

    const logoPath = `/${theme}/icon.png`;

    return (
        <div className={cn("signup-music-root", className)} {...props}>
            {/* ── Background ── */}
            <div className="signup-bg">
                <div className="su-ring r1" />
                <div className="su-ring r2" />
                <div ref={notesRef} className="su-notes" aria-hidden="true">
                    {["♪", "♫", "♩", "♬", "♪", "♫", "♩", "♬"].map((n, i) => (
                        <span key={i} className="float-note">{n}</span>
                    ))}
                </div>
            </div>

            {/* ── Card ── */}
            <div className="signup-card">
                {/* Left — visual panel */}
                <div className="signup-visual-panel" aria-hidden="true">
                    {/* Equalizer bars */}
                    <div className="eq-wrap">
                        <div className="eq-label">
                            <span className="eq-dot" />
                            Đang phát
                        </div>
                        <div className="eq-bars">
                            {Array.from({ length: 14 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="eq-bar"
                                    style={{
                                        animationDelay: `${i * 0.09}s`,
                                        "--bh": `${20 + Math.sin(i * 0.6) * 16 + Math.random() * 24}px`,
                                    } as React.CSSProperties}
                                />
                            ))}
                        </div>
                        <div className="eq-track-info">
                            <div className="eq-track-title">Mùa Hè Trong Tim</div>
                            <div className="eq-track-artist">Thùy Linh · Won Music</div>
                        </div>
                    </div>

                    {/* Album stack */}
                    <div className="album-stack">
                        <div className="album-card ac3">
                            <div className="ac-inner" />
                        </div>
                        <div className="album-card ac2">
                            <div className="ac-inner" />
                        </div>
                        <div className="album-card ac1">
                            <div className="ac-inner" />
                            <div className="ac-badge">NEW</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="visual-stats">
                        <div className="vs-item">
                            <strong>150+</strong>
                            <span>Nền tảng</span>
                        </div>
                        <div className="vs-divider" />
                        <div className="vs-item">
                            <strong>12K+</strong>
                            <span>Nghệ sĩ</span>
                        </div>
                        <div className="vs-divider" />
                        <div className="vs-item">
                            <strong>2M+</strong>
                            <span>Bài hát</span>
                        </div>
                    </div>

                    <p className="visual-motto">
                        Nơi âm nhạc<br />chạm đến trái tim
                    </p>
                </div>

                {/* Right — form panel */}
                <div className="signup-form-panel">
                    {/* Logo */}
                    <Link to="/" className="su-logo-link">
                        <img src={logoPath} alt="Won Music" className="su-logo-img" />
                        <span className="su-logo-text">WON MUSIC</span>
                    </Link>

                    <div className="su-heading">
                        <h1 className="su-title">Tạo tài khoản</h1>
                        <p className="su-sub">Chào mừng bạn! Bắt đầu hành trình âm nhạc ngay hôm nay</p>
                    </div>

                    <form className="su-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Họ & Tên */}
                        <div className="su-row">
                            <div className="su-field">
                                <label htmlFor="lastname" className="su-label">Họ</label>
                                <input
                                    type="text"
                                    id="lastname"
                                    placeholder="Nguyễn"
                                    className={cn("su-input", errors.lastname && "is-error")}
                                    {...register("lastname")}
                                />
                                {errors.lastname && <p className="su-error">{errors.lastname.message}</p>}
                            </div>
                            <div className="su-field">
                                <label htmlFor="firstname" className="su-label">Tên</label>
                                <input
                                    type="text"
                                    id="firstname"
                                    placeholder="Văn A"
                                    className={cn("su-input", errors.firstname && "is-error")}
                                    {...register("firstname")}
                                />
                                {errors.firstname && <p className="su-error">{errors.firstname.message}</p>}
                            </div>
                        </div>

                        {/* Username */}
                        <div className="su-field">
                            <label htmlFor="username" className="su-label">Tên đăng nhập</label>
                            <div className="su-input-wrap">
                                <span className="su-input-icon">♪</span>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="wonmusic_user"
                                    className={cn("su-input has-icon", errors.username && "is-error")}
                                    {...register("username")}
                                />
                            </div>
                            {errors.username && <p className="su-error">{errors.username.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="su-field">
                            <label htmlFor="email" className="su-label">Email</label>
                            <div className="su-input-wrap">
                                <span className="su-input-icon">@</span>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="you@gmail.com"
                                    className={cn("su-input has-icon", errors.email && "is-error")}
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && <p className="su-error">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="su-field">
                            <label htmlFor="password" className="su-label">Mật khẩu</label>
                            <div className="su-input-wrap">
                                <span className="su-input-icon">🔑</span>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    className={cn("su-input has-icon", errors.password && "is-error")}
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && <p className="su-error">{errors.password.message}</p>}
                        </div>

                        {/* Submit */}
                        <button type="submit" className="su-btn" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="su-btn-loading">
                                    <span /><span /><span />
                                </span>
                            ) : (
                                <>
                                    <span className="su-btn-icon">♫</span>
                                    Tạo tài khoản
                                </>
                            )}
                        </button>
                    </form>

                    <p className="su-footer-link">
                        Đã có tài khoản?{" "}
                        <Link to="/signin">Đăng nhập</Link>
                    </p>
                    <p className="su-tos">
                        Bằng cách tiếp tục, bạn đồng ý với{" "}
                        <Link to="#">Điều khoản dịch vụ</Link> và{" "}
                        <Link to="#">Chính sách bảo mật</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}