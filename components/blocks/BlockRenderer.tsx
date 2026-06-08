import Image from 'next/image'
import type { HomestayBlock } from '@/types/blocks.types'
import HeroBlock from './HeroBlock'
import ContactBlock from './ContactBlock'
import HostStoryBlock from './HostStoryBlock'
import BirdingLogBlock from './BirdingLogBlock'
import RulesBlock from './RulesBlock'
import HowToReachBlock from './HowToReachBlock'
import VideoBlock from './VideoBlock'
import GalleryBlock from './GalleryBlock'
import MapBlock from './MapBlock'
import RoomsBlock from './RoomsBlock'
import FoodBlock from './FoodBlock'

interface HomestayMeta {
  host_name: string
  contact_phone: string
  calling_window: string
  youtube_video_id: string | null
}

interface Props {
  block: HomestayBlock
  homestay: HomestayMeta
  isLoggedIn: boolean
  slug: string
}

function LayoutRenderer({ block }: { block: HomestayBlock }) {
  const d       = block.content_data as Record<string, unknown>
  const layout  = d.layout as { rows: any[]; cells: Record<string, string>; images: Record<string, string> } | undefined
  const styles  = (d.styles ?? {}) as Record<string, string>

  if (!layout?.rows?.length) return null

  const COL_CLASS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

  return (
    <div className="mt-3 space-y-3">
      {layout.rows.map((row: any) => (
        <div key={row.id} className={`grid ${COL_CLASS[row.cols] ?? 'grid-cols-1'} gap-3`}>
          {(row.cells ?? []).map((cell: any) => {
            if (cell.type === 'text') {
              const text = layout.cells?.[cell.id] ?? ''
              if (!text) return <div key={cell.id} />
              return (
                <p key={cell.id} className="text-sm text-stone-600 leading-relaxed"
                  style={{
                    fontFamily: styles[`${cell.id}-font`]  || undefined,
                    fontSize:   styles[`${cell.id}-size`]  ? `${styles[`${cell.id}-size`]}px` : undefined,
                    color:      styles[`${cell.id}-color`] || undefined,
                    fontWeight: styles[`${cell.id}-bold`]   === 'true' ? 'bold'   : undefined,
                    fontStyle:  styles[`${cell.id}-italic`] === 'true' ? 'italic' : undefined,
                    textAlign:  (styles[`${cell.id}-align`] || undefined) as React.CSSProperties['textAlign'],
                  }}
                >{text}</p>
              )
            }
            if (cell.type === 'image') {
              const url = layout.images?.[cell.id]
              if (!url) return <div key={cell.id} />
              return (
                <div key={cell.id} className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <Image src={url} alt="" fill className="object-cover" sizes="600px" />
                </div>
              )
            }
            if (cell.type === 'list') {
              let items: string[] = []
              try { items = JSON.parse(layout.cells?.[`${cell.id}-items`] ?? '[]') } catch {}
              if (!items.length) return <div key={cell.id} />
              return (
                <ul key={cell.id} className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-stone-400 rounded-full shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )
            }
            return null
          })}
        </div>
      ))}
    </div>
  )
}

function SubTexts({ block }: { block: HomestayBlock }) {
  const d = block.content_data as Record<string, unknown>
  const subTexts = d.sub_texts as { id: string; content: string }[] | undefined
  const styles   = (d.styles ?? {}) as Record<string, string>

  if (!subTexts?.length) return null

  return (
    <div className="mt-3 space-y-2">
      {subTexts.map(st => (
        <p
          key={st.id}
          className="text-sm text-stone-600 leading-relaxed"
          style={{
            fontFamily: styles[`${st.id}-font`]  || undefined,
            fontSize:   styles[`${st.id}-size`]  ? `${styles[`${st.id}-size`]}px` : undefined,
            color:      styles[`${st.id}-color`] || undefined,
            fontWeight: styles[`${st.id}-bold`]   === 'true' ? 'bold'   : undefined,
            fontStyle:  styles[`${st.id}-italic`] === 'true' ? 'italic' : undefined,
            textAlign:  (styles[`${st.id}-align`] || undefined) as React.CSSProperties['textAlign'],
          }}
        >
          {st.content}
        </p>
      ))}
    </div>
  )
}

export default function BlockRenderer({ block, homestay, isLoggedIn, slug }: Props) {
  const bgColor = ((block.content_data as any)?.styles?.['_bg-color'] as string | undefined) || undefined
  const bgStyle = bgColor ? { backgroundColor: bgColor } : undefined

  // Hero and host-story: BlockRenderer owns the outer border so LayoutRenderer
  // can sit inside it — keeping added text/image/list blocks within the card border.
  if (block.block_type === 'hero') {
    return (
      <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white" style={bgStyle}>
        <HeroBlock
          data={block.content_data as any}
          hostName={homestay.host_name}
        />
        <div className="px-6 pb-4">
          <LayoutRenderer block={block} />
          <SubTexts block={block} />
        </div>
      </div>
    )
  }

  if (block.block_type === 'host-story') {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6" style={bgStyle}>
        <HostStoryBlock data={block.content_data as any} />
        <LayoutRenderer block={block} />
        <SubTexts block={block} />
      </div>
    )
  }

  let content: React.ReactNode = null

  switch (block.block_type) {
    case 'contact':
      content = (
        <ContactBlock
          data={block.content_data as any}
          hostName={homestay.host_name}
          phone={homestay.contact_phone}
          callingWindow={homestay.calling_window}
          isLoggedIn={isLoggedIn}
          slug={slug}
        />
      )
      break
    case 'activity-log':
      content = <BirdingLogBlock data={block.content_data as any} />
      break
    case 'rules-block':
      content = <RulesBlock data={block.content_data as any} />
      break
    case 'how-to-reach':
      content = <HowToReachBlock data={block.content_data as any} />
      break
    case 'video':
      content = (
        <VideoBlock
          videoId={(block.content_data as any).youtube_video_id ?? homestay.youtube_video_id ?? ''}
          caption={(block.content_data as any).caption}
        />
      )
      break
    case 'gallery':
      content = <GalleryBlock data={block.content_data as any} />
      break
    case 'rooms':
      content = <RoomsBlock data={block.content_data as any} />
      break
    case 'food':
      content = <FoodBlock data={block.content_data as any} />
      break
    case 'map':
      content = <MapBlock data={block.content_data as any} />
      break
    default:
      return null
  }

  return (
    <>
      {content}
      <LayoutRenderer block={block} />
      <SubTexts block={block} />
    </>
  )
}