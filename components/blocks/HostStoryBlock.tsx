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

const SHAPE_CLASS: Record<string, string> = {
  circle:  'rounded-full',
  rounded: 'rounded-2xl',
  square:  'rounded-none',
}

const POSITION_CLASS: Record<string, string> = {
  'top-left':    'object-left-top',
  'top':         'object-top',
  'top-right':   'object-right-top',
  'left':        'object-left',
  'center':      'object-center',
  'right':       'object-right',
  'bottom-left': 'object-left-bottom',
  'bottom':      'object-bottom',
  'bottom-right':'object-right-bottom',
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
  const shapeClass    = SHAPE_CLASS[data.host_photo_shape    ?? 'circle']  ?? 'rounded-full'
  const positionClass = POSITION_CLASS[data.host_photo_position ?? 'center'] ?? 'object-center'
  const zoom          = data.host_photo_zoom ?? 1
  const origin        = ORIGIN_MAP[data.host_photo_position ?? 'center'] ?? '50% 50%'

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {data.host_image_url && (
        <div className="shrink-0 flex justify-center md:justify-start">
          <div className={`relative w-20 h-20 overflow-hidden bg-stone-100 ${shapeClass}`}>
            <Image
              src={supabaseImgUrl(data.host_image_url, { width: 200, quality: 75 })}
              alt={data.story_title ?? 'Host photo'}
              fill
              className="object-cover"
              sizes="80px"
              style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: origin } : undefined}
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0 w-full space-y-2">
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