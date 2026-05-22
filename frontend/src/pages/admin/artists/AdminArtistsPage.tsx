// src/pages/admin/AdminArtistsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
    Mic2, Search, Plus, Users, TrendingUp,
    Edit2, ArrowUpDown, CheckCircle2,
    Music, Instagram, Youtube, Facebook,
    BadgeCheck, Star,
} from "lucide-react";
import { artistService } from "@/services/artistService";

// ─── helpers ────────────────────────────────────────────────────────────────
const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};

const EQ_H = [35, 65, 50, 80, 40, 72, 55, 88, 45, 60];

type SortKey = "name" | "followers" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminArtistsPage() {
    const [artists,     setArtists]     = useState<any[]>([]);
    const [filtered,    setFiltered]    = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [search,      setSearch]      = useState("");
    const [sortKey,     setSortKey]     = useState<SortKey>("followers");
    const [sortDir,     setSortDir]     = useState<SortDir>("desc");
    const [page,        setPage]        = useState(1);
    const PER_PAGE = 10;

    // ── Load ──
    useEffect(() => {
        (async () => {
            try {
                const res = await artistService.getAll({ limit: 200 });
                setArtists(Array.isArray(res) ? res : res?.data ?? []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Filter + sort ──
    useEffect(() => {
        let list = [...artists];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                a =>
                    a.name?.toLowerCase().includes(q) ||
                    a.genre?.toLowerCase().includes(q) ||
                    a.bio?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === "string")
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        setFiltered(list);
        setPage(1);
    }, [artists, search, sortKey, sortDir]);

    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("desc"); }
    };

    // ── Stats ──
    const totalFollowers  = artists.reduce((s, a) => s + (a.followers ?? 0), 0);
    const verifiedCount   = artists.filter(a => a.verified).length;
    const avgFollowers    = artists.length ? Math.round(totalFollowers / artists.length) : 0;

    const STATS = [
        { label: "Tổng nghệ sĩ",     value: artists.length,          icon: Mic2,        color: "#4ade80", bg: "rgba(74,222,128,.1)"  },
        { label: "Tổng followers",    value: formatNum(totalFollowers), icon: TrendingUp,  color: "#60a5fa", bg: "rgba(96,165,250,.1)"  },
        { label: "TB followers",      value: formatNum(avgFollowers),  icon: Users,       color: "#f472b6", bg: "rgba(244,114,182,.1)" },
        { label: "Đã xác minh",       value: verifiedCount,           icon: BadgeCheck,  color: "#fb923c", bg: "rgba(251,146,60,.1)"  },
    ];

    return (
        <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif" }}>
            <style>{`
                @keyframes ahEq     { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
                @keyframes ahFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes ahPulse  { 0%,100%{opacity:.4} 50%{opacity:.8} }
                @keyframes ahScale  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

                .aa-stat-card {
                    padding:18px 20px; border-radius:16px;
                    border:1px solid rgba(255,255,255,.07);
                    background:rgba(255,255,255,.03);
                    transition:all .22s; animation:ahFadeUp .4s both;
                }
                .aa-stat-card:hover {
                    background:rgba(255,255,255,.055);
                    border-color:rgba(74,222,128,.18);
                    transform:translateY(-2px);
                }

                .aa-table {
                    width:100%; border-collapse:collapse; table-layout:fixed;
                }
                .aa-table colgroup col.col-num    { width:50px; }
                .aa-table colgroup col.col-avatar { width:58px; }
                .aa-table colgroup col.col-name   { min-width:160px; }
                .aa-table colgroup col.col-genre  { width:120px; }
                .aa-table colgroup col.col-follow { width:120px; }
                .aa-table colgroup col.col-social { width:110px; }
                .aa-table colgroup col.col-badge  { width:100px; }
                .aa-table colgroup col.col-act    { width:160px; }

                .aa-table thead tr {
                    background:rgba(0,0,0,.18);
                    border-bottom:1px solid rgba(255,255,255,.06);
                }
                .aa-table thead th {
                    padding:10px 14px;
                    font-size:11px; font-weight:700; letter-spacing:.55px;
                    text-transform:uppercase; color:rgba(255,255,255,.3);
                    text-align:left; white-space:nowrap;
                }
                .aa-table thead th.th-center { text-align:center; }
                .aa-table thead th.th-right  { text-align:right; padding-right:18px; }

                .aa-table tbody tr {
                    border-bottom:1px solid rgba(255,255,255,.04);
                    transition:background .14s;
                    animation:ahFadeUp .28s both;
                }
                .aa-table tbody tr:last-child { border-bottom:none; }
                .aa-table tbody tr:hover      { background:rgba(74,222,128,.04); }

                .aa-table td {
                    padding:10px 14px;
                    font-size:13px; color:rgba(255,255,255,.65);
                    vertical-align:middle;
                    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                }
                .aa-table td.td-center { text-align:center; }
                .aa-table td.td-right  { text-align:right; padding-right:18px; }

                .aa-sort-btn {
                    background:none; border:none; cursor:pointer;
                    display:inline-flex; align-items:center; gap:4px;
                    color:rgba(255,255,255,.3); font-size:11px;
                    font-family:'Be Vietnam Pro',sans-serif; font-weight:700;
                    letter-spacing:.55px; text-transform:uppercase;
                    padding:0; transition:color .18s;
                }
                .aa-sort-btn:hover  { color:rgba(255,255,255,.65); }
                .aa-sort-btn.active { color:#4ade80; }

                .aa-action-btn {
                    display:inline-flex; align-items:center; gap:5px;
                    padding:5px 11px; border-radius:7px; border:none;
                    font-size:12px; font-weight:600; cursor:pointer;
                    transition:background .14s; font-family:'Be Vietnam Pro',sans-serif;
                    text-decoration:none; vertical-align:middle;
                }
                .aa-action-edit { background:rgba(34,197,94,.09); color:#22c55e; }
                .aa-action-edit:hover { background:rgba(34,197,94,.17); }
                .aa-action-del  { background:rgba(248,113,113,.09); color:#f87171; }
                .aa-action-del:hover  { background:rgba(248,113,113,.17); }

                .aa-pg-btn {
                    width:32px; height:32px; border-radius:8px;
                    border:1px solid rgba(255,255,255,.08);
                    background:transparent; cursor:pointer;
                    font-size:13px; color:rgba(255,255,255,.45);
                    display:inline-flex; align-items:center; justify-content:center;
                    transition:all .18s; font-family:'Be Vietnam Pro',sans-serif;
                }
                .aa-pg-btn:hover:not(:disabled) {
                    background:rgba(74,222,128,.1); border-color:rgba(74,222,128,.3); color:#4ade80;
                }
                .aa-pg-btn.active {
                    background:rgba(74,222,128,.15); border-color:rgba(74,222,128,.4);
                    color:#4ade80; font-weight:700;
                }
                .aa-pg-btn:disabled { opacity:.3; cursor:not-allowed; }

                .aa-search-input {
                    background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.08);
                    border-radius:10px; padding:9px 14px 9px 38px;
                    color:#fff; font-size:13px; font-family:'Be Vietnam Pro',sans-serif;
                    outline:none; transition:all .2s; width:240px;
                }
                .aa-search-input::placeholder { color:rgba(255,255,255,.22); }
                .aa-search-input:focus {
                    border-color:rgba(74,222,128,.35);
                    background:rgba(74,222,128,.03);
                }

                .aa-modal-overlay {
                    position:fixed; inset:0; z-index:999;
                    background:rgba(0,0,0,.72); display:flex;
                    align-items:center; justify-content:center;
                    animation:ahFadeUp .14s ease; backdrop-filter:blur(4px);
                }
                .aa-modal {
                    background:#141a14; border:1px solid rgba(255,255,255,.1);
                    border-radius:20px; padding:28px;
                    max-width:400px; width:90%;
                    animation:ahScale .18s ease;
                }

                .aa-social-icon {
                    display:inline-flex; align-items:center; justify-content:center;
                    width:22px; height:22px; border-radius:5px;
                    background:rgba(255,255,255,.06);
                    color:rgba(255,255,255,.35); transition:all .15s;
                    text-decoration:none;
                }
                .aa-social-icon:hover {
                    background:rgba(74,222,128,.15);
                    color:#4ade80;
                }

                .aa-verified-badge {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:3px 8px; border-radius:100px;
                    font-size:10px; font-weight:700; letter-spacing:.5px;
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
                            Danh Sách Nghệ Sĩ
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                            Quản lý toàn bộ nghệ sĩ trong hệ thống
                        </p>
                    </div>
                    <Link
                        to="/admin/artists/new"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 7,
                            padding: "11px 20px", borderRadius: 100,
                            background: "linear-gradient(135deg,#16a34a,#4ade80)",
                            color: "#0a1a0a", fontSize: 13, fontWeight: 700,
                            textDecoration: "none",
                            boxShadow: "0 4px 20px rgba(74,222,128,.22)",
                        }}
                    >
                        <Plus size={15} /> Thêm nghệ sĩ
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
                    <div key={label} className="aa-stat-card" style={{ animationDelay: `${i * .07}s` }}>
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
                            className="aa-search-input"
                            placeholder="Tìm nghệ sĩ, thể loại..."
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
                    <table className="aa-table">
                        <colgroup>
                            <col className="col-num" />
                            <col className="col-avatar" />
                            <col className="col-name" />
                            <col className="col-genre" />
                            <col className="col-follow" />
                            <col className="col-social" />
                            <col className="col-badge" />
                            <col className="col-act" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="th-center">#</th>
                                <th />
                                <th>
                                    <button className={`aa-sort-btn ${sortKey === "name" ? "active" : ""}`} onClick={() => toggleSort("name")}>
                                        Nghệ sĩ <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>Thể loại</th>
                                <th>
                                    <button className={`aa-sort-btn ${sortKey === "followers" ? "active" : ""}`} onClick={() => toggleSort("followers")}>
                                        Followers <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th className="th-center">Social</th>
                                <th className="th-center">Trạng thái</th>
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
                                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
                                        </td>
                                        <td>
                                            <div style={{ height: 12, background: "rgba(255,255,255,.07)", borderRadius: 4, width: "55%", marginBottom: 7 }} />
                                            <div style={{ height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, width: "35%" }} />
                                        </td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "60%" }} /></td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "50%" }} /></td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "60%", margin: "0 auto" }} /></td>
                                        <td><div style={{ height: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, width: "50%", margin: "0 auto" }} /></td>
                                        <td />
                                    </tr>
                                ))
                                : paginated.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "52px 0", textAlign: "center" }}>
                                                <Mic2 size={40} color="rgba(255,255,255,.1)" style={{ margin: "0 auto 12px", display: "block" }} />
                                                <p style={{ fontSize: 14, color: "rgba(255,255,255,.28)" }}>Không tìm thấy nghệ sĩ nào</p>
                                            </td>
                                        </tr>
                                    )
                                    : paginated.map((artist, idx) => {
                                        const globalIdx = (page - 1) * PER_PAGE + idx + 1;
                                        const topFollower = artists[0]?.followers || 1;
                                        const pct = Math.round((artist.followers / topFollower) * 100);
                                        const socials = artist.socialLinks ?? {};
                                        const hasSocial = socials.facebook || socials.instagram || socials.youtube || socials.tiktok;

                                        return (
                                            <tr key={artist._id} style={{ animationDelay: `${idx * .03}s` }}>

                                                {/* # */}
                                                <td className="td-center">
                                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, color: "rgba(74,222,128,.28)" }}>
                                                        {String(globalIdx).padStart(2, "0")}
                                                    </span>
                                                </td>

                                                {/* Avatar */}
                                                <td style={{ padding: "8px 10px" }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: "50%",
                                                        overflow: "hidden", flexShrink: 0,
                                                        background: "linear-gradient(135deg,#052e16,#14532d)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        border: artist.verified ? "2px solid rgba(74,222,128,.4)" : "2px solid transparent",
                                                    }}>
                                                        {artist.avatar
                                                            ? <img src={artist.avatar} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            : <Mic2 size={16} color="rgba(74,222,128,.4)" />
                                                        }
                                                    </div>
                                                </td>

                                                {/* Name + followers bar */}
                                                <td>
                                                    <Link to={`/admin/artists/${artist._id}`} style={{ textDecoration: "none", display: "block" }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {artist.name}
                                                        </p>
                                                        <div style={{ height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
                                                            <div style={{
                                                                height: "100%",
                                                                background: "linear-gradient(90deg,#16a34a,#4ade80)",
                                                                borderRadius: 2,
                                                                width: `${pct}%`,
                                                                transition: "width .7s cubic-bezier(.4,0,.2,1)",
                                                            }} />
                                                        </div>
                                                    </Link>
                                                </td>

                                                {/* Genre */}
                                                <td>
                                                    {artist.genre
                                                        ? <span style={{
                                                            display: "inline-block", padding: "2px 9px", borderRadius: 100,
                                                            fontSize: 11, fontWeight: 600,
                                                            background: "rgba(74,222,128,.08)",
                                                            border: "1px solid rgba(74,222,128,.15)",
                                                            color: "rgba(74,222,128,.8)",
                                                          }}>
                                                            {artist.genre}
                                                          </span>
                                                        : <span style={{ color: "rgba(255,255,255,.2)", fontSize: 12 }}>—</span>
                                                    }
                                                </td>

                                                {/* Followers */}
                                                <td>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                        <Users size={11} color="rgba(74,222,128,.5)" />
                                                        <span style={{ fontWeight: 600, color: "rgba(255,255,255,.65)" }}>
                                                            {formatNum(artist.followers ?? 0)}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Social links */}
                                                <td className="td-center">
                                                    {hasSocial
                                                        ? <div style={{ display: "inline-flex", gap: 5 }}>
                                                            {socials.facebook  && <a href={socials.facebook}  target="_blank" rel="noreferrer" className="aa-social-icon"><Facebook  size={12} /></a>}
                                                            {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="aa-social-icon"><Instagram size={12} /></a>}
                                                            {socials.youtube   && <a href={socials.youtube}   target="_blank" rel="noreferrer" className="aa-social-icon"><Youtube   size={12} /></a>}
                                                            {socials.tiktok    && <a href={socials.tiktok}    target="_blank" rel="noreferrer" className="aa-social-icon"><Music     size={12} /></a>}
                                                          </div>
                                                        : <span style={{ fontSize: 11, color: "rgba(255,255,255,.18)" }}>—</span>
                                                    }
                                                </td>

                                                {/* Verified badge */}
                                                <td className="td-center">
                                                    {artist.verified
                                                        ? <span className="aa-verified-badge" style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80" }}>
                                                            <CheckCircle2 size={10} /> Xác minh
                                                          </span>
                                                        : <span className="aa-verified-badge" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.3)" }}>
                                                            <Star size={10} /> Thường
                                                          </span>
                                                    }
                                                </td>

                                                {/* Actions */}
                                                <td className="td-right" style={{ whiteSpace: "nowrap" }}>
                                                    <Link
                                                        to={`/admin/artists/${artist._id}/edit`}
                                                        className="aa-action-btn aa-action-edit"
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
                            Trang {page} / {totalPages} · {filtered.length} nghệ sĩ
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button className="aa-pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                            <button className="aa-pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.min(Math.max(page - 2, 1), Math.max(totalPages - 4, 1)) + i;
                                return p <= totalPages ? (
                                    <button key={p} className={`aa-pg-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                                ) : null;
                            })}
                            <button className="aa-pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            <button className="aa-pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}