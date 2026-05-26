import { View, Text, Image, StyleSheet } from 'react-native'
import { colors } from '../lib/theme'

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ url, name, size = 'md', style }) {
  const dim = SIZE_MAP[size] ?? SIZE_MAP.md
  const fontSize = dim * 0.38

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[{ width: dim, height: dim, borderRadius: dim / 2 }, style]}
      />
    )
  }

  return (
    <View
      style={[
        styles.circle,
        { width: dim, height: dim, borderRadius: dim / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
