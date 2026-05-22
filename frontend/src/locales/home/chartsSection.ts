export const chartsSectionText = {
    vi: {
        label: "Bảng xếp hạng",
        highlight: "Top",
        heading: "nhạc hot",
        periods: { day: "Hôm nay", week: "Tuần này", month: "Tháng này" } as const,
        error: "Không thể tải bảng xếp hạng",
        retry: "Thử lại",
        viewFull: "Xem bảng xếp hạng đầy đủ →",
        pause: "Dừng",
        play: "Phát",
    },
    en: {
        label: "Charts",
        highlight: "Top",
        heading: "Hot Music",
        periods: { day: "Today", week: "This Week", month: "This Month" } as const,
        error: "Failed to load charts",
        retry: "Try again",
        viewFull: "View full charts →",
        pause: "Pause",
        play: "Play",
    },
} as const;
