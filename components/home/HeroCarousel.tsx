'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const SLIDES = [
  { src: '/hero.jpg',              alt: 'BeNative — Real homes across India' },
  { src: '/bird_waching.jpg',      alt: 'Nature stays' },
  { src: '/Rider_Friendly.jpeg',   alt: 'Travel stays' },
  { src: '/Solo_Female_Safe.jpeg', alt: 'Peaceful homes' },
  { src: '/Agri_Immersion.jpeg',   alt: 'Rural immersion' },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(p => (p + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/55" />

      {/* Headline */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-white/70 text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-5 font-medium">
          BeNative
        </p>
        <h1 className="text-3xl sm:text-5xl md:text-[3.75rem] font-bold text-white leading-tight max-w-2xl">
          Find places that still belong to themselves.
        </h1>
      </div>

      {/* Dot nav */}
      <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/35'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
