import { Cloud, FolderGit2 } from 'lucide-react'
import { useState, useEffect } from 'react'

type ProjectIconProps = {
  icon: string | null | undefined
  location?: 'local' | 'cloud'
  cloudStatus?: 'connected' | 'connecting' | 'disconnected' | 'error' | null
  size?: number
  loadAsDataUrl?: boolean
}

/** Render a project icon: emoji text, file:// image (as data URL), or default FolderGit2 */
export function ProjectIcon({ icon, location = 'local', cloudStatus = null, size = 16, loadAsDataUrl = false }: ProjectIconProps) {
  const trimmed = icon?.trim()
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  const cloudColor =
    cloudStatus === 'connected'
      ? '#16a34a'
      : cloudStatus === 'connecting'
        ? '#f59e0b'
        : cloudStatus === 'error' || cloudStatus === 'disconnected'
          ? '#dc2626'
          : '#94a3b8'

  const renderBadge = () =>
    location === 'cloud' ? (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -4,
          bottom: -4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: Math.max(10, Math.round(size * 0.75)),
          height: Math.max(10, Math.round(size * 0.75)),
          borderRadius: 999,
          background: 'white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        <Cloud style={{ width: Math.max(8, Math.round(size * 0.5)), height: Math.max(8, Math.round(size * 0.5)), color: cloudColor }} />
      </span>
    ) : null

  const wrap = (child: React.ReactNode) => (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {child}
      {renderBadge()}
    </span>
  )

  // Convert file:// path to data URL on mount
  useEffect(() => {
    if (!trimmed?.startsWith('file://') || !loadAsDataUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDataUrl(null)
      return
    }
    let cancelled = false
    const imagePath = trimmed.replace(/^file:\/\//, '')
    window.chaton
      .imageToDataUrl(imagePath)
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null)
        }
      })
    return () => { cancelled = true }
  }, [trimmed, loadAsDataUrl])

  if (!trimmed) {
    return wrap(<FolderGit2 className="shrink-0" style={{ width: size, height: size }} />)
  }
  if (trimmed.startsWith('file://')) {
    if (!loadAsDataUrl) {
      // Fallback: try file:// directly (may not work in Electron)
      const src = trimmed.replace(/^file:\/\//, '')
      return wrap(
        <img
          src={`file://${src}`}
          alt=""
          className="project-icon-image shrink-0"
          style={{ width: size, height: size, objectFit: 'cover', borderRadius: 3 }}
          draggable={false}
        />
      )
    }
    // Use data URL if available
    if (dataUrl) {
      return wrap(
        <img
          src={dataUrl}
          alt=""
          className="project-icon-image shrink-0"
          style={{ width: size, height: size, objectFit: 'cover', borderRadius: 3 }}
          draggable={false}
        />
      )
    }
    // Still loading
    return wrap(<FolderGit2 className="shrink-0" style={{ width: size, height: size, opacity: 0.5 }} />)
  }
  return wrap(<span>{trimmed}</span>)
}
