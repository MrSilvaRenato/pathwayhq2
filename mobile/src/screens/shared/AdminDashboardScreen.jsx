import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../lib/theme'
import api from '../../lib/api'

function StatCard({ iconName, label, value }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name={iconName} size={20} color={colors.primary} />
      </View>
      <Text style={styles.cardValue}>{value ?? '—'}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  )
}

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
        <Text style={styles.title}>Platform Overview</Text>
      </View>
      <View style={styles.grid}>
        <StatCard iconName="people-outline"   label="Users"    value={stats?.users} />
        <StatCard iconName="business-outline" label="Clubs"    value={stats?.clubs} />
        <StatCard iconName="pulse-outline"    label="Athletes" value={stats?.athletes} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  cardLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
})
