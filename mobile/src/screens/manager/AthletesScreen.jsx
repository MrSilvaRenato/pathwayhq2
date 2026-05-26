import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Users, Search } from 'lucide-react-native'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import { FTEM_PHASES, SPORTS } from '../../lib/constants'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

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

export default function AthletesScreen({ navigation }) {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  async function fetchAthletes() {
    try {
      setError('')
      const r = await api.get('/athletes')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setAthletes(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load athletes.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAthletes()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAthletes()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return athletes
    const q = query.toLowerCase()
    return athletes.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.sport?.toLowerCase().includes(q)
    )
  }, [athletes, query])

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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? 'No results' : 'No athletes yet'}
          subtitle={
            query
              ? `No athletes matched "${query}".`
              : 'Athletes who join your club will appear here.'
          }
        />
      ) : (
        <FlatList
          data={filtered}
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('AthleteDetail', { athlete: item })
              }
            >
              <Avatar name={item.name} url={item.avatar_url} size="md" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSport}>{sportLabel(item.sport)}</Text>
              </View>
              <View style={styles.rowRight}>
                {item.ftem_phase ? (
                  <Badge
                    label={FTEM_PHASES[item.ftem_phase]?.label ?? item.ftem_phase}
                    color={ftemColor(item.ftem_phase)}
                  />
                ) : null}
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.is_active || item.status === 'active'
                          ? colors.primary
                          : colors.textMuted,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  searchRow: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: font.base,
    color: colors.text,
    paddingVertical: 0,
  },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.sm,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: font.base, fontWeight: '600', color: colors.text },
  rowSport: { fontSize: font.xs, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
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
