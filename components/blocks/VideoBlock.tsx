'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

interface Props {
  videoId: string
  caption?: string
}

export default function VideoBlock({ videoId, caption }: Props) {
  const [playing, setPlaying] = useState(false)

  if (!videoId) return null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ paddingBottom: '56.25%' }}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Homestay video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            className="absolute inset-0 w-full h-full group"
            onClick={() => setPlaying(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                <Play size={28} className="text-stone-900 ml-1" fill="currentColor" />
              </div>
            </div>
          </button>
        )}
      </div>
      {caption && (
        <p className="text-xs text-stone-400 mt-3 text-center">{caption}</p>
      )}
      <p className="text-xs text-stone-900 mt-2 text-left leading-relaxed">
        <span className="font-semibold">Note:</span> This video is embedded from YouTube for informational purposes only. It is not created, owned, or uploaded by BeNative. All rights belong to the original creator.
      </p>
    </div>
  )
}
