import { useLanguageStore } from "@/stores/useLanguageStore";
import { cn } from "@/lib/utils";

const LanguageSwitcher = () => {
    const { lang, setLang } = useLanguageStore();

    return (
        <div className="flex items-center gap-2">
            {/* VI */}
            <button
                onClick={() => setLang("vi")}
                className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition",
                    lang === "vi"
                        ? "border-[#00A98F] bg-[rgba(0,169,143,0.2)] scale-110"
                        : "border-[rgba(0,169,143,0.2)] opacity-60 hover:opacity-100"
                )}
            >
                <img src="/vn_flag.svg" className="h-5 w-5" />
            </button>

            {/* EN */}
            <button
                onClick={() => setLang("en")}
                className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition",
                    lang === "en"
                        ? "border-[#00A98F] bg-[rgba(0,169,143,0.2)] scale-110"
                        : "border-[rgba(0,169,143,0.2)] opacity-60 hover:opacity-100"
                )}
            >
                <img src="/us_flag.png" className="h-6 w-6" />
            </button>
        </div>
    );
};

export default LanguageSwitcher;