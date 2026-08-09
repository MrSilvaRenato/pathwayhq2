import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import api from '../lib/api'
import { colors, font, spacing, radius } from '../lib/theme'

/**
 * ImageUpload — tap to pick from photo library, uploads to /upload/image,
 * calls onChange(url) on success or onChange(null) on clear.
 *
 * Props:
 *   value      — current image URL or null
 *   onChange   — called with URL string after upload, or null on clear
 *   type       — upload type hint: 'logo' | 'cover' | 'announcement' | 'avatar'
 */
export default function ImageUpload({ value, onChange, type = 'general' }) {
  const [uploading, setUploading] = useState(false)

  async function pick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    })

    if (result.canceled || !result.assets?.length) return

    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg'

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', { uri: asset.uri, name: `upload.${ext}`, type: mime })
      formData.append('type', type)

      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
    } catch {
      Alert.alert('Upload failed', 'Could not upload the image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function clear() {
    Alert.alert('Remove image', 'Remove this hero image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onChange(null) },
    ])
  }

  if (value) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.changeBtn} onPress={pick} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
                <Text style={styles.changeBtnText}>Change</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={clear} disabled={uploading}>
            <Ionicons name="trash-outline" size={14} color={colors.error} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <TouchableOpacity style={styles.dropzone} onPress={pick} disabled={uploading} activeOpacity={0.7}>
      {uploading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.dropzoneText}>Uploading…</Text>
        </>
      ) : (
        <>
          <View style={styles.dropzoneIcon}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.dropzoneText}>Tap to choose a photo</Text>
          <Text style={styles.dropzoneHint}>PNG, JPG — max 5 MB</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  previewWrap: { borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
  preview: { width: '100%', height: 160 },
  previewActions: {
    flexDirection: 'row', gap: 8, padding: spacing.sm,
    backgroundColor: colors.background,
  },
  changeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 9,
  },
  changeBtnText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  removeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: colors.error,
    borderRadius: radius.sm, paddingVertical: 9,
  },
  removeBtnText: { color: colors.error, fontSize: font.sm, fontWeight: '700' },

  dropzone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: spacing.xl,
    alignItems: 'center', gap: 8, backgroundColor: '#fafafa',
    marginBottom: spacing.sm,
  },
  dropzoneIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  dropzoneText: { fontSize: font.sm, fontWeight: '600', color: colors.textSecondary },
  dropzoneHint: { fontSize: font.xs, color: colors.textMuted },
})
