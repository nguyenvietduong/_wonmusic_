'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import Navbar from '@/components/frontend/Navbar'
import PhoneButton from '@/components/frontend/PhoneButton'
import ScrollToTopButton from '@/components/frontend/ScrollToTopButton'
import PlayerBar from '@/components/frontend/PlayerBar'
import Footer from '@/components/frontend/Footer'

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, refresh } = useAuthStore()

  useEffect(() => {
    if (!accessToken) {
      refresh().catch(() => {})
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#191B24]">
      <PhoneButton />
      <ScrollToTopButton />
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <PlayerBar />
      <Footer />
    </div>
  )
}
