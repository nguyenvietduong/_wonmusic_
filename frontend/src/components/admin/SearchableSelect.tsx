'use client';
import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
    /** optional sub-text shown under the label */
    meta?: string;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    /** "light" = white card admin (default), "dark" = dark-bg admin */
    theme?: "light" | "dark";
    /** extra className on the trigger button */
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    onBlur,
    placeholder = "-- Chọn --",
    searchPlaceholder = "Tìm kiếm...",
    disabled = false,
    hasError = false,
    theme = "light",
    className = "",
}: SearchableSelectProps) {
    const [open, setOpen]     = useState(false);
    const [query, setQuery]   = useState("");
    const triggerRef           = useRef<HTMLButtonElement>(null);

    const selected = options.find(o => o.value === value);

    const filtered = query.trim()
        ? options.filter(o =>
              o.label.toLowerCase().includes(query.toLowerCase()) ||
              (o.meta ?? "").toLowerCase().includes(query.toLowerCase())
          )
        : options;

    const handleSelect = (val: string) => {
        onChange(val === value ? "" : val);
        setOpen(false);
        setQuery("");
        onBlur?.();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        onBlur?.();
    };

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    /* ── Derived class strings by theme ── */
    const isLight = theme === "light";

    const triggerBase = isLight
        ? `w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-3 text-sm text-left transition-all outline-none cursor-pointer ${
              hasError
                  ? "border-red-400 ring-2 ring-red-100 bg-white"
                  : open
                  ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                  : "border-gray-300 bg-white hover:border-gray-400"
          }`
        : `w-full flex items-center justify-between gap-2 rounded-[11px] px-[14px] py-[11px] text-sm text-left transition-all outline-none cursor-pointer ${
              hasError
                  ? "border border-red-400/55 bg-red-500/5"
                  : open
                  ? "border border-green-400/45 bg-green-500/4"
                  : "border border-white/[.08] bg-white/[.04] hover:border-white/[.14] hover:bg-white/[.06]"
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
        ? "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors data-[selected=true]:bg-indigo-50 hover:bg-gray-50"
        : "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors data-[selected=true]:bg-green-500/10 hover:bg-white/[.04]";

    const labelText = isLight
        ? (selected ? "text-gray-900" : "text-gray-400")
        : (selected ? "text-white/90"  : "text-white/25");

    const iconColor = isLight ? "text-gray-400" : "text-white/25";
    const checkColor = isLight ? "text-indigo-600" : "text-green-400";
    const searchIconColor = isLight ? "text-gray-400" : "text-white/25";

    return (
        <Popover.Root open={open} onOpenChange={v => { setOpen(v); if (!v) onBlur?.(); }}>
            <Popover.Trigger asChild>
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    className={`${triggerBase} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <span className={`flex-1 truncate ${labelText}`}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                        {selected && (
                            <span
                                role="button"
                                tabIndex={-1}
                                onClick={handleClear}
                                className={`${iconColor} hover:opacity-70 transition-opacity p-0.5 rounded`}
                            >
                                <X size={12} />
                            </span>
                        )}
                        <ChevronDown
                            size={14}
                            className={`${iconColor} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                    </span>
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
                        {/* Search input */}
                        <div className={inputWrap}>
                            <Search size={13} className={searchIconColor} />
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

                        <Command.List className="max-h-[220px] overflow-y-auto p-2">
                            <Command.Empty className={emptyText}>
                                Không tìm thấy kết quả
                            </Command.Empty>

                            {filtered.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <Command.Item
                                        key={opt.value}
                                        value={opt.value}
                                        onSelect={() => handleSelect(opt.value)}
                                        data-selected={isSelected}
                                        className={itemBase}
                                    >
                                        <span className={`flex-1 min-w-0 ${isLight ? "text-gray-700" : "text-white/75"}`}>
                                            <span className="block truncate font-medium">{opt.label}</span>
                                            {opt.meta && (
                                                <span className={`block text-xs truncate ${isLight ? "text-gray-400" : "text-white/30"}`}>
                                                    {opt.meta}
                                                </span>
                                            )}
                                        </span>
                                        {isSelected && (
                                            <Check size={14} className={`${checkColor} flex-shrink-0`} />
                                        )}
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
