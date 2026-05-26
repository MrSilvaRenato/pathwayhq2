import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AnnouncementCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const body = item.body ?? item.content ?? ''
  const isLong = body.length > 180

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => isLong && setExpanded((v) => !v)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.club_name ?? item.club?.name ? (
          <Badge label={item.club_name ?? item.club.name} color="green" />
        ) : null}
      </View>
      <Text
        style={styles.cardBody}
        numberOfLines={expanded ? undefined : 3}
      >
        {body}
      </Text>
      <View style={styles.cardFooter}>
        {item.created_at ? (
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        ) : null}
        {isLong ? (
          <Text style={styles.expandLink}>{expanded ? 'Show less' : 'Read more'}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function fetchAnnouncements() {
    try {
      setError('')
      const r = await api.get('/announcements')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setAnnouncements(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load announcements.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAnnouncements()
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

  if (announcements.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          iconName="megaphone-outline"
          title="No announcements"
          subtitle="Your club hasn't posted any announcements yet."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={announcements}
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
        renderItem={({ item }) => <AnnouncementCard item={item} />}
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
  cardBody: {
    fontSize: font.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardDate: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  expandLink: {
    fontSize: font.xs,
    color: colors.primary,
    fontWeight: '600',
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
