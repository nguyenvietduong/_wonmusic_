'use client';
import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: SelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
    onBlur?: () => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    theme?: "light" | "dark";
    maxChips?: number;
    className?: string;
}

export function MultiSelect({
    options,
    values,
    onChange,
    onBlur,
    placeholder = "-- Chọn --",
    searchPlaceholder = "Tìm kiếm...",
    disabled = false,
    hasError = false,
    theme = "light",
    maxChips = 3,
    className = "",
}: MultiSelectProps) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState("");
    const triggerRef        = useRef<HTMLButtonElement>(null);

    const filtered = query.trim()
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const toggle = (val: string) => {
        onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val]);
    };

    const removeChip = (e: React.MouseEvent, val: string) => {
        e.stopPropagation();
        onChange(values.filter(v => v !== val));
    };

    useEffect(() => { if (!open) { setQuery(""); onBlur?.(); } }, [open]);

    const isLight = theme === "light";

    const triggerBase = isLight
        ? `w-full flex items-center gap-2 border rounded-xl px-3 py-2 text-sm text-left transition-all outline-none cursor-pointer min-h-[46px] ${
              hasError ? "border-red-400 ring-2 ring-red-100 bg-white"
              : open    ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                        : "border-gray-300 bg-white hover:border-gray-400"
          }`
        : `w-full flex items-center gap-2 rounded-[11px] px-3 py-2 text-sm text-left transition-all outline-none cursor-pointer min-h-[46px] ${
              hasError ? "border border-red-400/55 bg-red-500/5"
              : open    ? "border border-green-400/45 bg-green-500/4"
                        : "border border-white/[.08] bg-white/[.04] hover:border-white/[.14]"
          }`;

    const contentBase = isLight
        ? "bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
        : "bg-[#0f1a10] border border-white/[.08] rounded-2xl shadow-xl z-50 overflow-hidden";

    const inputBase = isLight
        ? "w-full border-0 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
        : "w-full border-0 outline-none text-sm text-white/90 placeholder-white/25 bg-transparent";

    const inputWrap = isLight
        ? "flex items-center gap-2 px-3 py-2.5 border-b border-gray-100"
        : "flex items-center gap-2 px-3 py-2.5 border-b border-white/[.06]";

    const emptyText = isLight
        ? "text-gray-400 text-sm text-center py-6"
        : "text-white/25 text-sm text-center py-6";

    const itemBase = isLight
        ? "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors data-[selected=true]:bg-indigo-50 hover:bg-gray-50"
        : "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors data-[selected=true]:bg-green-500/10 hover:bg-white/[.04]";

    const chipBase = isLight
        ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700"
        : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400";

    const iconColor = isLight ? "text-gray-400" : "text-white/25";
    const checkColor = isLight ? "text-indigo-600" : "text-green-400";
    const checkboxBase = isLight
        ? "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        : "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors";

    const visibleChips = values.slice(0, maxChips);
    const extraCount   = values.length - maxChips;

    return (
        <Popover.Root open={open} onOpenChange={v => { setOpen(v); }}>
            <Popover.Trigger asChild>
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    className={`${triggerBase} ${className} disabled:opacity-50 disabled:cursor-not-allowed flex-wrap`}
                >
                    <span className="flex-1 flex flex-wrap gap-1 items-center min-w-0">
                        {values.length === 0 ? (
                            <span className={isLight ? "text-gray-400" : "text-white/25"}>{placeholder}</span>
                        ) : (
                            <>
                                {visibleChips.map(v => {
                                    const opt = options.find(o => o.value === v);
                                    return (
                                        <span key={v} className={chipBase}>
                                            {opt?.label ?? v}
                                            <span
                                                role="button"
                                                tabIndex={-1}
                                                onClick={e => removeChip(e, v)}
                                                className="hover:opacity-70 transition-opacity"
                                            >
                                                <X size={10} />
                                            </span>
                                        </span>
                                    );
                                })}
                                {extraCount > 0 && (
                                    <span className={`${chipBase} opacity-70`}>+{extraCount}</span>
                                )}
                            </>
                        )}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`${iconColor} transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
                    />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions
                    style={{ width: triggerRef.current?.offsetWidth ?? 200 }}
                    className={contentBase}
                    onOpenAutoFocus={e => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
                        {/* Search */}
                        <div className={inputWrap}>
                            <Search size={13} className={iconColor} />
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                placeholder={searchPlaceholder}
                                className={inputBase}
                            />
                            {query && (
                                <button onClick={() => setQuery("")} className={`${iconColor} flex-shrink-0`}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Selected count + clear */}
                        {values.length > 0 && (
                            <div className={`flex items-center justify-between px-3 py-2 ${isLight ? "border-b border-gray-100 bg-gray-50/60" : "border-b border-white/[.05] bg-white/[.02]"}`}>
                                <span className={`text-xs font-semibold ${isLight ? "text-indigo-600" : "text-green-400"}`}>
                                    {values.length} đã chọn
                                </span>
                                <button
                                    onClick={() => onChange([])}
                                    className={`text-xs ${isLight ? "text-gray-400 hover:text-red-500" : "text-white/30 hover:text-red-400"} transition-colors`}
                                >
                                    Bỏ hết
                                </button>
                            </div>
                        )}

                        <Command.List className="max-h-[200px] overflow-y-auto p-2">
                            <Command.Empty className={emptyText}>
                                Không tìm thấy kết quả
                            </Command.Empty>

                            {filtered.map(opt => {
                                const isSelected = values.includes(opt.value);
                                return (
                                    <Command.Item
                                        key={opt.value}
                                        value={opt.value}
                                        onSelect={() => toggle(opt.value)}
                                        data-selected={isSelected}
                                        className={itemBase}
                                    >
                                        <div className={`${checkboxBase} ${
                                            isSelected
                                                ? isLight ? "border-indigo-600 bg-indigo-600" : "border-green-400 bg-green-400"
                                                : isLight ? "border-gray-300" : "border-white/20"
                                        }`}>
                                            {isSelected && <Check size={10} className="text-white" />}
                                        </div>
                                        <span className={`flex-1 truncate ${isLight ? "text-gray-700" : "text-white/75"}`}>
                                            {opt.label}
                                        </span>
                                    </Command.Item>
                                );
                            })}
                        </Command.List>
                    </Command>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
