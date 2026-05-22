import React, { useState } from 'react';
import { Underline } from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { Highlight } from '@tiptap/extension-highlight';
import { StarterKit } from '@tiptap/starter-kit';
import { ImagePlus, Palette, Bold, Highlighter, UnderlineIcon, Italic } from 'lucide-react';
import { toast } from 'sonner';

interface RichTextEditorProps {
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    label?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label }) => {
    const [showColors, setShowColors] = useState(false);
    const [showHighlightColors, setShowHighlightColors] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Image.configure({
                HTMLAttributes: {
                    class: 'w-full rounded-3xl my-8 shadow-lg',
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[250px] p-6 text-black leading-relaxed overflow-y-auto',
            },
        },
    });

    if (!editor) return null;

    // 1. Thêm hàm helper này bên ngoài component hoặc bên trong handleAddImage
    const transformDriveUrl = (url: string): string => {
        // Regex tìm ID file Drive chuẩn xác
        const driveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

        if (url.includes('drive.google.com') && driveIdMatch) {
            const fileId = driveIdMatch[1];
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        }

        return url;
    };

    // 2. Cập nhật hàm handleAddImage bên trong component của bạn
    const handleAddImage = () => {
        if (imageUrl) {
            const finalUrl: string = transformDriveUrl(imageUrl);

            editor?.chain()
                .focus()
                .insertContent([
                    { type: 'paragraph' },
                    {
                        type: 'image',
                        attrs: { src: finalUrl }
                    },
                    { type: 'paragraph' },
                ])
                .focus('end')
                .run();

            setImageUrl('');
            setShowImageInput(false);
            toast.success('Đã thêm ảnh thành công!');
        } else {
            toast.error('Vui lòng nhập link!');
        }
    };
    
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}

            <div className="border-2 border-slate-200 focus-within:border-blue-500 transition-all bg-white shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-2 border-b border-slate-200">
                    {/* Nút Bold (Đã có) */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded shadow-sm transition-all ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'hover:bg-white text-slate-600'}`}
                    >
                        <Bold size={16} />
                    </button>

                    {/* Nút Italic - Chữ nghiêng */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded shadow-sm transition-all ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'hover:bg-white text-slate-600'}`}
                    >
                        <Italic size={16} />
                    </button>

                    {/* Nút Underline - Gạch chân */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded shadow-sm transition-all ${editor.isActive('underline') ? 'bg-blue-500 text-white' : 'hover:bg-white text-slate-600'}`}
                    >
                        <UnderlineIcon size={16} />
                    </button>

                    <div className="w-px h-6 bg-slate-300 mx-1"></div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowHighlightColors(!showHighlightColors)}
                            className={`w-8 h-8 flex items-center justify-center rounded shadow-sm transition-all ${editor.isActive('highlight') ? 'bg-yellow-200' : 'hover:bg-white text-slate-600'}`}
                        >
                            <Highlighter size={16} style={{ color: editor.getAttributes('highlight').color || 'inherit' }} />
                        </button>

                        {showHighlightColors && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowHighlightColors(false)}></div>
                                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 w-48 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Tùy chỉnh nền</p>
                                        <label className="flex items-center gap-2 w-full p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer border border-dashed border-slate-200">
                                            <input
                                                type="color"
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                                onInput={(e) => {
                                                    editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run();
                                                }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600">Màu bất kỳ</span>
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().unsetHighlight().run();
                                            setShowHighlightColors(false);
                                        }}
                                        className="w-full mt-3 py-1.5 text-[10px] font-black uppercase bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        Bỏ highlight
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-300 mx-1"></div>

                    {/* Color Palette */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowColors(!showColors)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm"
                            style={{ color: editor.getAttributes('textStyle').color || 'black' }}
                        >
                            <Palette size={16} />
                        </button>

                        {showColors && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowColors(false)}></div>
                                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 w-48 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Màu tùy chỉnh</p>
                                        <label className="flex items-center gap-2 w-full p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-dashed border-slate-200">
                                            <input
                                                type="color"
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                                onInput={(e) => {
                                                    editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
                                                }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600">Chọn màu bất kỳ</span>
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().unsetColor().run();
                                            setShowColors(false);
                                        }}
                                        className="w-full mt-3 py-1.5 text-[10px] font-black uppercase bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        Xóa màu
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative ml-auto">
                        <button
                            type="button"
                            onClick={() => setShowImageInput(!showImageInput)}
                            className="flex items-center gap-2 px-3 py-1 bg-green-700 text-white rounded-md text-[10px] font-black hover:bg-green-800 transition-all"
                        >
                            <ImagePlus size={12} /> ẢNH
                        </button>

                        {showImageInput && (
                            <>
                                {/* Lớp phủ để click ra ngoài thì đóng */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowImageInput(false)}></div>

                                {/* Ô nhập liệu hiện ngay bên dưới nút */}
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 animate-in fade-in slide-in-from-top-1">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Chèn hình ảnh từ URL</p>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Dán link ảnh tại đây..."
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddImage();
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setShowImageInput(false); setImageUrl(''); }}
                                                className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 rounded"
                                            >
                                                HỦY
                                            </button>
                                            <button
                                                onClick={handleAddImage}
                                                className="px-3 py-1 text-[10px] font-bold bg-green-700 text-white rounded hover:bg-green-800"
                                            >
                                                CHÈN ẢNH
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Editor Content */}
                <EditorContent editor={editor} />
            </div>

            <style>
                {`
                    .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #adb5bd;
                        pointer-events: none;
                        height: 0;
                    }
                `}
            </style>
        </div>
    );
};

export default RichTextEditor;