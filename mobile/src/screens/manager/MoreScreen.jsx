import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { colors, font, spacing, radius } from '../../lib/theme'

const SECTIONS = [
  {
    title: 'My Club',
    items: [
      { label: 'Join Requests', icon: 'person-add-outline',   screen: 'JoinRequestsList',  badgeKey: 'joinRequests' },
      { label: 'Squads',        icon: 'layers-outline',        screen: 'SquadsList'         },
      { label: 'Seasons',       icon: 'calendar-outline',      screen: 'SeasonsList'        },
      { label: 'Trophy Cabinet', icon: 'trophy-outline',        screen: 'TrophyCabinetScreen' },
      { label: 'Volunteering',  icon: 'hand-left-outline',     screen: 'VolunteeringScreen'  },
    ],
  },
  {
    title: 'Communicate',
    items: [
      { label: 'Announcements', icon: 'megaphone-outline',     screen: 'AnnouncementsList'  },
      { label: 'Broadcast',     icon: 'radio-outline',         screen: 'BroadcastScreen'    },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics',     icon: 'bar-chart-outline',     screen: 'AnalyticsScreen'    },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings',      icon: 'settings-outline',      screen: 'SettingsList'       },
    ],
  },
]

export default function MoreScreen({ pendingCount = 0 }) {
  const navigation = useNavigation()

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
                  {item.badgeKey === 'joinRequests' && pendingCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: radius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowLabel: { flex: 1, fontSize: font.base, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: colors.error, borderRadius: 999, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
