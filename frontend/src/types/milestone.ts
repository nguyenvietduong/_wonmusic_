import type { MilestoneLocaleKey } from "./milestoneLocaleKey";


export interface Milestone {
    year: string;
    icon: React.ReactNode;
    color: string;
    shadow: string;
    localeKey: MilestoneLocaleKey;
}