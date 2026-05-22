// seed/seedAdmin.js
// Chạy: node seed/seedAdmin.js

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const ADMIN_USERNAME = "wonmusicadmin";
const ADMIN_PASSWORD = "wonmusicadmin";

const seedAdmin = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_CONNECTTIONSTRING);
        console.log("✅ Đã kết nối MongoDB");

        // Kiểm tra đã tồn tại chưa
        const existing = await User.findOne({ username: ADMIN_USERNAME });

        if (existing) {
            console.log("⚠️  Tài khoản admin đã tồn tại, bỏ qua.");
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Tạo admin
        await User.create({
            username: ADMIN_USERNAME,
            hashedPassword,
            email: "contact@wonmedia.vn",
            displayName: "Won Music Admin",
        });

        console.log("🎵 Tạo tài khoản admin thành công!");
        console.log(`   Username : ${ADMIN_USERNAME}`);
        console.log(`   Password : ${ADMIN_PASSWORD}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed admin:", error);
        process.exit(1);
    }
};

seedAdmin();