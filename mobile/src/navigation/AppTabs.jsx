import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../lib/theme'
import { useState, useEffect } from 'react'
import api from '../lib/api'

// Athlete screens
import DashboardScreen from '../screens/athlete/DashboardScreen'
import MilestonesScreen from '../screens/athlete/MilestonesScreen'
import AnnouncementsScreen from '../screens/athlete/AnnouncementsScreen'
import RegistrationsScreen from '../screens/athlete/RegistrationsScreen'

// Manager screens
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen'
import AthletesScreen from '../screens/manager/AthletesScreen'
import AthleteDetailScreen from '../screens/manager/AthleteDetailScreen'
import JoinRequestsScreen from '../screens/manager/JoinRequestsScreen'
import SquadsScreen from '../screens/manager/SquadsScreen'
import SeasonsScreen from '../screens/manager/SeasonsScreen'
import CalendarScreen from '../screens/manager/CalendarScreen'
import AnalyticsScreen from '../screens/manager/AnalyticsScreen'
import ClubBroadcastScreen from '../screens/manager/ClubBroadcastScreen'
import MoreScreen from '../screens/manager/MoreScreen'
import TrophyCabinetScreen from '../screens/manager/TrophyCabinetScreen'

// Shared screens
import SettingsScreen from '../screens/shared/SettingsScreen'
import NotificationsScreen from '../screens/shared/NotificationsScreen'
import AdminDashboardScreen from '../screens/shared/AdminDashboardScreen'
import VolunteeringScreen from '../screens/shared/VolunteeringScreen'
import ClubsScreen from '../screens/shared/ClubsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#fff' },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
}

function SimpleStack({ screen: Screen, name, title }) {
  const S = createNativeStackNavigator()
  return (
    <S.Navigator screenOptions={HEADER_OPTS}>
      <S.Screen name={name} component={Screen} options={{ title }} />
    </S.Navigator>
  )
}

// ── Athlete stacks ────────────────────────────────────────────────────────────

function AthleteStack() {
  const S = createNativeStackNavigator()
  return (
    <S.Navigator screenOptions={HEADER_OPTS}>
      <S.Screen name="AthleteDashboard" component={DashboardScreen}     options={{ title: 'Dashboard' }} />
      <S.Screen name="ClubsScreen"       component={ClubsScreen}         options={{ title: 'Search Clubs' }} />
      <S.Screen name="NotificationsList" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </S.Navigator>
  )
}
function AnnouncementsStack() {
  return <SimpleStack screen={AnnouncementsScreen} name="AnnouncementsList" title="Announcements" />
}
function MilestonesStack() {
  return <SimpleStack screen={MilestonesScreen} name="MilestonesList" title="Milestones" />
}
function RegistrationsStack() {
  return <SimpleStack screen={RegistrationsScreen} name="RegistrationsList" title="Registrations" />
}

// ── Manager stacks ────────────────────────────────────────────────────────────

function ManagerDashboardStack() {
  return <SimpleStack screen={ManagerDashboardScreen} name="ManagerDashboard" title="Dashboard" />
}

function AthletesManagerStack() {
  const S = createNativeStackNavigator()
  return (
    <S.Navigator screenOptions={HEADER_OPTS}>
      <S.Screen name="AthletesList" component={AthletesScreen} options={{ title: 'Athletes' }} />
      <S.Screen
        name="AthleteDetail"
        component={AthleteDetailScreen}
        options={({ route }) => ({ title: route.params?.athlete?.name ?? 'Athlete' })}
      />
    </S.Navigator>
  )
}

function CalendarStack() {
  return <SimpleStack screen={CalendarScreen} name="CalendarList" title="Calendar" />
}

function MilestonesManagerStack() {
  return <SimpleStack screen={MilestonesScreen} name="MilestonesListManager" title="Milestones" />
}

// "More" stack — contains all secondary screens reachable from the More tab
function MoreManagerStack({ pendingCount }) {
  const S = createNativeStackNavigator()
  const MoreWithProps = (props) => <MoreScreen {...props} pendingCount={pendingCount} />
  return (
    <S.Navigator screenOptions={HEADER_OPTS}>
      <S.Screen name="MoreList" options={{ title: 'More' }}>
        {(props) => <MoreScreen {...props} pendingCount={pendingCount} />}
      </S.Screen>
      <S.Screen name="JoinRequestsList"   component={JoinRequestsScreen}    options={{ title: 'Join Requests' }} />
      <S.Screen name="ClubsScreen"        component={ClubsScreen}            options={{ title: 'Search Clubs' }} />
      <S.Screen name="SquadsList"         component={SquadsScreen}           options={{ title: 'Squads' }} />
      <S.Screen name="SeasonsList"        component={SeasonsScreen}          options={{ title: 'Seasons' }} />
      <S.Screen name="AnnouncementsList"  component={AnnouncementsScreen}    options={{ title: 'Announcements' }} />
      <S.Screen name="BroadcastScreen"    component={ClubBroadcastScreen}    options={{ title: 'Broadcast' }} />
      <S.Screen name="AnalyticsScreen"      component={AnalyticsScreen}        options={{ title: 'Analytics' }} />
      <S.Screen name="TrophyCabinetScreen" component={TrophyCabinetScreen}    options={{ title: 'Trophy Cabinet' }} />
      <S.Screen name="VolunteeringScreen"  component={VolunteeringScreen}     options={{ title: 'Volunteering' }} />
      <S.Screen name="SettingsList"        component={SettingsScreen}         options={{ title: 'Settings' }} />
      <S.Screen name="NotificationsList"   component={NotificationsScreen}    options={{ title: 'Notifications' }} />
    </S.Navigator>
  )
}

// ── Shared stacks ─────────────────────────────────────────────────────────────

function SettingsStack() {
  return <SimpleStack screen={SettingsScreen} name="SettingsList" title="Settings" />
}
function AdminDashboardStack() {
  return <SimpleStack screen={AdminDashboardScreen} name="AdminDashboard" title="Admin" />
}
function NotificationsStack() {
  return <SimpleStack screen={NotificationsScreen} name="NotificationsList" title="Notifications" />
}

// ── Tab icons ─────────────────────────────────────────────────────────────────

function TabIcon({ name, color, size }) {
  return <Ionicons name={name} size={size} color={color} />
}

function BadgeIcon({ name, color, size, count }) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  )
}

// ── Main navigator ────────────────────────────────────────────────────────────

export default function AppTabs() {
  const { user } = useAuth()
  const role = user?.role
  const [pendingCount, setPendingCount] = useState(0)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (role === 'club_admin' || role === 'coach') {
      api.get('/club/join-requests')
        .then((r) => {
          const pending = (r.data || []).filter((req) => req.status === 'pending')
          setPendingCount(pending.length)
        })
        .catch(() => {})
    }
  }, [role])

  const tabBarStyle = {
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 60 + insets.bottom,
      paddingBottom: 8 + insets.bottom,
      paddingTop: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    headerShown: false,
  }

  // ── Site admin ──────────────────────────────────────────────────────────────
  if (role === 'site_admin') {
    return (
      <Tab.Navigator screenOptions={tabBarStyle}>
        <Tab.Screen name="AdminDash" component={AdminDashboardStack} options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabIcon name="shield-checkmark-outline" color={color} size={size} />,
        }} />
        <Tab.Screen name="Notifications" component={NotificationsStack} options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <TabIcon name="notifications-outline" color={color} size={size} />,
        }} />
        <Tab.Screen name="Settings" component={SettingsStack} options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="settings-outline" color={color} size={size} />,
        }} />
      </Tab.Navigator>
    )
  }

  // ── Club admin / coach — matches web mobile: Dashboard | Athletes | Calendar | Awards | More
  if (role === 'club_admin' || role === 'coach') {
    return (
      <Tab.Navigator screenOptions={tabBarStyle}>
        <Tab.Screen name="ManagerDash" component={ManagerDashboardStack} options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabIcon name="grid-outline" color={color} size={size} />,
        }} />
        <Tab.Screen name="Athletes" component={AthletesManagerStack} options={{
          title: 'Athletes',
          tabBarIcon: ({ color, size }) => <TabIcon name="people-outline" color={color} size={size} />,
        }} />
        <Tab.Screen name="Calendar" component={CalendarStack} options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <TabIcon name="calendar-outline" color={color} size={size} />,
        }} />
        <Tab.Screen name="Awards" component={MilestonesManagerStack} options={{
          title: 'Awards',
          tabBarIcon: ({ color, size }) => <TabIcon name="trophy-outline" color={color} size={size} />,
        }} />
        <Tab.Screen
          name="More"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <BadgeIcon name="ellipsis-horizontal-outline" color={color} size={size} count={pendingCount} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault()
              navigation.navigate('More', { screen: 'MoreList' })
            },
          })}
        >
          {() => <MoreManagerStack pendingCount={pendingCount} />}
        </Tab.Screen>
      </Tab.Navigator>
    )
  }

  // ── Athlete / parent ────────────────────────────────────────────────────────
  return (
    <Tab.Navigator screenOptions={tabBarStyle}>
      <Tab.Screen name="Dashboard" component={AthleteStack} options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <TabIcon name="barbell-outline" color={color} size={size} />,
      }} />
      <Tab.Screen name="Announcements" component={AnnouncementsStack} options={{
        title: 'Announcements',
        tabBarIcon: ({ color, size }) => <TabIcon name="megaphone-outline" color={color} size={size} />,
      }} />
      <Tab.Screen name="Milestones" component={MilestonesStack} options={{
        title: 'Milestones',
        tabBarIcon: ({ color, size }) => <TabIcon name="trophy-outline" color={color} size={size} />,
      }} />
      <Tab.Screen name="Registrations" component={RegistrationsStack} options={{
        title: 'Registrations',
        tabBarIcon: ({ color, size }) => <TabIcon name="card-outline" color={color} size={size} />,
      }} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{
        title: 'Settings',
        tabBarIcon: ({ color, size }) => <TabIcon name="settings-outline" color={color} size={size} />,
      }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: colors.error, borderRadius: 999,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
