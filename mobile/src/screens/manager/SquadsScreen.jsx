import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView as RNSafeAreaView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Layers, X, Users } from 'lucide-react-native'
import api from '../../lib/api'
import { colors, font, spacing, radius } from '../../lib/theme'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'

export default function SquadsScreen() {
  const [squads, setSquads] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selectedSquad, setSelectedSquad] = useState(null)
  const [squadAthletes, setSquadAthletes] = useState([])
  const [athletesLoading, setAthletesLoading] = useState(false)

  async function fetchSquads() {
    try {
      setError('')
      const r = await api.get('/squads')
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setSquads(list)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load squads.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSquads()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchSquads()
  }, [])

  async function openSquad(squad) {
    setSelectedSquad(squad)
    setSquadAthletes([])
    setAthletesLoading(true)
    try {
      const r = await api.get(`/squads/${squad.id}/athletes`)
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? []
      setSquadAthletes(list)
    } catch {
      setSquadAthletes([])
    } finally {
      setAthletesLoading(false)
    }
  }

  function closeModal() {
    setSelectedSquad(null)
    setSquadAthletes([])
  }

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

  if (squads.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon={Layers}
          title="No squads yet"
          subtitle="Create squads to organise your athletes into training groups."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={squads}
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
            style={styles.squadCard}
            onPress={() => openSquad(item)}
            activeOpacity={0.75}
          >
            <View style={styles.squadRow}>
              <View style={styles.squadIconBox}>
                <Layers size={20} color={colors.primary} />
              </View>
              <View style={styles.squadInfo}>
                <Text style={styles.squadName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.squadDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Badge
                label={`${item.athletes_count ?? item.athletes?.length ?? 0} athletes`}
                color="green"
              />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Squad detail modal */}
      <Modal
        visible={!!selectedSquad}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <RNSafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedSquad?.name}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          {selectedSquad?.description ? (
            <Text style={styles.modalDesc}>{selectedSquad.description}</Text>
          ) : null}

          <Text style={styles.modalSectionTitle}>Athletes</Text>
          {athletesLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : squadAthletes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No athletes in this squad"
              subtitle="Athletes assigned to this squad will appear here."
            />
          ) : (
            <ScrollView>
              {squadAthletes.map((a) => (
                <View key={a.id} style={styles.athleteRow}>
                  <Avatar name={a.name} url={a.avatar_url} size="sm" />
                  <Text style={styles.athleteName}>{a.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </RNSafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  squadCard: {
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
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  squadIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadInfo: { flex: 1 },
  squadName: { fontSize: font.base, fontWeight: '700', color: colors.text },
  squadDesc: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    margin: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: font.sm },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: font.xl, fontWeight: '700', color: colors.text },
  closeBtn: { padding: 4 },
  modalDesc: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  athleteName: { fontSize: font.base, color: colors.text, fontWeight: '500' },
})
