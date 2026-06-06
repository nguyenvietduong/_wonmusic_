import React from 'react';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
    id: string | number;
    title: string;
    excerpt: string;
    thumbnail: string;
    date: string;
    category?: string;
    slug: string;
}

const BlogCard: React.FC<{ post: BlogPost; typeDetail: "blog" | "tuyen-dung" }> = ({ post, typeDetail }) => {
    return (
        <Link href={`/${typeDetail}/${post.slug}`}>
            <article className="group bg-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 md:gap-8 p-4 border border-[rgba(255,255,255,0.1)] shadow-sm hover:shadow-xl hover:shadow-[rgba(0,169,143,0.15)] hover:border-[rgba(0,169,143,0.3)] transition-all duration-500 md:h-64">
                {/* Thumbnail */}
                <div className="w-full md:w-2/5 h-48 md:h-full overflow-hidden rounded-xl shrink-0">
                    <img
                        src={post.thumbnail}
                        className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-700"
                        alt={post.title}
                    />
                </div>

                {/* Content */}
                <div className="w-full md:w-3/5 py-2 flex flex-col justify-between overflow-hidden">
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-3 mb-3 shrink-0">
                            <span className="px-3 py-1 bg-[rgba(0,169,143,0.15)] text-[#34D4B8] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[rgba(0,169,143,0.25)]">
                                {post.category || "Tin tức"}
                            </span>
                            <div className="flex items-center gap-1 text-[#B3B3B3] text-xs font-medium">
                                <Calendar size={12} />
                                {post.date}
                            </div>
                        </div>

                        <h2 className="text-xl font-extrabold text-white group-hover:text-[#34D4B8] transition-colors leading-tight mb-3 line-clamp-2 h-[3.5rem] overflow-hidden">
                            {post.title}
                        </h2>

                        <p className="text-[#B3B3B3] text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
                            {post.excerpt}
                        </p>
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default BlogCard;