import { Modal, View, Text, TouchableOpacity, Pressable, Linking, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const WEB_BASE = 'https://ausfairgo.com.au'

export default function UpgradeSheet({ visible, message, requiredPlan = 'pro', onClose }) {
  const planName  = requiredPlan === 'elite' ? 'Elite' : 'Pro'
  const planPrice = requiredPlan === 'elite' ? '$79/mo' : '$29/mo'

  function openPricing() {
    Linking.openURL(`${WEB_BASE}/pricing`)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />

          <View style={s.iconWrap}>
            <Ionicons name="flash" size={28} color="#10b981" />
          </View>

          <Text style={s.title}>Upgrade to {planName}</Text>
          <Text style={s.body}>{message}</Text>

          <View style={s.planBadge}>
            <Text style={s.planName}>{planName} Plan</Text>
            <Text style={s.planPrice}>{planPrice} AUD / month</Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={openPricing} activeOpacity={0.85}>
            <Ionicons name="open-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.primaryBtnText}>View plans & upgrade</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.secondaryBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// Extract upgrade info from an axios error response.
// Returns { isUpgrade, message, requiredPlan } or null.
export function parseUpgradeError(err) {
  const data = err?.response?.data
  if (!data?.upgrade_required) return null
  return {
    isUpgrade:    true,
    message:      data.error ?? 'Upgrade your plan to use this feature.',
    requiredPlan: data.required_plan ?? 'pro',
  }
}

const s = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  iconWrap:     { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:        { fontSize: 20, fontWeight: '900', color: '#f8fafc', marginBottom: 10, textAlign: 'center' },
  body:         { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  planBadge:    { width: '100%', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.08)', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 20 },
  planName:     { fontSize: 16, fontWeight: '800', color: '#10b981' },
  planPrice:    { fontSize: 12, color: '#6ee7b7', marginTop: 2 },
  primaryBtn:   { width: '100%', backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
})
