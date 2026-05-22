// src/server.js
import 'dotenv/config';
import express        from 'express';
import cors           from 'cors';
import cookieParser   from 'cookie-parser';

import { connectDB }  from './config/db.js';
import authRouter     from './routes/authRoutes.js';
import artistRoutes   from "./routes/artistRoutes.js";   // ← thêm .js
import trackRoutes    from "./routes/trackRoutes.js";    // ← thêm .js
import userRoute      from './routes/userRoute.js';
import fileUpload     from "express-fileupload";
import { protectedRoute } from './middleware/authMiddleware.js';

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:      process.env.CLIENT_URL,
    credentials: true,
}));

app.use(fileUpload({
    useTempFiles:   false,
    limits:         { fileSize: 50 * 1024 * 1024 }, // 50MB
}));

// ── Routes ──
app.use('/api/auth',      authRouter);
app.use("/api/artists",   artistRoutes);   // ← app thay vì router
app.use("/api/tracks",    trackRoutes);    // ← app thay vì router

// private routes
app.use(protectedRoute);
app.use('/api/users',     userRoute);

// ── Health check ──
app.get("/", (_, res) => res.json({ message: "Won Music API ✓" }));

// ── 404 ──
app.use((_, res) => res.status(404).json({ success: false, message: "Route không tồn tại" }));

// ── Error handler ──
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({ message: "Invalid JSON", details: err.message });
    }
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Lỗi server" });
});

// ── Khởi động ──
connectDB()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ DB connect failed:", err.message);
        process.exit(1);
    });