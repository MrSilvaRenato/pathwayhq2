import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES } from '../../lib/constants'
import Badge from '../../components/Badge'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'

function ftemColor(phase) {
  if (!phase) return 'slate'
  if (phase.startsWith('F')) return 'slate'
  if (phase.startsWith('T')) return 'blue'
  if (phase.startsWith('E')) return 'green'
  if (phase === 'M') return 'amber'
  return 'slate'
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByPhase(milestones) {
  const groups = {}
  for (const m of milestones) {
    const phase = m.ftem_phase ?? 'Unknown'
    if (!groups[phase]) groups[phase] = []
    groups[phase].push(m)
  }
  return Object.entries(groups)
}

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function fetchMilestones() {
    try {
      setError('')
      const r = await api.get('/milestones')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setMilestones(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load milestones.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMilestones()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMilestones()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  if (milestones.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          iconName="trophy-outline"
          title="No milestones yet"
          subtitle="Your coach will add milestones as you progress through your athletic journey."
        />
      </SafeAreaView>
    )
  }

  const groups = groupByPhase(milestones)

  const sections = groups.map(([phase, items]) => ({
    type: 'group',
    phase,
    items,
    key: `group-${phase}`,
  }))

  const data = []
  for (const group of sections) {
    data.push({ type: 'header', phase: group.phase, key: `header-${group.phase}` })
    for (const item of group.items) {
      data.push({ type: 'item', ...item, key: `item-${item.id}` })
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            const phaseInfo = FTEM_PHASES[item.phase]
            return (
              <View style={styles.phaseHeader}>
                <Badge
                  label={phaseInfo?.label ?? item.phase}
                  color={ftemColor(item.phase)}
                />
              </View>
            )
          }
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.ftem_phase ? (
                  <Badge
                    label={FTEM_PHASES[item.ftem_phase]?.label ?? item.ftem_phase}
                    color={ftemColor(item.ftem_phase)}
                  />
                ) : null}
              </View>
              {item.description ? (
                <Text style={styles.cardDesc}>{item.description}</Text>
              ) : null}
              {item.date || item.achieved_at ? (
                <Text style={styles.cardDate}>
                  {formatDate(item.date ?? item.achieved_at)}
                </Text>
              ) : null}
            </Card>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  phaseHeader: { marginTop: spacing.md, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: font.base,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: font.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 6,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    margin: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: font.sm,
  },
})
