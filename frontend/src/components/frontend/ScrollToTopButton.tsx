import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 200); // hiện khi cuộn xuống 200px
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div
            onClick={scrollToTop}
            title="Lên đầu trang"
            className={`
                fixed bottom-20 right-4 w-12 h-12 bg-white text-green-700 
                flex items-center justify-center cursor-pointer z-[9999] rounded-[9.6px] shadow-lg 
                transition-transform transition-opacity duration-300
                ${visible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
            `}
        >
            <i className="fa-solid fa-arrow-up text-[14px] text-"></i>
        </div>
    ); 
}