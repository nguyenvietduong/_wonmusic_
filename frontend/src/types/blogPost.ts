export type PostType = "blog" | "tuyen-dung" | "su-kien"; // Thêm các loại bạn muốn

export interface BlogPost {
    id: string;
    slug: string;
    date: string;
    author: string;
    category: string; // Nhãn hiển thị (VD: "Tin tức", "Văn hóa")
    type: PostType;   // Dùng để lọc trang (VD: "blog", "tuyen-dung")
    thumbnail: string;
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    isHome: boolean;
}