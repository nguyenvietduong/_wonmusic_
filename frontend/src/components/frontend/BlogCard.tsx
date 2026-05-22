import React from 'react';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router';

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
        <Link to={`/${typeDetail}/${post.slug}`}>
            <article className="group bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 md:gap-8 p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-green-900/5 transition-all duration-500 md:h-64">
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
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                {post.category || "Tin tức"}
                            </span>
                            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                                <Calendar size={12} />
                                {post.date}
                            </div>
                        </div>

                        <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-green-700 transition-colors leading-tight mb-3 line-clamp-2 h-[3.5rem] overflow-hidden">
                            {post.title}
                        </h2>

                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
                            {post.excerpt}
                        </p>
                    </div>
                </div>
            </article>
        </Link>
    );
};

export default BlogCard;