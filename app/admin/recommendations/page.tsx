import { createAdminClient } from '@/lib/supabase/admin'
import Topbar from '../_components/Topbar'
import RecommendationsClient from './_components/RecommendationsClient'

export const revalidate = 0

export default async function RecommendationsPage() {
  const supabase = createAdminClient()

  const { data: raw } = await supabase
    .from('homestay_recommendations')
    .select('*')
    .order('created_at', { ascending: false })

  const recommendations = (raw ?? []).map((r: any) => ({
    id:               r.id,
    recommenderName:  r.recommender_name  ?? null,
    recommenderPhone: r.recommender_phone ?? null,
    recommenderEmail: r.recommender_email ?? null,
    homestayName:     r.homestay_name     ?? null,
    address:          r.address           ?? null,
    hostName:         r.host_name         ?? null,
    hostContact:      r.host_contact      ?? null,
    description:      r.description       ?? null,
    status:           r.status            ?? 'pending',
    createdAt:        r.created_at,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Recommendations"
        subtitle={`${recommendations.length} recommendation${recommendations.length !== 1 ? 's' : ''} received`}
      />
      <RecommendationsClient recommendations={recommendations} />
    </div>
  )
}
