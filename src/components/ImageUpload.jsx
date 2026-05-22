import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import api from '../lib/api'

/**
 * ImageUpload — drag-and-drop / click-to-browse image uploader.
 *
 * Props:
 *   value      — current image URL (string or null)
 *   onChange   — called with new URL string after upload, or null on clear
 *   type       — upload type hint: 'logo' | 'cover' | 'announcement' | 'avatar'
 *   label      — field label shown above
 *   aspectHint — optional text like "16:9 recommended"
 *   className  — extra classes on the wrapper
 *   previewClass — extra classes on the preview image
 */
export default function ImageUpload({
  value,
  onChange,
  type = 'general',
  label,
  aspectHint,
  className = '',
  previewClass = '',
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const [dragging, setDragging]   = useState(false)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('image', file)
      form.append('type', type)

      const res = await api.post('/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(res.data.url)
    } catch (e) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0])
    e.target.value = '' // allow re-selecting same file
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {aspectHint && <span className="ml-2 text-xs text-slate-500">{aspectHint}</span>}
        </label>
      )}

      {/* Preview */}
      {value && (
        <div className="relative group w-full">
          <img
            src={value}
            alt="Preview"
            className={`w-full object-cover rounded-xl border border-white/10 ${previewClass}`}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`
            relative flex flex-col items-center justify-center gap-3
            rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors
            ${dragging
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}
          `}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 text-emerald-400 animate-spin" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">
              {uploading ? 'Uploading…' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, GIF, WebP — max 5 MB</p>
          </div>
        </div>
      )}

      {/* Change button when preview shown */}
      {value && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <Upload className="h-3.5 w-3.5" /> Change image
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
