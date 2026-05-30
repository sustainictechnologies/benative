import type { HomestayBlock } from '@/types/blocks.types'
import HeroBlock from './HeroBlock'
import ContactBlock from './ContactBlock'
import HostStoryBlock from './HostStoryBlock'
import BirdingLogBlock from './BirdingLogBlock'
import RulesBlock from './RulesBlock'
import VideoBlock from './VideoBlock'
import GalleryBlock from './GalleryBlock'
import MapBlock from './MapBlock'

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
  let content: React.ReactNode = null

  switch (block.block_type) {
    case 'hero':
      content = (
        <HeroBlock
          data={block.content_data as any}
          hostName={homestay.host_name}
        />
      )
      break
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
    case 'host-story':
      content = <HostStoryBlock data={block.content_data as any} />
      break
    case 'activity-log':
      content = <BirdingLogBlock data={block.content_data as any} />
      break
    case 'rules-block':
      content = <RulesBlock data={block.content_data as any} />
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
    case 'map':
      content = <MapBlock data={block.content_data as any} />
      break
    default:
      return null
  }

  return (
    <>
      {content}
      <SubTexts block={block} />
    </>
  )
}