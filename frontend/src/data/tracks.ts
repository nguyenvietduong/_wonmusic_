// src/data/tracks.ts
import type { Track } from "@/stores/usePlayerStore";

export interface TrackWithArtist extends Track {
    artistId: string;
}

export const TRACKS: TrackWithArtist[] = [
    {
        id: "track-1",
        artistId: "artist-1",
        title: "Nơi Này Có Anh",
        artist: "Sơn Tùng M-TP",
        album: "Sky Tour",
        duration: 258,
        audioUrl: "/audio/noinaycoanh.mp3",
        coverUrl: "/covers/noinaycoanh.jpg",
        genre: "Pop",
        releaseYear: 2017,
        plays: 24000000,
    },
    {
        id: "track-2",
        artistId: "artist-1",
        title: "Lạc Trôi",
        artist: "Sơn Tùng M-TP",
        album: "Sky Tour",
        duration: 235,
        audioUrl: "/audio/lactroi.mp3",
        coverUrl: "/covers/lactroi.jpg",
        genre: "Pop",
        releaseYear: 2017,
        plays: 18000000,
    },
    {
        id: "track-3",
        artistId: "artist-2",
        title: "Để Mị Nói Cho Mà Nghe",
        artist: "Hoàng Thùy Linh",
        album: "HOÀNG",
        duration: 210,
        audioUrl: "/audio/deminoichomanghe.mp3",
        coverUrl: "/covers/deminoichomanghe.jpg",
        genre: "Pop / Folk",
        releaseYear: 2019,
        plays: 15000000,
    },
];