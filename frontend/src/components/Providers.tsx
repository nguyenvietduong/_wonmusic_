'use client'

import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <Toaster richColors />
      {children}
    </HelmetProvider>
  )
}
