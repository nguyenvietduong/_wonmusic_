import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-2 pt-12">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#34D4B8] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={20} />
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === page
                            ? "bg-[#00A98F] text-white"
                            : "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-[#B3B3B3] hover:border-[#00A98F] hover:text-[#34D4B8]"
                    }`}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#34D4B8] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Pagination;