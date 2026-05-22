// layouts/FrontendLayout.tsx
import { Outlet } from "react-router";

import Navbar from "@/components/frontend/Navbar";
import PhoneButton from "@/components/frontend/PhoneButton";
import ScrollToTopButton from "@/components/frontend/ScrollToTopButton";
import PlayerBar from "@/components/frontend/PlayerBar";
import Footer from "@/components/frontend/Footer";

export default function FrontendLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-[#191B24]">
            <PhoneButton />
            <ScrollToTopButton />
            <Navbar />
            <div className="flex-1">
                <Outlet />
            </div>
            <PlayerBar />
            <Footer />
        </div>
    );
}