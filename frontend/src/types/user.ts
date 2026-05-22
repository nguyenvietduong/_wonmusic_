export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    role?: "admin" | "user";
    createdAt?: string;
    updatedAt?: string;
}