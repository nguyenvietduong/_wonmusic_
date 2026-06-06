'use client'

import { Suspense } from 'react'
import SearchPage from '@/pages/frontend/SearchPage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  )
}
