import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
    skipRedirect?: boolean; // nếu true → không redirect về /signin
    requireAdmin?: boolean; // nếu true → chỉ cho phép user có role === 'admin'
}

const ProtectedRoute = ({ skipRedirect = false, requireAdmin = false }: ProtectedRouteProps) => {
    const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
    const [starting, setStarting] = useState(true);

    const init = async () => {
        if (!accessToken) {
            await refresh();
        }

        if (accessToken && !user) {
            await fetchMe();
        }

        setStarting(false);
    };

    useEffect(() => {
        init();
    }, []);

    if (starting || loading) {
        return (<></>);
    }

    if (!accessToken && !skipRedirect) {
        return <Navigate to="/" replace />;
    }

    // Chặn non-admin nếu route yêu cầu quyền admin
    // Chỉ chặn khi backend trả về role (role !== undefined) để tránh breaking change
    if (requireAdmin && user?.role !== undefined && user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;