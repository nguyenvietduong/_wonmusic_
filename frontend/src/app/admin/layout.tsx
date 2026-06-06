'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import AdminLayoutContent from '@/pages/layouts/AdminLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore()
  const router = useRouter()
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!accessToken) await refresh()
      if (accessToken && !user) await fetchMe()
      setStarting(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!starting && !loading) {
      if (!accessToken) {
        router.replace('/signin')
      } else if (user?.role !== undefined && user.role !== 'admin') {
        router.replace('/')
      }
    }
  }, [starting, loading, accessToken, user])

  if (starting || loading) return null

  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
