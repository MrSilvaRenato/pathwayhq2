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

// Shared screens
import SettingsScreen from '../screens/shared/SettingsScreen'
import NotificationsScreen from '../screens/shared/NotificationsScreen'
import AdminDashboardScreen from '../screens/shared/AdminDashboardScreen'

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

function AthleteStack() {
  return (
    <SimpleStack screen={DashboardScreen} name="AthleteDashboard" title="Dashboard" />
  )
}

function AnnouncementsStack() {
  return (
    <SimpleStack
      screen={AnnouncementsScreen}
      name="AnnouncementsList"
      title="Announcements"
    />
  )
}

function MilestonesStack() {
  return (
    <SimpleStack screen={MilestonesScreen} name="MilestonesList" title="Milestones" />
  )
}

function RegistrationsStack() {
  return (
    <SimpleStack
      screen={RegistrationsScreen}
      name="RegistrationsList"
      title="Registrations"
    />
  )
}

function AthletesManagerStack() {
  const S = createNativeStackNavigator()
  return (
    <S.Navigator screenOptions={HEADER_OPTS}>
      <S.Screen name="AthletesList" component={AthletesScreen} options={{ title: 'Athletes' }} />
      <S.Screen
        name="AthleteDetail"
        component={AthleteDetailScreen}
        options={({ route }) => ({
          title: route.params?.athlete?.name ?? 'Athlete',
        })}
      />
    </S.Navigator>
  )
}

function JoinRequestsStack() {
  return (
    <SimpleStack
      screen={JoinRequestsScreen}
      name="JoinRequestsList"
      title="Join Requests"
    />
  )
}

function ManagerDashboardStack() {
  return (
    <SimpleStack screen={ManagerDashboardScreen} name="ManagerDashboard" title="Dashboard" />
  )
}

function SquadsStack() {
  return (
    <SimpleStack screen={SquadsScreen} name="SquadsList" title="Squads" />
  )
}

function SeasonsStack() {
  return (
    <SimpleStack screen={SeasonsScreen} name="SeasonsList" title="Seasons" />
  )
}

function SettingsStack() {
  return (
    <SimpleStack screen={SettingsScreen} name="SettingsList" title="Settings" />
  )
}

function AdminDashboardStack() {
  return (
    <SimpleStack screen={AdminDashboardScreen} name="AdminDashboard" title="Admin" />
  )
}

function NotificationsStack() {
  return (
    <SimpleStack screen={NotificationsScreen} name="NotificationsList" title="Notifications" />
  )
}

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

export default function AppTabs() {
  const { user } = useAuth()
  const role = user?.role
  const [pendingCount, setPendingCount] = useState(0)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (role === 'club_admin' || role === 'coach') {
      api
        .get('/club/join-requests')
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

  if (role === 'site_admin') {
    return (
      <Tab.Navigator screenOptions={tabBarStyle}>
        <Tab.Screen
          name="AdminDash"
          component={AdminDashboardStack}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="shield-checkmark-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsStack}
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="notifications-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    )
  }

  if (role === 'club_admin' || role === 'coach') {
    return (
      <Tab.Navigator screenOptions={tabBarStyle}>
        <Tab.Screen
          name="ManagerDash"
          component={ManagerDashboardStack}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="barbell-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Athletes"
          component={AthletesManagerStack}
          options={{
            title: 'Athletes',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="people-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="JoinRequests"
          component={JoinRequestsStack}
          options={{
            title: 'Join Requests',
            tabBarIcon: ({ color, size }) => (
              <BadgeIcon name="person-add-outline" color={color} size={size} count={pendingCount} />
            ),
          }}
        />
        <Tab.Screen
          name="Squads"
          component={SquadsStack}
          options={{
            title: 'Squads',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="layers-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Seasons"
          component={SeasonsStack}
          options={{
            title: 'Seasons',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="calendar-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    )
  }

  // Default: athlete / parent
  return (
    <Tab.Navigator screenOptions={tabBarStyle}>
      <Tab.Screen
        name="Dashboard"
        component={AthleteStack}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="barbell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementsStack}
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="megaphone-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Milestones"
        component={MilestonesStack}
        options={{
          title: 'Milestones',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="trophy-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Registrations"
        component={RegistrationsStack}
        options={{
          title: 'Registrations',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="card-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})
