import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Copy, Code2, X, Calendar, User, Facebook, LinkIcon } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export type PostType = "blog" | "tuyen-dung" | "su-kien";

interface BlogPost {
    id: string;
    slug: string;
    date: string;
    author: string;
    category: string;
    type: PostType;
    thumbnail: string;
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    isHome: boolean;
}

// 1. ĐƯA MODAL RA NGOÀI VÀ NHẬN PROPS
const PreviewModal = ({ isOpen, onClose, jsonResult }: { isOpen: boolean, onClose: () => void, jsonResult: string }) => {
    if (!isOpen || !jsonResult) return null;

    let previewData: any;
    try {
        previewData = JSON.parse(jsonResult);
    } catch (e) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-10">
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-6xl h-full overflow-y-auto rounded-none shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col selection:bg-green-500 selection:text-white">

                {/* 1. Thanh điều khiển (Sticky Header) */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center z-50">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Chế độ xem trước giao diện thực tế</span>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1">
                    {/* 2. Giả lập Progress Bar */}
                    <div className="sticky top-[73px] left-0 right-0 h-1 bg-green-500 z-40" />

                    {/* 3. Hero Section (Giống PostDetailPage) */}
                    <section className="relative h-[40vh] w-full overflow-hidden bg-slate-900">
                        <img
                            src={previewData.thumbnail}
                            alt={previewData.title}
                            className="w-full h-full object-cover opacity-60"
                        />
                    </section>

                    {/* 4. Content Area (Copy cấu trúc trang Detail) */}
                    <div className="container mx-auto px-6 pt-12">
                        {/* Title Section */}
                        <div className="max-w-4xl mx-auto mb-10 text-left">
                            <h1 className="text-2xl md:text-2xl font-black text-slate-900 leading-tight mb-6">
                                {previewData.title}
                            </h1>

                            <div className="flex gap-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-green-500" /> {previewData.date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-green-500" /> {previewData.author}
                                </div>
                            </div>
                        </div>

                        {/* Article Content Section */}
                        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
                            {/* Left Social Icons giả lập */}
                            <aside className="hidden lg:block lg:col-span-1">
                                <div className="sticky top-40 flex flex-col items-center gap-6 opacity-30">
                                    <Facebook size={18} />
                                    <LinkIcon size={18} />
                                </div>
                            </aside>

                            {/* Main Content (Trái tim của bài viết) */}
                            <div className="lg:col-span-11">
                                <article className="prose prose-slate prose-xl max-w-none 
                                    prose-p:text-slate-600 prose-p:leading-[1.9] 
                                    prose-headings:text-slate-900 prose-headings:font-black
                                    prose-img:rounded-[2rem] prose-img:shadow-xl">
                                    <div
                                        className="preview-article-body"
                                        dangerouslySetInnerHTML={{ __html: previewData.content }}
                                    />
                                </article>

                                {/* Tags Section */}
                                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap gap-2">
                                    {previewData.tags?.map((tag: string) => (
                                        <span key={tag} className="px-4 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-lg">
                                            # {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPostForm: React.FC = () => {
    const [formData, setFormData] = useState({
        title: "",
        category: "Văn hóa Won",
        type: "blog" as PostType,
        author: "Won Media Team",
        date: new Date().toISOString().split('T')[0], // Thêm dòng này (Mặc định ngày hiện tại)
        thumbnail: "",
        excerpt: "",
        content: "",
        tags: "",
        isHome: false,
        jobLocation: "Toà Audi Hà Nội, số 8 Phạm Hùng, Hà Nội",
        jobEmail: "tuyendung@wonmedia.vn"
    });

    const [jsonResult, setJsonResult] = useState<string>("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const generateSlug = (text: string): string => {
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/([^0-9a-z-\s])/g, "").replace(/(\s+)/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    };

    // --- LOGIC SINH NỘI DUNG THEO TEMPLATE ---
    useEffect(() => {
        const buildPreview = () => {
            let finalContent = "";
            const lines = formData.content.split('\n').filter(l => l.trim() !== "");

            if (formData.type === "tuyen-dung") {
                // TEMPLATE CHO TUYỂN DỤNG
                finalContent = `
        <div class="job-detail-content space-y-8 text-gray-700 leading-relaxed">
            <section>
                <p class="text-lg">
                    <strong class="text-[#0b2a59]">Won Media</strong> – đơn vị sản xuất nội dung sáng tạo và truyền thông đa nền tảng – đang tìm kiếm đồng đội nhiệt huyết cho vị trí <strong>${formData.title}</strong>.
                </p>
                <div class="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl">
                    <span class="text-xs uppercase font-bold text-blue-600">Vị trí ứng tuyển</span>
                    <p class="text-xl font-bold text-gray-800 uppercase">${formData.title}</p>
                </div>
            </section>

            <section class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 class="text-xl font-bold text-gray-900 mb-4 italic">📍 Thông tin làm việc:</h3>
                <ul class="space-y-3">
                    <li class="flex items-start gap-2">
                        <span class="text-green-600 font-bold">●</span>
                        <span><strong>Địa điểm:</strong> ${formData.jobLocation}</span>
                    </li>
                    <li class="flex items-start gap-2 bg-green-100 p-2 rounded-lg border border-green-200">
                        <span class="text-xl">🎁</span>
                        <span class="text-green-800"><strong>Chế độ:</strong> Nghỉ thêm 2 ngày Thứ 7 (tuần 1 và tuần 3 hàng tháng).</span>
                    </li>
                </ul>
            </section>

            <section>
                <h3 class="text-2xl font-black text-green-700 mb-4 flex items-center gap-2">
                    <span class="w-2 h-8 bg-green-700 rounded-full"></span>
                    Mô tả & Yêu cầu
                </h3>
                <div class="prose prose-slate max-w-none">
                    ${lines.map(line => line.trim().startsWith('<img') ? line : `<p>${line}</p>`).join('\n')}
                </div>
            </section>

            <section class="border-t-2 border-dashed border-gray-200 pt-8 text-center">
                <h3 class="text-2xl font-black text-[#0b2a59] mb-4 uppercase">Cách thức ứng tuyển</h3>
                <div class="inline-block bg-blue-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    Gửi CV về email: <strong>${formData.jobEmail}</strong>
                </div>
                <p class="mt-4 font-medium">Tiêu đề: <span class="text-blue-600">[Họ tên] – Ứng tuyển [${formData.title}]</span></p>
                <p class="mt-10 italic text-gray-400 text-sm">Won Media – Nơi biến ý tưởng sáng tạo thành những giá trị truyền thông khác biệt.</p>
            </section>
                </div>`;
            } else {
                // TEMPLATE CHO BLOG THƯỜNG
                finalContent = `
                    <div class="blog-content">
                        ${lines.map(line => line.trim().startsWith('<img') ? line : `<p>${line}</p>`).join('\n            ')}
                    </div>
                `;
            }

            const previewObject: BlogPost = {
                id: "ID_AUTO_GENERATE",
                slug: generateSlug(formData.title),
                // Chuyển đổi định dạng từ YYYY-MM-DD sang DD/MM/YYYY để hiển thị đẹp trên Web
                date: formData.date.split('-').reverse().join('/'),
                author: formData.type === "tuyen-dung" ? "HR Department" : formData.author,
                category: formData.type === "tuyen-dung" ? "Tuyển dụng" : (formData.type === "blog" ? "Tin tức" : "Sự kiện"),
                type: formData.type,
                thumbnail: formData.thumbnail || "/posts/default.jpg",
                title: formData.title.toUpperCase(),
                excerpt: formData.excerpt,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
                isHome: formData.isHome,
                content: finalContent
            };
            setJsonResult(JSON.stringify(previewObject, null, 4));
        };

        buildPreview();
    }, [formData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        // --- LOGIC MỚI CHO THUMBNAIL ---
        if (name === "thumbnail") {
            val = transformDriveUrl(value as string);
        }
        // -------------------------------

        if (name === "date") {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                toast.error("Không được chọn ngày trong tương lai!");
                val = new Date().toISOString().split("T")[0];
            }
        }
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const transformDriveUrl = (url: string): string => {
        // Regex tìm ID file Drive
        const driveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

        if (url.includes('drive.google.com') && driveIdMatch) {
            const fileId = driveIdMatch[1];
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        }
        return url;
    };

    const handleCopyJSON = () => {
        try {
            const finalObj = JSON.parse(jsonResult);
            finalObj.id = `won-${formData.type}-${Date.now()}`;
            navigator.clipboard.writeText(JSON.stringify(finalObj, null, 4));
            toast.success("🚀 Copy JSON Tuyển dụng thành công!");
        } catch (err) {
            toast.error("Lỗi JSON!");
        }
    };

    return (
        <section className="bg-[#f8fafc] min-h-screen py-12 px-4 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 text-left">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-2 rounded-full ${formData.type === 'tuyen-dung' ? 'bg-blue-600' : 'bg-green-700'}`}></div>
                        <div>
                            <h2 className="text-3xl font-black text-green-700 uppercase italic">Won Engine v2.5</h2>
                            <p className="text-slate-500 text-sm font-medium">Đang chế độ: {formData.type === 'tuyen-dung' ? '🚀 Tuyển dụng chuyên nghiệp' : '📝 Blog tin tức'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    {/* CỘT TRÁI */}
                    <div className="lg:col-span-8">
                        <form className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-5 border-t-8 border-green-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest ml-1">Loại nội dung</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full mt-1.5 p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100">
                                        <option value="blog">Tin tức / Blog</option>
                                        <option value="tuyen-dung">Tuyển dụng (Template)</option>
                                        <option value="su-kien">Sự kiện</option>
                                    </select>
                                </div>
                                {/* CỘT NGÀY ĐĂNG MỚI THÊM */}
                                <div>
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Ngày đăng bài</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="date"
                                            // Chặn không cho chọn ngày lớn hơn ngày hôm nay
                                            max={new Date().toISOString().split("T")[0]}
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full mt-1.5 p-4 bg-orange-50/50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-orange-100 focus:ring-orange-400 transition-all"
                                        />
                                        <Calendar size={16} className="absolute right-4 top-1/2 translate-y-[-2px] text-orange-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thumbnail</label>
                                <input name="thumbnail" value={formData.thumbnail} onChange={handleChange} className="w-full mt-1.5 p-4 bg-slate-50 rounded-2xl border-none text-xs" placeholder="URL ảnh..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="w-full mt-1.5 p-4 bg-slate-100/50 rounded-2xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500" placeholder="VD: Biên kịch nội dung..." />
                            </div>

                            {formData.type === 'tuyen-dung' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div>
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Địa điểm</label>
                                        <input name="jobLocation" value={formData.jobLocation} onChange={handleChange} className="w-full mt-1.5 p-3 bg-blue-50/50 rounded-xl border-none text-xs font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Email nhận CV</label>
                                        <input name="jobEmail" value={formData.jobEmail} onChange={handleChange} className="w-full mt-1.5 p-3 bg-blue-50/50 rounded-xl border-none text-xs font-bold" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} className="w-full mt-1.5 p-4 bg-slate-50 rounded-2xl border-none h-20 text-sm" />
                            </div>

                            <RichTextEditor
                                label="Nội dung chi tiết"
                                value={formData.content}
                                onChange={(newVal) => setFormData(prev => ({ ...prev, content: newVal }))}
                                placeholder={formData.type === 'tuyen-dung' ? "Nhập mô tả công việc..." : "Viết bài blog..."}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                                    <input name="tags" value={formData.tags} onChange={handleChange} className="w-full mt-1.5 p-3 bg-slate-50 rounded-xl border-none text-xs" placeholder="Tag1, Tag2..." />
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <input type="checkbox" name="isHome" id="isHome" checked={formData.isHome} onChange={handleChange} className="w-5 h-5 accent-green-700" />
                                    <label htmlFor="isHome" className="text-[11px] font-black uppercase text-slate-500 cursor-pointer">Hiện trang chủ</label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={handleCopyJSON}
                                    className="py-5 bg-green-700 text-white font-black rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <Copy size={16} /> Xuất JSON
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsPreviewOpen(true)}
                                    className="py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <ImagePlus size={16} /> Xem Demo
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CỘT PHẢI: PREVIEW */}
                    <div className="lg:col-span-4">
                        <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl sticky top-12 h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                                </div>
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Code2 size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">JSON Output Ready</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                                <pre className="text-blue-300 font-mono text-[12px] leading-relaxed">
                                    {jsonResult}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẢI THÊM DÒNG NÀY Ở ĐÂY */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                jsonResult={jsonResult}
            />
        </section>
    );
};

export default AdminPostForm;
