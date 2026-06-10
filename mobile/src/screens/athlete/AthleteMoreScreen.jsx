import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { colors, font, spacing, radius } from '../../lib/theme'

const SECTIONS = [
  {
    title: 'Activity',
    items: [
      { label: 'Calendar',       icon: 'calendar-outline',      screen: 'CalendarList' },
      { label: 'Volunteering',   icon: 'hand-left-outline',     screen: 'VolunteeringScreen' },
      { label: 'Trophy Cabinet', icon: 'trophy-outline',        screen: 'TrophyCabinetScreen' },
      { label: 'Search Clubs',   icon: 'search-outline',        screen: 'ClubsScreen' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', icon: 'notifications-outline', screen: 'NotificationsList' },
      { label: 'Settings',      icon: 'settings-outline',      screen: 'SettingsList' },
    ],
  },
]

export default function AthleteMoreScreen() {
  const navigation = useNavigation()
  const { logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try { await logout() } finally { setSigningOut(false) }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, idx < section.items.length - 1 && styles.rowBorder]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut} activeOpacity={0.8}>
          {signingOut
            ? <ActivityIndicator color={colors.error} size="small" />
            : <>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
                <Text style={styles.signOutText}>Sign out</Text>
              </>}
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  rowLabel: { flex: 1, fontSize: font.base, fontWeight: '600', color: colors.text },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1.5, borderColor: colors.error,
    borderRadius: radius.lg, paddingVertical: 15,
    backgroundColor: '#fff', marginTop: spacing.sm,
  },
  signOutText: { fontSize: font.base, fontWeight: '700', color: colors.error },
})
