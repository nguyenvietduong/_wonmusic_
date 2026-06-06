// src/services/artistService.ts
import axios from "axios";

const api = '/api';

export interface Artist {
    _id:         string;
    name:        string;
    avatar?:     string;
    bio?:        string;
    genre?:      string;
    followers?:  number;
    verified:    boolean;
    socialLinks?: {
        facebook?:  string;
        instagram?: string;
        youtube?:   string;
        tiktok?:    string;
    };
    createdAt: string;
}

export interface Track {
    _id:         string;
    title:       string;
    artistId:    Artist;
    albumId?:    { _id: string; title: string; coverUrl?: string };
    audioUrl:    string;
    coverUrl?:   string;
    duration:    number;
    genre?:      string;
    releaseYear?: number;
    plays:       number;
    isPublished: boolean;
    lyrics?:     string;
}

export interface PaginationMeta {
    page:  number;
    limit: number;
    total: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data:    T[];
    pagination: PaginationMeta;
}

export const artistService = {

    // Lấy danh sách nghệ sĩ
    getAll: async (params?: {
        page?:  number;
        limit?: number;
        genre?: string;
    }): Promise<PaginatedResponse<Artist>> => {
        const res = await axios.get(`${api}/artists`, { params });
        return res.data;
    },

    // Lấy chi tiết 1 nghệ sĩ
    getById: async (id: string): Promise<Artist> => {
        const res = await axios.get(`${api}/artists/${id}`);
        return res.data.data;
    },

    // Lấy tất cả bài hát của 1 nghệ sĩ
    getTracks: async (
        artistId: string,
        params?: { page?: number; limit?: number }
    ): Promise<PaginatedResponse<Track>> => {
        const res = await axios.get(`${api}/tracks`, {
            params: { artistId, ...params },
        });
        return res.data;
    },

    // Tạo nghệ sĩ mới
    create: async (data: Partial<Artist>): Promise<Artist> => {
        const res = await axios.post(`${api}/artists`, data);
        return res.data.data;
    },

    // Cập nhật nghệ sĩ
    update: async (id: string, data: Partial<Artist>): Promise<Artist> => {
        const res = await axios.put(`${api}/artists/${id}`, data);
        return res.data.data;
    },

    // Xóa nghệ sĩ
    delete: async (id: string): Promise<void> => {
        await axios.delete(`${api}/artists/${id}`);
    },
};