import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import AuthStack from './AuthStack'
import AppTabs from './AppTabs'

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}
