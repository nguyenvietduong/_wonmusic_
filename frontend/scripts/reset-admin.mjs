/**
 * Chạy: node scripts/reset-admin.mjs
 * Tạo mới hoặc reset password user admin trong MongoDB
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

// Đọc .env.local thủ công
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key && key.trim() && !key.startsWith('#')) {
    process.env[key.trim()] = vals.join('=').trim()
  }
}

const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING
if (!MONGO_URI) { console.error('Thiếu MONGODB_CONNECTION_STRING trong .env.local'); process.exit(1) }

const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashedPassword: { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName:    { type: String, required: true },
  role:           { type: String, enum: ['user','admin'], default: 'user' },
}, { timestamps: true })

const User = mongoose.models?.User || mongoose.model('User', userSchema)

async function main() {
  await mongoose.connect(MONGO_URI)
  console.log('✓ Kết nối MongoDB thành công')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const result = await User.findOneAndUpdate(
    { username: 'admin' },
    {
      username: 'admin',
      hashedPassword,
      email: 'admin@wonmusic.vn',
      displayName: 'Quản trị viên',
      role: 'admin',
    },
    { upsert: true, new: true }
  )

  console.log(`✓ Admin user đã được ${result.createdAt?.getTime() === result.updatedAt?.getTime() ? 'tạo mới' : 'reset'}`)
  console.log('  Username : admin')
  console.log('  Password : admin123')
  console.log('  Role     : admin')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
