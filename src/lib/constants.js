export const SPORTS = [
  { value: 'soccer',       label: 'Football (Soccer)', emoji: '⚽', in2032: true },
  { value: 'swimming',     label: 'Swimming',           emoji: '🏊', in2032: true },
  { value: 'athletics',    label: 'Athletics',          emoji: '🏃', in2032: true },
  { value: 'basketball',   label: 'Basketball',         emoji: '🏀', in2032: true },
  { value: 'cycling',      label: 'Cycling',            emoji: '🚴', in2032: true },
  { value: 'gymnastics',   label: 'Gymnastics',         emoji: '🤸', in2032: true },
  { value: 'rowing',       label: 'Rowing',             emoji: '🚣', in2032: true },
  { value: 'tennis',       label: 'Tennis',             emoji: '🎾', in2032: true },
  { value: 'volleyball',   label: 'Volleyball',         emoji: '🏐', in2032: true },
  { value: 'rugby',        label: 'Rugby Sevens',       emoji: '🏉', in2032: true },
  { value: 'hockey',       label: 'Hockey',             emoji: '🏑', in2032: true },
  { value: 'boxing',       label: 'Boxing',             emoji: '🥊', in2032: true },
  { value: 'judo',         label: 'Judo',               emoji: '🥋', in2032: true },
  { value: 'weightlifting',label: 'Weightlifting',      emoji: '🏋️', in2032: true },
  { value: 'shooting',     label: 'Shooting',           emoji: '🎯', in2032: true },
  { value: 'archery',      label: 'Archery',            emoji: '🏹', in2032: true },
  { value: 'surfing',      label: 'Surfing',            emoji: '🏄', in2032: true },
  { value: 'skateboarding',label: 'Skateboarding',      emoji: '🛹', in2032: true },
  { value: 'climbing',     label: 'Sport Climbing',     emoji: '🧗', in2032: true },
  { value: 'baseball',     label: 'Baseball/Softball',  emoji: '⚾', in2032: true },
  { value: 'golf',         label: 'Golf',               emoji: '⛳', in2032: true },
  { value: 'triathlon',    label: 'Triathlon',          emoji: '🏅', in2032: true },
  { value: 'equestrian',   label: 'Equestrian',         emoji: '🏇', in2032: true },
  { value: 'other',        label: 'Other',              emoji: '🏅', in2032: false },
]

export const FTEM_PHASES = {
  F1: { label: 'Foundation 1', color: 'bg-slate-100 text-slate-700' },
  F2: { label: 'Foundation 2', color: 'bg-slate-200 text-slate-800' },
  T1: { label: 'Talent 1',     color: 'bg-blue-100 text-blue-700' },
  T2: { label: 'Talent 2',     color: 'bg-blue-200 text-blue-800' },
  E1: { label: 'Elite 1',      color: 'bg-emerald-100 text-emerald-700' },
  E2: { label: 'Elite 2',      color: 'bg-emerald-200 text-emerald-800' },
  M:  { label: 'Mastery',      color: 'bg-amber-100 text-amber-700' },
}

export const STATES = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT']

export const SUBSCRIPTION_TIERS = {
  free:  { label: 'Free',  price: '$0/mo',  athletes: 15,  squads: 1,   announcements: 3 },
  pro:   { label: 'Pro',   price: '$29/mo', athletes: 100, squads: 5,   announcements: -1 },
  elite: { label: 'Elite', price: '$79/mo', athletes: -1,  squads: -1,  announcements: -1 },
}
