'use client'
import { FaPhoneAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { companyConfig } from "@/config/company.config";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayerStore } from "@/stores/usePlayerStore";

const PhoneButton = () => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const currentTrack = usePlayerStore(s => s.currentTrack);
    const bottom = isMobile && currentTrack ? 124 : 80;

    return (
        <div
            onClick={() => router.push("/lien-he")}
            title="Liên hệ ngay"
            className="group fixed left-5 z-[9999] cursor-pointer flex items-center"
            style={{ bottom, transition: "bottom .3s" }}
        >
            {/* Ping rings */}
            <span className="absolute w-14 h-14 rounded-full animate-ping opacity-30"
                style={{ border: "2px solid #34D4B8" }} />
            <span className="absolute w-14 h-14 rounded-full animate-ping opacity-15 delay-200"
                style={{ border: "2px solid #00A98F" }} />

            {/* Button */}
            <div
                className="relative flex items-center rounded-full pl-1 pr-1 lg:pr-4 xl:pr-4 py-1 transition-all duration-300"
                style={{
                    background: "linear-gradient(135deg,#00A98F,#007D69)",
                    boxShadow: "0 8px 25px rgba(0,169,143,0.45)",
                }}
            >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"
                    style={{ color: "#00A98F" }}>
                    <FaPhoneAlt className="text-lg" />
                </div>
                <span className="ml-none lg:ml-3 xl:ml-3 text-white font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 max-w-none sm:max-w-none lg:max-w-[200px] xl:max-w-[200px]">
                    {companyConfig.phone}
                </span>
            </div>
        </div>
    );
};

export default PhoneButton;
