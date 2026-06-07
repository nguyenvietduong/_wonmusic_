import ArtistDetailPage from '@/pages/frontend/ArtistDetailPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ArtistDetailPage artistId={id} />
}
