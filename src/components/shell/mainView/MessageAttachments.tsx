/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { File, FileText, Image as ImageIcon } from 'lucide-react'

type ParsedAttachment = {
  name: string
  type: string
  size: string
  isImage: boolean
  imageData?: string
  imageMimeType?: string
  fileData?: string
  fileDataMimeType?: string
  isTruncated?: boolean
}

type MessageAttachmentProps = {
  attachments: ParsedAttachment[]
}

type AttachmentViewerProps = {
  attachments: ParsedAttachment[]
  initialIndex: number
  onClose: () => void
}

function isPdfAttachment(attachment: ParsedAttachment): boolean {
  return attachment.type === 'application/pdf'
}

function canPreviewAttachment(attachment: ParsedAttachment): boolean {
  return (
    (attachment.isImage && Boolean(attachment.imageData) && Boolean(attachment.imageMimeType)) ||
    (isPdfAttachment(attachment) && Boolean(attachment.fileData))
  )
}

function getAttachmentDataUrl(attachment: ParsedAttachment): string | null {
  if (attachment.isImage && attachment.imageData && attachment.imageMimeType) {
    return `data:${attachment.imageMimeType};base64,${attachment.imageData}`
  }

  if (attachment.fileData && attachment.fileDataMimeType) {
    return `data:${attachment.fileDataMimeType};base64,${attachment.fileData}`
  }

  return null
}

function AttachmentIcon({ attachment }: { attachment: ParsedAttachment }) {
  if (attachment.isImage) {
    return <ImageIcon className="h-4 w-4" />
  }
  if (isPdfAttachment(attachment)) {
    return <FileText className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

function AttachmentViewer({ attachments, initialIndex, onClose }: AttachmentViewerProps): ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((current) => Math.min(current + 1, attachments.length - 1))
        return
      }
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((current) => Math.max(current - 1, 0))
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [attachments.length, onClose])

  const selectedAttachment = attachments[selectedIndex]
  if (!selectedAttachment) {
    return null
  }

  const selectedDataUrl = getAttachmentDataUrl(selectedAttachment)

  return (
    <div
      className="message-attachment-viewer-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="message-attachment-viewer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={selectedAttachment.name}
      >
        <div className="message-attachment-viewer-header">
          <div className="message-attachment-viewer-title-group">
            <span className="message-attachment-viewer-title">{selectedAttachment.name}</span>
            <span className="message-attachment-viewer-subtitle">
              {selectedAttachment.type} · {selectedAttachment.size}
              {selectedAttachment.isTruncated ? ' · preview truncated' : ''}
            </span>
          </div>
          <button
            type="button"
            className="message-attachment-viewer-close"
            onClick={onClose}
            aria-label="Close attachment viewer"
          >
            ×
          </button>
        </div>

        <div className="message-attachment-viewer-content">
          {selectedAttachment.isImage && selectedDataUrl ? (
            <img
              className="message-attachment-viewer-image"
              src={selectedDataUrl}
              alt={selectedAttachment.name}
            />
          ) : isPdfAttachment(selectedAttachment) && selectedDataUrl ? (
            <iframe
              title={selectedAttachment.name}
              src={selectedDataUrl}
              className="message-attachment-viewer-pdf"
            />
          ) : (
            <div className="message-attachment-viewer-empty">
              Preview unavailable for this attachment.
            </div>
          )}
        </div>

        {attachments.length > 1 ? (
          <div className="message-attachment-viewer-thumbnails" role="tablist" aria-label="Attachment previews">
            {attachments.map((attachment, index) => {
              const thumbUrl = getAttachmentDataUrl(attachment)
              const isSelected = index === selectedIndex
              return (
                <button
                  key={`${attachment.name}-${index}`}
                  type="button"
                  className={`message-attachment-viewer-thumbnail ${isSelected ? 'message-attachment-viewer-thumbnail-active' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                  role="tab"
                  aria-selected={isSelected}
                  title={attachment.name}
                >
                  <div className="message-attachment-viewer-thumbnail-preview">
                    {attachment.isImage && thumbUrl ? (
                      <img src={thumbUrl} alt={attachment.name} className="message-attachment-viewer-thumbnail-image" />
                    ) : isPdfAttachment(attachment) ? (
                      <div className="message-attachment-viewer-thumbnail-pdf">
                        <FileText className="h-5 w-5" />
                        <span>PDF</span>
                      </div>
                    ) : canPreviewAttachment(attachment) ? (
                      <div className="message-attachment-viewer-thumbnail-file">
                        <AttachmentIcon attachment={attachment} />
                        <span>Open</span>
                      </div>
                    ) : (
                      <div className="message-attachment-viewer-thumbnail-file">
                        <AttachmentIcon attachment={attachment} />
                        <span>No preview</span>
                      </div>
                    )}
                  </div>
                  <span className="message-attachment-viewer-thumbnail-name">{attachment.name}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function MessageAttachments({ attachments }: MessageAttachmentProps): ReactNode {
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number | null>(null)

  if (attachments.length === 0) {
    return null
  }

  return (
    <>
      <div className="message-attachments">
        {attachments.map((attachment, index) => {
          const previewable = canPreviewAttachment(attachment)
          const dataUrl = getAttachmentDataUrl(attachment)

          if (attachment.isImage && dataUrl) {
            return (
              <button
                key={`${attachment.name}-${index}`}
                type="button"
                className={`message-image-preview ${previewable ? 'message-attachment-clickable' : ''}`}
                onClick={() => previewable && setSelectedAttachmentIndex(index)}
                title={previewable ? `Open ${attachment.name}` : attachment.name}
                disabled={!previewable}
              >
                <img
                  className="message-image-preview-thumb"
                  src={dataUrl}
                  alt={attachment.name}
                />
                <div className="message-image-preview-meta">
                  <span className="message-image-preview-name">{attachment.name}</span>
                  <span className="message-image-preview-size">{attachment.size}</span>
                </div>
              </button>
            )
          }

          return (
            <button
              key={`${attachment.name}-${index}`}
              type="button"
              className={`message-attachment-chip ${previewable ? 'message-attachment-clickable' : ''}`}
              onClick={() => previewable && setSelectedAttachmentIndex(index)}
              title={previewable ? `Open ${attachment.name}` : attachment.name}
              disabled={!previewable}
            >
              <AttachmentIcon attachment={attachment} />
              <span className="message-attachment-chip-label">
                {attachment.name} ({attachment.type}, {attachment.size})
              </span>
            </button>
          )
        })}
      </div>
      {selectedAttachmentIndex !== null ? (
        <AttachmentViewer
          attachments={attachments}
          initialIndex={selectedAttachmentIndex}
          onClose={() => setSelectedAttachmentIndex(null)}
        />
      ) : null}
    </>
  )
}

// Parse attachment text format from message content
// Example format:
// --- Pièce jointe 1 ---
// Nom: filename.png
// Type: image/png
// Taille: 478.9 KB
// [optional base64 data for images]
// Remove attachment text blocks from message content
export function removeAttachmentText(text: string): string {
  return text.replace(/--- Pièce jointe \d+ ---[\s\S]*?(?=\n--- Pièce jointe \d+ ---|$)/g, '').trim()
}

function parseFilePayload(rest: string | undefined, type: string): Pick<ParsedAttachment, 'fileData' | 'fileDataMimeType' | 'isTruncated'> {
  if (!rest || !rest.trim()) {
    return {}
  }

  const cleanedData = rest.trim()

  if (cleanedData.startsWith('data:')) {
    const dataUrlMatch = cleanedData.match(/^data:(.+?);base64,([A-Za-z0-9+/=]+)$/s)
    if (dataUrlMatch) {
      return {
        fileDataMimeType: dataUrlMatch[1],
        fileData: dataUrlMatch[2],
      }
    }
  }

  const binaryPreviewMatch = cleanedData.match(/Aperçu base64 \(fichier binaire\)( - TRONQUÉ)?:[\s\S]*?\n([A-Za-z0-9+/=]+)$/s)
  if (binaryPreviewMatch) {
    return {
      fileDataMimeType: type,
      fileData: binaryPreviewMatch[2],
      isTruncated: Boolean(binaryPreviewMatch[1]),
    }
  }

  return {}
}

export function parseAttachmentsFromText(text: string): MessageAttachmentProps['attachments'] {
  const attachmentRegex = /--- Pièce jointe \d+ ---\nNom: ([^\n]+)\nType: ([^\n]+)\nTaille: ([^\n]+)(?:\n(?!--- Pièce jointe \d+ ---)([\s\S]*?))?(?=\n--- Pièce jointe \d+ ---|$)/g
  const matches = [...text.matchAll(attachmentRegex)]
  const attachments: MessageAttachmentProps['attachments'] = []

  for (const match of matches) {
    const [, name, type, size, rest] = match

    if (!name || !type || !size) continue

    const isImage = type.startsWith('image/')
    let imageData: string | undefined
    let imageMimeType: string | undefined

    if (isImage && rest && rest.trim()) {
      const cleanedData = rest.trim()

      if (cleanedData.startsWith('data:')) {
        const dataUrlMatch = cleanedData.match(/^data:(.+?);base64,(.+)$/)
        if (dataUrlMatch) {
          imageMimeType = dataUrlMatch[1]
          imageData = dataUrlMatch[2]
        }
      } else if (cleanedData.match(/^[A-Za-z0-9+/=]+$/)) {
        imageData = cleanedData
        imageMimeType = type
      }
    }

    const filePayload = isImage ? {} : parseFilePayload(rest, type.trim())

    attachments.push({
      name: name.trim(),
      type: type.trim(),
      size: size.trim(),
      isImage,
      imageData,
      imageMimeType,
      ...filePayload,
    })
  }

  return attachments
}

// Check if text contains attachment patterns
export function hasAttachments(text: string): boolean {
  return /--- Pièce jointe \d+ ---/.test(text)
}
