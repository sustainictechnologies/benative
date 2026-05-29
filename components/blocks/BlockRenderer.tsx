import type { HomestayBlock } from '@/types/blocks.types'
import HeroBlock from './HeroBlock'
import HostStoryBlock from './HostStoryBlock'
import BirdingLogBlock from './BirdingLogBlock'
import RulesBlock from './RulesBlock'
import VideoBlock from './VideoBlock'
import GalleryBlock from './GalleryBlock'

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

export default function BlockRenderer({ block, homestay, isLoggedIn, slug }: Props) {
  switch (block.block_type) {
    case 'hero':
      return (
        <HeroBlock
          data={block.content_data as any}
          hostName={homestay.host_name}
          phone={homestay.contact_phone}
          callingWindow={homestay.calling_window}
          isLoggedIn={isLoggedIn}
          slug={slug}
        />
      )
    case 'host-story':
      return <HostStoryBlock data={block.content_data as any} />
    case 'activity-log':
      return <BirdingLogBlock data={block.content_data as any} />
    case 'rules-block':
      return <RulesBlock data={block.content_data as any} />
    case 'video':
      return (
        <VideoBlock
          videoId={(block.content_data as any).youtube_video_id ?? homestay.youtube_video_id ?? ''}
          caption={(block.content_data as any).caption}
        />
      )
    case 'gallery':
      return <GalleryBlock data={block.content_data as any} />
    default:
      return null
  }
}