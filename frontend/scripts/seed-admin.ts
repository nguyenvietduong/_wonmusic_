import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { existsSync } from "fs"
import { resolve } from "path"

const envFile = resolve(process.cwd(), ".env.local")
if (existsSync(envFile)) process.loadEnvFile(envFile)

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING!

const userSchema = new mongoose.Schema({
  username:       { type: String, unique: true, sparse: true },
  hashedPassword: { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName:    { type: String, required: true },
  role:           { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model("User", userSchema)

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  console.log("[seed] Connected to MongoDB")

  const del = await User.deleteOne({ email: "admin@wonmusic.vn" })
  if (del.deletedCount) console.log("[seed] Da xoa admin cu (admin@wonmusic.vn)")

  const hashed = await bcrypt.hash("wonmedia", 10)
  await User.findOneAndUpdate(
    { email: "wonmedia@wonmedia.com" },
    { email: "wonmedia@wonmedia.com", hashedPassword: hashed, displayName: "Super Admin", role: "admin" },
    { upsert: true, new: true }
  )
  console.log("[seed] Admin moi: wonmedia@wonmedia.com / wonmedia")

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
