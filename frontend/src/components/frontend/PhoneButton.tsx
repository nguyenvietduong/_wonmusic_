import { FaPhoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { companyConfig } from "@/config/company.config";

const PhoneButton = () => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate("/lien-he")}
            title="Liên hệ ngay"
            className="
                group
                fixed bottom-20 left-5
                z-9999
                cursor-pointer
                flex items-center
            "
        >
            {/* Vòng sóng */}
            <span className="absolute w-14 h-14 rounded-full border-2 border-green-400 animate-ping opacity-40"></span>
            <span className="absolute w-14 h-14 rounded-full border-2 border-green-400 animate-ping opacity-20 delay-200"></span>

            {/* Nút chính */}
            <div
                className="
                    relative
                    flex items-center
                    bg-linear-to-br from-green-500 to-green-700
                    rounded-full
                    shadow-[0_8px_25px_rgba(255,106,42,0.45)]
                    pl-1 pr-1 sm:pr-1 lg:pr-4 xl:pr-4 py-1
                    transition-all duration-300
                "
            >
                {/* Icon */}
                <div
                    className="
                        w-12 h-12
                        bg-white
                        rounded-full
                        flex items-center justify-center
                        text-green-400
                        animate-phone-shake
                    "
                >
                    <FaPhoneAlt className="text-lg" />
                </div>

                {/* Số điện thoại */}
                <span
                    className="
                        ml-none lg:ml-3 xl:ml-3
                        text-white
                        font-semibold
                        text-sm
                        whitespace-nowrap
                        overflow-hidden
                        transition-all duration-300
                        max-w-none sm:max-w-none lg:max-w-[200px] xl:max-w-[200px]
                    "
                >
                    {companyConfig.phone}
                </span>
            </div>
        </div>
    );
};

export default PhoneButton;