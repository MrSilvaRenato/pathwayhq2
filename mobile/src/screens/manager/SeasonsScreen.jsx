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
import { CalendarDays } from 'lucide-react-native'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function seasonStatus(season) {
  const now = new Date()
  const start = season.start_date ? new Date(season.start_date) : null
  const end = season.end_date ? new Date(season.end_date) : null
  if (start && now < start) return { label: 'Upcoming', color: 'blue' }
  if (end && now > end) return { label: 'Completed', color: 'slate' }
  return { label: 'Active', color: 'green' }
}

export default function SeasonsScreen() {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function fetchSeasons() {
    try {
      setError('')
      const r = await api.get('/seasons')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setSeasons(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load seasons.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchSeasons()
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

  if (seasons.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon={CalendarDays}
          title="No seasons yet"
          subtitle="Create a season to organise events and track athlete progress over time."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={seasons}
        keyExtractor={(item) => String(item.id)}
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
          const status = seasonStatus(item)
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <CalendarDays size={18} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.start_date || item.end_date ? (
                    <Text style={styles.cardDates}>
                      {formatDate(item.start_date)}
                      {item.start_date && item.end_date ? ' – ' : ''}
                      {formatDate(item.end_date)}
                    </Text>
                  ) : null}
                </View>
                <Badge label={status.label} color={status.color} />
              </View>
              {item.description ? (
                <Text style={styles.cardDesc}>{item.description}</Text>
              ) : null}
              {item.events_count != null ? (
                <Text style={styles.cardMeta}>
                  {item.events_count} event{item.events_count !== 1 ? 's' : ''}
                </Text>
              ) : null}
            </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: font.base, fontWeight: '700', color: colors.text },
  cardDates: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  cardDesc: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 6 },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    margin: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: font.sm },
})
