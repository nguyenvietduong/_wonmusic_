'use client'

import { useParams } from 'next/navigation'
import ArtistDetailPage from '@/pages/frontend/ArtistDetailPage'

export default function Page() {
  const params = useParams()
  const id = params?.id as string | undefined
  return <ArtistDetailPage artistId={id} />
}
