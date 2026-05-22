import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { navbarText } from '@/locales/navbar';

interface BreadcrumbPath {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    paths: BreadcrumbPath[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ paths }) => {
    const { lang } = useLanguageStore();
    const t = navbarText[lang];

    return (
        <nav className="flex items-center text-sm text-slate-400 mb-8 overflow-hidden group">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">

                {/* 1. Nút Home luôn cố định */}
                <a
                    href="/"
                    className="flex items-center gap-1 hover:text-green-700 transition-all duration-300 shrink-0"
                >
                    <Home size={14} className="mb-0.5" />
                    <span className="hidden md:inline-block font-medium">{t.home}</span>
                </a>

                {/* 2. Duyệt qua mảng paths */}
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;

                    return (
                        <div key={index} className="flex items-center gap-2 shrink-0">
                            <ChevronRight size={14} className="text-slate-300 shrink-0" />

                            {isLast ? (
                                // Cấp cuối cùng: Luôn đậm, giới hạn độ dài nếu tên quá dài
                                <span className="text-slate-900 font-bold tracking-tight max-w-[150px] md:max-w-[300px] truncate">
                                    {path.label}
                                </span>
                            ) : (
                                // Các cấp trung gian
                                <a
                                    href={path.href || "#"}
                                    className="hover:text-green-700 hover:underline decoration-green-200 underline-offset-4 transition-all duration-300 font-medium"
                                >
                                    {path.label}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
};

export default Breadcrumb;