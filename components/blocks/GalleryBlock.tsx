type Ratio = 'square' | 'landscape' | 'portrait'

interface GalleryItem { url: string; ratio?: Ratio }

interface Props {
  data: {
    items?:  GalleryItem[]
    images?: (string | null)[]
  }
}

const RATIO_CLASS: Record<string, string> = {
  square:    'aspect-square',
  landscape: 'aspect-video',
  portrait:  'aspect-[3/4]',
}

export default function GalleryBlock({ data }: Props) {
  const photos: GalleryItem[] = data.items
    ? data.items.filter(i => i?.url)
    : (data.images ?? []).filter(Boolean).map(url => ({ url: url as string, ratio: 'square' as Ratio }))

  if (photos.length === 0) return null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <h2 className="font-semibold text-stone-900">Photo Gallery</h2>

      {/* dense packing: landscape spans full row, gaps are backfilled by smaller items */}
      <div className="grid grid-cols-3 gap-1.5 items-start grid-flow-row-dense">
        {photos.map((photo, i) => {
          const ratio = photo.ratio ?? 'square'
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.url}
              alt={`Gallery photo ${i + 1}`}
              className={`w-full object-cover rounded-xl ${RATIO_CLASS[ratio]} ${
                ratio === 'landscape' ? 'col-span-3' : 'col-span-1'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
