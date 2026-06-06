import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 200);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Lên đầu trang"
            style={{
                position: "fixed", bottom: 80, right: 16,
                width: 44, height: 44, borderRadius: 10,
                background: "linear-gradient(135deg,#00A98F,#34D4B8)",
                color: "#242424",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", zIndex: 9999,
                boxShadow: "0 4px 16px rgba(0,169,143,0.4)",
                transition: "opacity .3s, transform .3s",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.75)",
                pointerEvents: visible ? "auto" : "none",
            }}
        >
            <ArrowUp size={18} strokeWidth={2.5} />
        </div>
    );
}
