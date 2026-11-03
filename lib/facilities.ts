// The facilities and stay preferences a homestay can offer, in the groups Discover's Filters and
// Admin → Homestays show. Each is a `tags` row (slug spec_*) that is ticked per homestay in
// Admin → Homestays and saved in homestay_tags: a homestay only has one once it is ticked there.

export interface Facility {
  slug:  string
  label: string
}

export interface FacilityGroup {
  key:        string
  label:      string
  facilities: Facility[]
}

export const FACILITY_GROUPS: FacilityGroup[] = [
  {
    key: 'amenities',
    label: 'Amenities & Essentials',
    facilities: [
      { slug: 'spec_gated_parking',  label: 'Gated Parking'           },
      { slug: 'spec_basic_toolkit',  label: 'Basic Toolkit Available' },
      { slug: 'spec_stable_network', label: 'Stable Network'          },
      { slug: 'spec_power_backup',   label: 'Power Backup'            },
      { slug: 'spec_shared_kitchen', label: 'Shared Kitchen'          },
      { slug: 'spec_laundry_access', label: 'Laundry Access'          },
      { slug: 'spec_hot_water',      label: 'Hot Water / Geyser'      },
      { slug: 'spec_western_toilet', label: 'Western-Style Toilet'    },
    ],
  },
  {
    key: 'safety',
    label: 'Safety & Accessibility',
    facilities: [
      { slug: 'spec_wildlife_secure',      label: 'Wildlife-Proof Safety' },
      { slug: 'spec_no_stairs_access',     label: 'No-Stairs Access'      },
      { slug: 'spec_solo_female_friendly', label: 'Solo-Female Friendly'  },
    ],
  },
  {
    key: 'experiences',
    label: 'Experiences & Services',
    facilities: [
      { slug: 'spec_native_guide',     label: 'Native Guide Available' },
      { slug: 'spec_quiet_work_setup', label: 'Quiet Work Setup'       },
    ],
  },
  {
    key: 'preferences',
    label: 'Stay Preferences',
    facilities: [
      { slug: 'spec_pet_friendly', label: 'Pet-Friendly Compound' },
      { slug: 'spec_plastic_free', label: 'Plastic-Free Stay'     },
      { slug: 'spec_pure_veg',     label: 'Pure Vegetarian Food'  },   // tag added by supabase/facility_pure_veg.sql
    ],
  },
]

export const FACILITIES: Facility[] = FACILITY_GROUPS.flatMap(group => group.facilities)
