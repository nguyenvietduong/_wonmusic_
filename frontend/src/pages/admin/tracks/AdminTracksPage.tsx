// src/pages/admin/AdminTracksPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
    Music, Search, Plus, Play, Clock, Disc3,
    Edit2, ArrowUpDown, TrendingUp,
} from "lucide-react";
import { trackService } from "@/services/trackService";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};
const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const EQ_H = [40, 70, 55, 85, 45, 75, 60, 90, 50, 65];

type SortKey = "title" | "plays" | "duration" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminTracksPage() {
    const [tracks, setTracks] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("plays");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    useEffect(() => {
        (async () => {
            try {
                const data = await trackService.getAll?.() ?? await trackService.getTop(50);
                setTracks(Array.isArray(data) ? data : data.data ?? []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        let list = [...tracks];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                t =>
                    t.title?.toLowerCase().includes(q) ||
                    t.artistId?.name?.toLowerCase().includes(q) ||
                    t.genre?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        setFiltered(list);
        setPage(1);
    }, [tracks, search, sortKey, sortDir]);

    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("desc"); }
    };

    const totalPlays = tracks.reduce((s, t) => s + (t.plays ?? 0), 0);
    const totalDuration = tracks.reduce((s, t) => s + (t.duration ?? 0), 0);
    const avgPlays = tracks.length ? Math.round(totalPlays / tracks.length) : 0;

    const STATS = [
        { label: "Tổng bài hát", value: tracks.length, icon: Music, color: "#4ade80", bg: "rgba(74,222,128,.1)" },
        { label: "Tổng lượt nghe", value: formatNum(totalPlays), icon: TrendingUp, color: "#60a5fa", bg: "rgba(96,165,250,.1)" },
        { label: "Trung bình nghe", value: formatNum(avgPlays), icon: Play, color: "#f472b6", bg: "rgba(244,114,182,.1)" },
        { label: "Tổng thời lượng", value: formatTime(totalDuration), icon: Clock, color: "#fb923c", bg: "rgba(251,146,60,.1)" },
    ];

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse  { 0%,100%{opacity:.4} 50%{opacity:.8} }
                @keyframes ahBar    { from{width:0} to{width:var(--w)} }
                @keyframes ahScale  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

                .at-stat-card {
                    padding:18px 20px; border-radius:16px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.03);
                    transition:all .22s; animation:ahFadeUp .4s both;
                }
                .at-stat-card:hover {
                    background:rgba(255,255,255,.055);
                    border-color:rgba(74,222,128,.18);
                    transform:translateY(-2px);
                }

                /* Table */
                .at-table {
                    width:100%; border-collapse:collapse; table-layout:fixed;
                }
                .at-table colgroup col.col-num      { width:50px; }
                .at-table colgroup col.col-cover    { width:58px; }
                .at-table colgroup col.col-title    { min-width:160px; }
                .at-table colgroup col.col-artist   { width:140px; }
                .at-table colgroup col.col-plays    { width:110px; }
                .at-table colgroup col.col-duration { width:110px; }
                .at-table colgroup col.col-actions  { width:190px; }

                .at-table thead tr {
                    background:rgba(0,0,0,.18);
                    border-bottom:1px solid rgba(255,255,255,.06);
                }
                .at-table thead th {
                    padding:10px 14px;
                    font-size:11px; font-weight:700; letter-spacing:.55px;
                    text-transform:uppercase; color:rgba(255,255,255,.3);
                    text-align:left; white-space:nowrap;
                }
                .at-table thead th.th-center { text-align:center; }
                .at-table thead th.th-right  { text-align:right; padding-right:18px; }

                .at-table tbody tr {
                    border-bottom:1px solid rgba(255,255,255,.04);
                    transition:background .14s;
                    animation:ahFadeUp .28s both;
                }
                .at-table tbody tr:last-child { border-bottom:none; }
                .at-table tbody tr:hover      { background:rgba(74,222,128,.04); }

                .at-table td {
                    padding:10px 14px;
                    font-size:13px; color:rgba(255,255,255,.65);
                    vertical-align:middle;
                    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                }
                .at-table td.td-center { text-align:center; }
                .at-table td.td-right  { text-align:right; padding-right:18px; }

                .at-sort-btn {
                    background:none; border:none; cursor:pointer;
                    display:inline-flex; align-items:center; gap:4px;
                    color:rgba(255,255,255,.3); font-size:11px;
                    font-family:'Be Vietnam Pro',sans-serif; font-weight:700;
                    letter-spacing:.55px; text-transform:uppercase;
                    padding:0; transition:color .18s;
                }
                .at-sort-btn:hover { color:rgba(255,255,255,.65); }
                .at-sort-btn.active { color:#4ade80; }

                .at-action-btn {
                    display:inline-flex; align-items:center; gap:5px;
                    padding:5px 11px; border-radius:7px; border:none;
                    font-size:12px; font-weight:600; cursor:pointer;
                    transition:background .14s; font-family:'Be Vietnam Pro',sans-serif;
                    text-decoration:none; vertical-align:middle;
                }
                .at-action-edit { background:rgba(34,197,94,.09); color:#22c55e; }
                .at-action-edit:hover { background:rgba(34,197,94,.17); }
                .at-action-del  { background:rgba(248,113,113,.09); color:#f87171; }
                .at-action-del:hover  { background:rgba(248,113,113,.17); }

                .at-pg-btn {
                    width:32px; height:32px; border-radius:8px;
                    border:1px solid rgba(255,255,255,.08);
                    background:transparent; cursor:pointer;
                    font-size:13px; color:rgba(255,255,255,.45);
                    display:inline-flex; align-items:center; justify-content:center;
                    transition:all .18s; font-family:'Be Vietnam Pro',sans-serif;
                }
                .at-pg-btn:hover:not(:disabled) {
                    background:rgba(74,222,128,.1); border-color:rgba(74,222,128,.3); color:#4ade80;
                }
                .at-pg-btn.active {
                    background:rgba(74,222,128,.15); border-color:rgba(74,222,128,.4);
                    color:#4ade80; font-weight:700;
                }
                .at-pg-btn:disabled { opacity:.3; cursor:not-allowed; }

                .at-search-input {
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:10px; padding:9px 14px 9px 38px;
                    color:#fff; font-size:13px; font-family:'Be Vietnam Pro',sans-serif;
                    outline:none; transition:all .2s; width:240px;
                }
                .at-search-input::placeholder { color:rgba(255,255,255,.22); }
                .at-search-input:focus {
                    border-color:rgba(74,222,128,.35);
                    background:rgba(74,222,128,.03);
                }

                .at-modal-overlay {
                    position:fixed; inset:0; z-index:999;
                    background:rgba(0,0,0,.72); display:flex;
                    align-items:center; justify-content:center;
                    animation:ahFadeUp .14s ease; backdrop-filter:blur(4px);
                }
                .at-modal {
                    background:#141a14; border:1px solid rgba(255,255,255,.1);
                    border-radius:20px; padding:28px;
                    max-width:400px; width:90%;
                    animation:ahScale .18s ease;
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: 28, animation: "ahFadeUp .3s both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: "#4ade80", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>
                        Won Music Admin
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 40, color: "#fff", letterSpacing: 1, marginBottom: 4, lineHeight: 1 }}>
                            Danh Sách Bài Hát
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                            Quản lý toàn bộ bài hát trong hệ thống
                        </p>
                    </div>
                    <Link to="/admin/tracks/new" style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "11px 20px", borderRadius: 100,
                        background: "linear-gradient(135deg,#16a34a,#4ade80)",
                        color: "#0a1a0a", fontSize: 13, fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 4px 20px rgba(74,222,128,.22)",
                    }}>
                        <Plus size={15} /> Thêm bài hát
                    </Link>
                </div>
                {/* EQ bars */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 20, marginTop: 12 }}>
                    {EQ_H.map((h, i) => (
                        <div key={i} style={{
                            width: 4, height: `${h}%`,
                            background: `rgba(74,222,128,${.2 + i * .055})`,
                            borderRadius: 2, transformOrigin: "bottom",
                            animation: `ahEq ${.38 + (i % 5) * .13}s ease-in-out infinite`,
                            animationDelay: `${i * .07}s`,
                        }} />
                    ))}
                </div>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14, marginBottom: 28 }}>
                {STATS.map(({ label, value, icon: Icon, color, bg }, i) => (
                    <div key={label} className="at-stat-card" style={{ animationDelay: `${i * .07}s` }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                            <Icon size={17} color={color} />
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, color: "#fff", letterSpacing: 1, lineHeight: 1, marginBottom: 4 }}>
                            {loading ? "—" : value}
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)", fontWeight: 500 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", overflow: "hidden" }}>

                {/* Toolbar */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={14} color="rgba(255,255,255,.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input
                            className="at-search-input"
                            placeholder="Tìm bài hát, nghệ sĩ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.28)", fontWeight: 500 }}>
                        {filtered.length} kết quả
                    </span>
                </div>

                {/* Scrollable table wrapper */}
                <div style={{ overflowX: "auto" }}>
                    <table className="at-table">
                        <colgroup>
                            <col className="col-num" />
                            <col className="col-cover" />
                            <col className="col-title" />
                            <col className="col-artist" />
                            <col className="col-plays" />
                            <col className="col-duration" />
                            <col className="col-actions" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="th-center">#</th>
                                <th />
                                <th>
                                    <button className={`at-sort-btn ${sortKey === "title" ? "active" : ""}`} onClick={() => toggleSort("title")}>
                                        Bài hát <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>Nghệ sĩ</th>
                                <th>
                                    <button className={`at-sort-btn ${sortKey === "plays" ? "active" : ""}`} onClick={() => toggleSort("plays")}>
                                        Lượt nghe <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>
                                    <button className={`at-sort-btn ${sortKey === "duration" ? "active" : ""}`} onClick={() => toggleSort("duration")}>
                                        Thời lượng <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="th-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} style={{ animation: `ahPulse 1.6s ${i * .06}s ease-in-out infinite` }}>
                                        <td className="td-center">
                                            <div style={{ width: 20, height: 11, borderRadius: 3, background: "rgba(255,255,255,.07)", margin: "0 auto" }} />
                                        </td>
                                        <td>
                                            <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(255,255,255,.07)" }} />
                                        </td>
                                        <td>
                                            <div style={{ height: 12, background: "rgba(255,255,255,.07)", borderRadius: 4, width: "60%", marginBottom: 7 }} />
                                            <div style={{ height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, width: "80%" }} />
                                        </td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "65%" }} /></td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "50%" }} /></td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "45%" }} /></td>
                                        <td />
                                    </tr>
                                ))
                                : paginated.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: "52px 0", textAlign: "center" }}>
                                                <Disc3 size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 12px", display: "block" }} />
                                                <p style={{ fontSize: 14, color: "rgba(255,255,255,.28)" }}>Không tìm thấy bài hát nào</p>
                                            </td>
                                        </tr>
                                    )
                                    : paginated.map((track, idx) => {
                                        const pct = Math.round((track.plays / (tracks[0]?.plays || 1)) * 100);
                                        const isPlaying = playingId === track._id;
                                        const globalIdx = (page - 1) * PER_PAGE + idx + 1;

                                        return (
                                            <tr key={track._id} style={{ animationDelay: `${idx * .03}s` }}>

                                                {/* # / EQ */}
                                                <td className="td-center">
                                                    {isPlaying
                                                        ? <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 14, justifyContent: "center" }}>
                                                            {[40, 80, 55, 90, 65].map((h, i) => (
                                                                <div key={i} style={{ width: 2, height: `${h}%`, background: "#4ade80", borderRadius: 1, transformOrigin: "bottom", animation: `ahEq ${.38 + i * .1}s ease-in-out infinite` }} />
                                                            ))}
                                                        </div>
                                                        : <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: "rgba(74,222,128,.28)" }}>
                                                            {String(globalIdx).padStart(2, "0")}
                                                        </span>
                                                    }
                                                </td>

                                                {/* Cover / play toggle */}
                                                <td style={{ padding: "8px 10px" }}>
                                                    <div
                                                        onClick={() => setPlayingId(isPlaying ? null : track._id)}
                                                        style={{
                                                            width: 38, height: 38, borderRadius: 8,
                                                            overflow: "hidden", cursor: "pointer",
                                                            background: "linear-gradient(135deg,#dcfce7,#86efac)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {track.coverUrl
                                                            ? <img src={track.coverUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            : <span style={{ fontSize: 16, color: "#16a34a" }}>♪</span>
                                                        }
                                                    </div>
                                                </td>

                                                {/* Title + popularity bar */}
                                                <td>
                                                    <Link to={`/admin/tracks/${track._id}`} style={{ textDecoration: "none", display: "block" }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {track.title}
                                                        </p>
                                                        <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                                            <div style={{
                                                                height: "100%",
                                                                background: "linear-gradient(90deg,#16a34a,#4ade80)",
                                                                borderRadius: 2,
                                                                width: `${pct}%`,
                                                                animation: "ahBar .7s cubic-bezier(.4,0,.2,1) both",
                                                                ["--w" as any]: `${pct}%`,
                                                            }} />
                                                        </div>
                                                    </Link>
                                                </td>

                                                {/* Artist */}
                                                <td style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                                                    {track.artistId?.name ?? "—"}
                                                </td>

                                                {/* Plays */}
                                                <td>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                        <Play size={11} color="rgba(74,222,128,.5)" />
                                                        <span style={{ fontWeight: 600, color: "rgba(255,255,255,.65)" }}>
                                                            {formatNum(track.plays ?? 0)}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Duration */}
                                                <td>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                        <Clock size={11} color="rgba(255,255,255,.22)" />
                                                        <span style={{ color: "rgba(255,255,255,.38)" }}>
                                                            {formatTime(track.duration ?? 0)}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="td-right" style={{ whiteSpace: "nowrap" }}>
                                                    <Link
                                                        to={`/admin/tracks/${track._id}/edit`}
                                                        className="at-action-btn at-action-edit"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <Edit2 size={12} /> Sửa
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                            }
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && filtered.length > PER_PAGE && (
                    <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,.28)" }}>
                            Trang {page} / {totalPages} · {filtered.length} bài hát
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button className="at-pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                            <button className="at-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.min(Math.max(page - 2, 1), Math.max(totalPages - 4, 1)) + i;
                                return p <= totalPages ? (
                                    <button key={p} className={`at-pg-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                                ) : null;
                            })}
                            <button className="at-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            <button className="at-pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}