export const SPORTS = [
  { value: 'soccer',        label: 'Football (Soccer)', emoji: '⚽', in2032: true },
  { value: 'swimming',      label: 'Swimming',           emoji: '🏊', in2032: true },
  { value: 'athletics',     label: 'Athletics',          emoji: '🏃', in2032: true },
  { value: 'basketball',    label: 'Basketball',         emoji: '🏀', in2032: true },
  { value: 'cycling',       label: 'Cycling',            emoji: '🚴', in2032: true },
  { value: 'gymnastics',    label: 'Gymnastics',         emoji: '🤸', in2032: true },
  { value: 'rowing',        label: 'Rowing',             emoji: '🚣', in2032: true },
  { value: 'tennis',        label: 'Tennis',             emoji: '🎾', in2032: true },
  { value: 'volleyball',    label: 'Volleyball',         emoji: '🏐', in2032: true },
  { value: 'rugby',         label: 'Rugby Sevens',       emoji: '🏉', in2032: true },
  { value: 'hockey',        label: 'Hockey',             emoji: '🏑', in2032: true },
  { value: 'boxing',        label: 'Boxing',             emoji: '🥊', in2032: true },
  { value: 'judo',          label: 'Judo',               emoji: '🥋', in2032: true },
  { value: 'weightlifting', label: 'Weightlifting',      emoji: '🏋️', in2032: true },
  { value: 'shooting',      label: 'Shooting',           emoji: '🎯', in2032: true },
  { value: 'archery',       label: 'Archery',            emoji: '🏹', in2032: true },
  { value: 'surfing',       label: 'Surfing',            emoji: '🏄', in2032: true },
  { value: 'skateboarding', label: 'Skateboarding',      emoji: '🛹', in2032: true },
  { value: 'climbing',      label: 'Sport Climbing',     emoji: '🧗', in2032: true },
  { value: 'baseball',      label: 'Baseball/Softball',  emoji: '⚾', in2032: true },
  { value: 'golf',          label: 'Golf',               emoji: '⛳', in2032: true },
  { value: 'triathlon',     label: 'Triathlon',          emoji: '🏅', in2032: true },
  { value: 'equestrian',    label: 'Equestrian',         emoji: '🏇', in2032: true },
  { value: 'other',         label: 'Other',              emoji: '🏅', in2032: false },
]

export const FTEM_PHASES = {
  F1: { label: 'Foundation 1', bgColor: '#f1f5f9', textColor: '#334155' },
  F2: { label: 'Foundation 2', bgColor: '#e2e8f0', textColor: '#1e293b' },
  T1: { label: 'Talent 1',     bgColor: '#dbeafe', textColor: '#1d4ed8' },
  T2: { label: 'Talent 2',     bgColor: '#bfdbfe', textColor: '#1e40af' },
  E1: { label: 'Elite 1',      bgColor: '#d1fae5', textColor: '#065f46' },
  E2: { label: 'Elite 2',      bgColor: '#a7f3d0', textColor: '#064e3b' },
  M:  { label: 'Mastery',      bgColor: '#fef3c7', textColor: '#92400e' },
}

export const STATES = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT']

export const SUBSCRIPTION_TIERS = {
  free:  { label: 'Free',  price: '$0/mo',  athletes: 8,   squads: 1,  announcements: 3 },
  pro:   { label: 'Pro',   price: '$29/mo', athletes: 100, squads: 5,  announcements: -1 },
  elite: { label: 'Elite', price: '$79/mo', athletes: -1,  squads: -1, announcements: -1 },
}

export const ROLES = {
  site_admin: 'Site Admin',
  club_admin:  'Manager',
  coach:       'Coach',
  athlete:     'Athlete',
  parent:      'Parent',
}
