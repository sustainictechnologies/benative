import Image from 'next/image'
import type { HostStoryBlockData } from '@/types/blocks.types'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

interface Props {
  data: HostStoryBlockData & {
    host_photo_shape?:    string
    host_photo_position?: string
    host_photo_zoom?:     number
  }
}

const ORIGIN_MAP: Record<string, string> = {
  'top-left':    '0% 0%',
  'top':         '50% 0%',
  'top-right':   '100% 0%',
  'left':        '0% 50%',
  'center':      '50% 50%',
  'right':       '100% 50%',
  'bottom-left': '0% 100%',
  'bottom':      '50% 100%',
  'bottom-right':'100% 100%',
}

export default function HostStoryBlock({ data }: Props) {
  const zoom   = data.host_photo_zoom ?? 1
  const origin = ORIGIN_MAP[data.host_photo_position ?? 'center'] ?? '50% 50%'

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
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left: padded portrait photo */}
      <div className="relative md:w-[40%] shrink-0 h-64 md:h-auto min-h-[300px] rounded-xl overflow-hidden">
        <Image
          src={supabaseImgUrl(data.host_image_url, { width: 500, quality: 85 })}
          alt={data.story_title ?? 'Host photo'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 40vw"
          style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: origin } : undefined}
        />
      </div>

      {/* Right: text */}
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
    </div>
  )
}
