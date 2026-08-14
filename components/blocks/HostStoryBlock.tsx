import Image from 'next/image'
import type { HostStoryBlockData } from '@/types/blocks.types'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

// Legacy grid → pan conversion for records saved before the drag-crop update
const LEGACY_PAN: Record<string, [number, number]> = {
  'top-left': [0,0], 'top': [50,0], 'top-right': [100,0],
  'left': [0,50], 'center': [50,50], 'right': [100,50],
  'bottom-left': [0,100], 'bottom': [50,100], 'bottom-right': [100,100],
}

interface Props { data: HostStoryBlockData }

export default function HostStoryBlock({ data }: Props) {
  const zoom = data.host_photo_zoom ?? 1

  let panX = 50, panY = 0
  if (data.host_photo_pan_x != null) {
    panX = data.host_photo_pan_x
    panY = data.host_photo_pan_y ?? 0
  } else if (data.host_photo_position) {
    ;[panX, panY] = LEGACY_PAN[data.host_photo_position] ?? [50, 0]
  }

  const imgStyle = {
    objectPosition: `${panX}% ${panY}%`,
    ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: `${panX}% ${panY}%` } : {}),
  }

  const textContent = (
    <div className="flex-1 min-w-0 flex flex-col justify-center space-y-3">
      {data.story_title && (
        <h2 className="text-base font-semibold text-stone-900">{data.story_title}</h2>
      )}
      {data.story_text && (
        <div className="space-y-3">
          {(data.story_text ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
            <p key={i} className="text-sm text-stone-600 leading-relaxed">{para}</p>
          ))}
        </div>
      )}
      {data.sub_texts?.map(st => st.content && (
        <div key={st.id} className="space-y-3">
          {(st.content ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
            <p key={i} className="text-sm text-stone-600 leading-relaxed">{para}</p>
          ))}
        </div>
      ))}
    </div>
  )

  if (!data.host_image_url) {
    return textContent
  }

  return (
    <div className="overflow-hidden">
      {/* Image floated left — text wraps around it */}
      <div className="relative float-left w-32 h-40 md:w-48 md:h-56 mr-4 md:mr-6 mb-2 rounded-xl overflow-hidden">
        <Image
          src={supabaseImgUrl(data.host_image_url, { width: 400, quality: 85 })}
          alt={data.story_title ?? 'Host photo'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 192px"
          style={imgStyle}
        />
      </div>

      {/* Text wraps around the float */}
      <div className="space-y-3">
        {data.story_title && (
          <h2 className="text-base font-semibold text-stone-900">{data.story_title}</h2>
        )}
        {data.story_text && (
          <div className="space-y-3">
            {(data.story_text ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} className="text-sm text-stone-600 leading-relaxed">{para}</p>
            ))}
          </div>
        )}
        {data.sub_texts?.map(st => st.content && (
          <div key={st.id} className="space-y-3">
            {(st.content ?? '').split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i} className="text-sm text-stone-600 leading-relaxed">{para}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
