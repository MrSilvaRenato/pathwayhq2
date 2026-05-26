import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import { colors } from '../lib/theme'

const Stack = createNativeStackNavigator()

function LogoTitle() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.iconBox}>
        <Ionicons name="flash" size={16} color="#fff" />
      </View>
      <Text style={styles.logoText}>PathwayHQ</Text>
    </View>
  )
}

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          headerTitle: () => <LogoTitle />,
          headerBackTitle: 'Back',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
})
