import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, font, spacing, radius } from '../lib/theme'

export default function EmptyState({ iconName, title, subtitle, action }) {
  return (
    <View style={styles.container}>
      {iconName && (
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={36} color={colors.textMuted} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <TouchableOpacity style={styles.button} onPress={action.onPress}>
          <Text style={styles.buttonText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  title: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: font.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: font.base,
  },
})
