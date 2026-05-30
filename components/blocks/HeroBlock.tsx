import Image from 'next/image'
import type { HeroBlockData } from '@/types/blocks.types'

interface Props {
  data: HeroBlockData
  hostName: string
}

export default function HeroBlock({ data, hostName }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
      {data.cover_image_url && (
        <div className="relative w-full h-56 sm:h-72 bg-stone-100">
          <Image
            src={data.cover_image_url}
            alt={`${hostName}'s homestay`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}
      {data.tagline && (
        <div className="px-6 py-4">
          <p className="text-base text-stone-600 italic">"{data.tagline}"</p>
        </div>
      )}
    </div>
  )
}
