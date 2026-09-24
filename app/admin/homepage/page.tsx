import Topbar from '../_components/Topbar'
import { LayoutTemplate } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import HomepageImagesClient from './_components/HomepageImagesClient'

export const dynamic = 'force-dynamic'

export default async function HomepageAdminPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('homepage_images')
    .select('slot, label, section, image_url')
    .order('slot')

  if (error || !data) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Homepage" subtitle="Manage homepage images and content" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
              <LayoutTemplate size={26} className="text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-stone-700">Homepage Image Manager</p>
            <p className="text-xs text-stone-400 max-w-xs">
              Run the SQL setup below in Supabase and create a public{' '}
              <code className="bg-stone-100 px-1 rounded">homepage</code> storage bucket,
              then reload this page.
            </p>
            <pre className="text-left text-[10px] bg-stone-50 border border-stone-200 rounded-xl p-4 max-w-sm overflow-auto text-stone-600 leading-relaxed">
{`CREATE TABLE homepage_images (
  slot        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  section     TEXT NOT NULL,
  image_url   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Hero carousel (5 slides)
INSERT INTO homepage_images (slot, label, section) VALUES
  ('carousel_1','Slide 1','carousel'),
  ('carousel_2','Slide 2','carousel'),
  ('carousel_3','Slide 3','carousel'),
  ('carousel_4','Slide 4','carousel'),
  ('carousel_5','Slide 5','carousel');

-- Main categories (5)
INSERT INTO homepage_images (slot, label, section) VALUES
  ('cat_coastal',   'Coastal',    'categories'),
  ('cat_hills',     'Hills',      'categories'),
  ('cat_forest',    'Forest',     'categories'),
  ('cat_village',   'Village',    'categories'),
  ('cat_backwater', 'Backwater',  'categories');

-- Sub-categories (adjust slugs to match your data)
INSERT INTO homepage_images (slot, label, section) VALUES
  ('sub_beaches',       'Beaches',        'subcategories'),
  ('sub_mangroves',     'Mangroves',      'subcategories'),
  ('sub_cliffs',        'Cliffs',         'subcategories'),
  ('sub_valleys',       'Valleys',        'subcategories'),
  ('sub_peaks',         'Peaks',          'subcategories'),
  ('sub_tea_estates',   'Tea Estates',    'subcategories'),
  ('sub_rainforest',    'Rainforest',     'subcategories'),
  ('sub_wildlife',      'Wildlife',       'subcategories'),
  ('sub_tribal',        'Tribal Stays',   'subcategories'),
  ('sub_farms',         'Farms',          'subcategories'),
  ('sub_rivers',        'Rivers',         'subcategories'),
  ('sub_canals',        'Canals',         'subcategories');`}
            </pre>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Homepage" subtitle="Manage homepage images and content" />
      <HomepageImagesClient slots={data} />
    </div>
  )
}
