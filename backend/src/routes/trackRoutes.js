// routes/trackRoutes.ts
import { Router } from "express";
import {
    getTracks,
    getTrackById,
    searchTracks,
    getTopTracks,
    createTrack,
    updateTrack,
    incrementPlays,
    deleteTrack,
} from "../controllers/trackController.js";

const router = Router();

router.get("/",           getTracks);
router.get("/search",     searchTracks);
router.get("/top",        getTopTracks);
router.get("/:id",        getTrackById);
router.post("/",          createTrack);
router.put("/:id",        updateTrack);
router.patch("/:id/play", incrementPlays);
router.delete("/:id",     deleteTrack);

export default router;