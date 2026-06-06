import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { connectDB } from '@/lib/mongodb'
import SiteSettings from '@/models/SiteSettings'

// generateMetadata chạy server-side mỗi request → đọc favicon/title từ DB
export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB()
    const s = await SiteSettings.findOne().lean() as any
    return {
      title:       s?.metaTitle       || 'Won Music',
      description: s?.metaDescription || 'Won Music – Âm nhạc bản quyền',
      icons: {
        icon: s?.faviconUrl || '/favicon.ico',
      },
    }
  } catch {
    return {
      title:       'Won Music',
      description: 'Won Music – Âm nhạc bản quyền',
      icons: { icon: '/favicon.ico' },
    }
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
