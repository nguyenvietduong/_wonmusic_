import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "vi" | "en";

interface LanguageState {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            lang: "vi", // mặc định
            setLang: (lang) => set({ lang }),
        }),
        {
            name: "user-language", // localStorage key
        }
    )
);
