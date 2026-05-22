// src/services/trackService.ts
import axios from "axios";

const api = import.meta.env.MODE === "development"
    ? "http://localhost:2004/api"
    : "https://wonmusic-api.up.railway.app/api";

// ─── Types ───────────────────────────────────────────────
export interface Artist {
    _id:      string;
    name:     string;
    avatar?:  string;
    verified: boolean;
}

export interface Album {
    _id:      string;
    title:    string;
    coverUrl?: string;
}

export interface Track {
    _id:          string;
    title:        string;
    artistId:     Artist;
    albumId?:     Album;
    audioUrl:     string;
    coverUrl?:    string;
    duration:     number;
    genre?:       string;
    releaseYear?: number;
    plays:        number;
    isPublished:  boolean;
    lyrics?:      string;
    createdAt:    string;
}

export interface PaginationMeta {
    page:  number;
    limit: number;
    total: number;
}

export interface PaginatedResponse<T> {
    success:    boolean;
    data:       T[];
    pagination: PaginationMeta;
}

// ─── Service ─────────────────────────────────────────────
export const trackService = {

    // GET /api/tracks
    getAll: async (params?: {
        page?:     number;
        limit?:    number;
        artistId?: string;
        albumId?:  string;
        genre?:    string;
    }): Promise<PaginatedResponse<Track>> => {
        const res = await axios.get(`${api}/tracks`, { params });
        return res.data;
    },

    // GET /api/tracks/top?limit=10
    getTop: async (limit: number = 10): Promise<Track[]> => {
        const res = await axios.get(`${api}/tracks/top`, { params: { limit } });
        return res.data.data;
    },

    // GET /api/tracks/search?q=keyword
    search: async (q: string, limit: number = 10): Promise<Track[]> => {
        if (!q.trim()) return [];
        const res = await axios.get(`${api}/tracks/search`, { params: { q, limit } });
        return res.data.data;
    },

    // GET /api/tracks/:id
    getById: async (id: string): Promise<Track> => {
        const res = await axios.get(`${api}/tracks/${id}`);
        return res.data.data;
    },

    // PATCH /api/tracks/:id/play — tăng lượt nghe
    incrementPlays: async (id: string): Promise<void> => {
        await axios.patch(`${api}/tracks/${id}/play`).catch(() => {});
    },

    // POST /api/tracks
    create: async (data: Partial<Track>): Promise<Track> => {
        const res = await axios.post(`${api}/tracks`, data);
        return res.data.data;
    },

    // PUT /api/tracks/:id
    update: async (id: string, data: Partial<Track>): Promise<Track> => {
        const res = await axios.put(`${api}/tracks/${id}`, data);
        return res.data.data;
    },

    // DELETE /api/tracks/:id
    delete: async (id: string): Promise<void> => {
        await axios.delete(`${api}/tracks/${id}`);
    },
};