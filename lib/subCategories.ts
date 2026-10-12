// The Discover page's categories and their sub-categories: one list, shared by
// the Discover page, the homepage and the admin panel.
//
// A sub-category's key is what is stored for each homestay in
// homestays.sub_categories. A label can be changed freely; changing a key
// leaves the homestays that had the old one without it.

export interface SubCategory {
  key:   string
  label: string
}

export interface SubCategoryGroup {
  key:           string
  label:         string
  subCategories: SubCategory[]
}

export const SUB_CATEGORY_GROUPS: SubCategoryGroup[] = [
  {
    key:   'place',
    label: 'By the Place',
    subCategories: [
      { key: 'by_the_sea',         label: 'By the Sea' },
      { key: 'beside_the_water',   label: 'Beside the Water' },
      { key: 'in_the_hills',       label: 'In the Hills' },
      { key: 'among_the_green',    label: 'Among the Green' },
      { key: 'in_the_countryside', label: 'In the Countryside' },
      { key: 'away_from_it_all',   label: 'Away from It All' },
    ],
  },
  {
    key:   'home',
    label: 'By the Home',
    subCategories: [
      { key: 'family_homes',     label: 'Family Homes' },
      { key: 'farm_stays',       label: 'Farm Stays' },
      { key: 'heritage_homes',   label: 'Heritage Homes' },
      { key: 'village_homes',    label: 'Village Homes' },
      { key: 'eco_nature_homes', label: 'Eco & Nature Homes' },
      { key: 'homesteads',       label: 'Homesteads' },
    ],
  },
  {
    key:   'trip',
    label: 'By the Trip',
    subCategories: [
      { key: 'slow_escapes',             label: 'Slow Escapes' },
      { key: 'weekend_getaways',         label: 'Weekend Getaways' },
      { key: 'long_stays',               label: 'Long Stays' },
      { key: 'family_time',              label: 'Family Time' },
      { key: 'transit_stays',            label: 'Transit Stays' },
      { key: 'solo_stays',               label: 'Solo Stays' },
      { key: 'work_from_somewhere_else', label: 'Work From Somewhere Else' },
    ],
  },
  {
    key:   'experience',
    label: 'By the Experience',
    subCategories: [
      { key: 'eat_like_a_local',      label: 'Eat Like a Local' },
      { key: 'wake_up_in_nature',     label: 'Wake Up in Nature' },
      { key: 'learn_something_new',   label: 'Learn Something New' },
      { key: 'go_offline',            label: 'Go Offline' },
      { key: 'meet_the_people',       label: 'Meet the People' },
      { key: 'do_absolutely_nothing', label: 'Do Absolutely Nothing' },
    ],
  },
]

export const SUB_CATEGORY_KEYS = new Set(
  SUB_CATEGORY_GROUPS.flatMap(group => group.subCategories.map(sub => sub.key)),
)
