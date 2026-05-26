import { View, Text, StyleSheet } from 'react-native'

const COLOR_MAP = {
  green: { bg: '#d1fae5', text: '#065f46' },
  amber: { bg: '#fef3c7', text: '#92400e' },
  red:   { bg: '#fee2e2', text: '#991b1b' },
  blue:  { bg: '#dbeafe', text: '#1e40af' },
  slate: { bg: '#f1f5f9', text: '#334155' },
}

export default function Badge({ label, color = 'slate', style }) {
  const scheme = COLOR_MAP[color] ?? COLOR_MAP.slate

  return (
    <View style={[styles.pill, { backgroundColor: scheme.bg }, style]}>
      <Text style={[styles.label, { color: scheme.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
