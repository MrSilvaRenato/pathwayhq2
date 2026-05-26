import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'

function ftemColor(phase) {
  if (!phase) return 'slate'
  if (phase.startsWith('F')) return 'slate'
  if (phase.startsWith('T')) return 'blue'
  if (phase.startsWith('E')) return 'green'
  if (phase === 'M') return 'amber'
  return 'slate'
}

function sportLabel(value) {
  return SPORTS.find((s) => s.value === value)?.label ?? value ?? '—'
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

export default function AthleteDetailScreen({ route }) {
  const athlete = route.params?.athlete ?? {}

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={athlete.name} url={athlete.avatar_url} size="xl" />
          <Text style={styles.name}>{athlete.name ?? '—'}</Text>
          <Text style={styles.sport}>{sportLabel(athlete.sport)}</Text>
          <View style={styles.badgeRow}>
            {athlete.ftem_phase ? (
              <Badge
                label={FTEM_PHASES[athlete.ftem_phase]?.label ?? athlete.ftem_phase}
                color={ftemColor(athlete.ftem_phase)}
              />
            ) : (
              <Badge label="No phase assigned" color="slate" />
            )}
            <Badge
              label={
                athlete.is_active || athlete.status === 'active' ? 'Active' : 'Inactive'
              }
              color={
                athlete.is_active || athlete.status === 'active' ? 'green' : 'slate'
              }
            />
          </View>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <InfoRow label="Email" value={athlete.email} />
          <InfoRow label="Phone" value={athlete.phone} />
          <InfoRow label="Date of Birth" value={athlete.date_of_birth} />
          <InfoRow label="Gender" value={athlete.gender} />
          <InfoRow label="Nationality" value={athlete.nationality} />
          <InfoRow label="State" value={athlete.state} />
        </View>

        {athlete.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bio</Text>
            <Text style={styles.bio}>{athlete.bio}</Text>
          </View>
        ) : null}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: 8,
  },
  name: { fontSize: font.xl, fontWeight: '700', color: colors.text, marginTop: 4 },
  sport: { fontSize: font.sm, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: font.sm, color: colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  bio: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 21 },
})
