// import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";

// Pages - Frontend
import HomePage from "./pages/frontend/HomePage";
import ArtistsPage from "./pages/frontend/ArtistsPage";
import ArtistDetailPage from "./pages/frontend/ArtistDetailPage";
import ChartsPage from "./pages/frontend/ChartsPage";
import SearchPage from "./pages/frontend/SearchPage";

import AboutPage from "./pages/frontend/AboutPage";
import ContactPage from "./pages/frontend/ContactPage";
// Pages - Backend/Admin
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminTracksPage from "./pages/admin/tracks/AdminTracksPage";
import AdminTrackDetailPage from "./pages/admin/tracks/AdminTrackDetailPage";
import AdminTrackCreatePage from "./pages/admin/tracks/AdminTrackCreatePages";
import AdminTrackEditPage from "./pages/admin/tracks/AdminTrackEditPages";
import AdminArtistsPage from "./pages/admin/artists/AdminArtistsPage";
import AdminArtistCreatePage from "./pages/admin/artists/AdminArtistCreatePage";
import AdminArtistDetailPage from "./pages/admin/artists/AdminArtistDetailPage";
import AdminArtistEditPage from "./pages/admin/artists/AdminArtistEditPage";
import AdminStatsPage from "./pages/admin/AdminStatsPage";

// Components
import FrontendLayout from "./pages/layouts/FrontendLayout";
import AdminLayout from "./pages/layouts/AdminLayout";
import NotFoundPage from "./pages/frontend/NotFoundPage";

import AuthLayout from "./pages/layouts/AuthLayout";
import SigninPage from "./pages/auth/SignInPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// import SignUpPage from "./pages/auth/SignUpPage";

function App() {
    // useEffect(() => {
    //     const showWarning = () => {
    //         toast.success("Liên hệ ngay để nhận tư vấn về bản quyền âm nhạc.", {
    //             duration: 2000,
    //         });
    //     };

    //     const handleKey = (e: KeyboardEvent) => {
    //         // F12
    //         if (e.key === "F12") {
    //             e.preventDefault();
    //             showWarning();
    //         }

    //         // Ctrl + Shift + (I, J, C)
    //         if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
    //             e.preventDefault();
    //             showWarning();
    //         }

    //         // Ctrl + U
    //         if (e.ctrlKey && e.key.toUpperCase() === "U") {
    //             e.preventDefault();
    //             showWarning();
    //         }
    //     };

    //     const handleContext = (e: MouseEvent) => {
    //         e.preventDefault();
    //         showWarning();
    //     };

    //     document.addEventListener("keydown", handleKey);
    //     document.addEventListener("contextmenu", handleContext);

    //     return () => {
    //         document.removeEventListener("keydown", handleKey);
    //         document.removeEventListener("contextmenu", handleContext);
    //     };
    // }, []);

    return (
        <>
            {/* ====================== */}
            {/* Toast Notifications */}
            {/* ====================== */}
            <Toaster richColors />
            <BrowserRouter>
                <Routes>
                    {/* ── Auth ── */}
                    <Route element={<AuthLayout />}>
                        <Route path="/signin" element={<SigninPage />} />
                    </Route>

                    {/* ====================== */}
                    {/* Frontend Protected Routes */}
                    {/* ====================== */}
                    {/* Không bắt buộc phải đăng nhập */}
                    <Route element={<ProtectedRoute skipRedirect />}>
                        <Route element={<FrontendLayout />}>
                            {/* ====================== */}
                            {/* Phim / Routes */}
                            {/* ====================== */}
                            <Route path="/"             element={<HomePage />} />
                            <Route path="/artists"      element={<ArtistsPage />} />
                            <Route path="/artists/:id"  element={<ArtistDetailPage />} />
                            <Route path="/charts"       element={<ChartsPage />} />
                            <Route path="/search"       element={<SearchPage />} />

                            <Route path="/gioi-thieu"   element={<AboutPage />} />
                            <Route path="/lien-he"      element={<ContactPage />} />
                        </Route>
                    </Route>

                    <Route element={<ProtectedRoute requireAdmin />}>
                        <Route element={<AdminLayout />}>
                            {/* ====================== */}
                            {/* Phim / Routes */}
                            {/* ====================== */}
                            <Route path="/admin"                    element={<AdminHomePage />} />
                            <Route path="/admin/tracks"             element={<AdminTracksPage />} />
                            <Route path="/admin/tracks/new"         element={<AdminTrackCreatePage />} />
                            <Route path="/admin/tracks/:id"         element={<AdminTrackDetailPage />} />
                            <Route path="/admin/tracks/:id/edit"    element={<AdminTrackEditPage />} />
                            <Route path="/admin/artists"            element={<AdminArtistsPage />} />
                            <Route path="/admin/artists/new"        element={<AdminArtistCreatePage />} />
                            <Route path="/admin/artists/:id"        element={<AdminArtistDetailPage />} />
                            <Route path="/admin/artists/:id/edit"   element={<AdminArtistEditPage />} />
                            <Route path="/admin/charts"             element={<AdminStatsPage />} />
                        </Route>
                    </Route>

                    {/* ====================== */}
                    {/* 404 / Fallback Route */}
                    {/* ====================== */}
                    <Route path="*" element={<NotFoundPage />} />

                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;