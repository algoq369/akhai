'use client'

import { useState, useRef } from 'react'

interface AttachedFile {
  id: string
  file: File
  preview?: string
  type: 'image' | 'pdf' | 'document'
  url?: string
  uploaded?: boolean
}

interface UploadedFileData {
  id: string
  url: string
  name: string
  size: number
  type: string
}

interface FileAttachmentProps {
  onFilesChange: (files: File[]) => void
  onUploadComplete?: (files: UploadedFileData[]) => void
  maxFiles?: number
  maxSizeMB?: number
}

export default function FileAttachment({
  onFilesChange,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10
}: FileAttachmentProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = {
    image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    pdf: ['application/pdf'],
    document: ['text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }

  const getFileType = (mimeType: string): 'image' | 'pdf' | 'document' => {
    if (ALLOWED_TYPES.image.includes(mimeType)) return 'image'
    if (ALLOWED_TYPES.pdf.includes(mimeType)) return 'pdf'
    return 'document'
  }

  const isValidFile = (file: File): boolean => {
    const allTypes = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.pdf, ...ALLOWED_TYPES.document]
    if (!allTypes.includes(file.type)) {
      alert(`File type not supported: ${file.type}`)
      return false
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      alert(`File too large: ${sizeMB.toFixed(1)}MB (max: ${maxSizeMB}MB)`)
      return false
    }

    return true
  }

  const createPreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }
    return undefined
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)

      // Update attached files with URLs
      setAttachedFiles(prev =>
        prev.map(attached => {
          const uploaded = data.files.find((f: UploadedFileData) => f.name === attached.file.name)
          if (uploaded) {
            return { ...attached, url: uploaded.url, uploaded: true }
          }
          return attached
        })
      )

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(data.files)
      }

      console.log('Files uploaded:', data.files)

    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 1000)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(isValidFile)

    if (attachedFiles.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: AttachedFile[] = await Promise.all(
      validFiles.map(async (file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: await createPreview(file),
        type: getFileType(file.type),
        uploaded: false
      }))
    )

    const updated = [...attachedFiles, ...newFiles]
    setAttachedFiles(updated)
    onFilesChange(updated.map(f => f.file))

    // Auto-upload files
    if (validFiles.length > 0) {
      await uploadFiles(validFiles)
    }
  }

  const removeFile = (id: string) => {
    const updated = attachedFiles.filter(f => f.id !== id)
    setAttachedFiles(updated)
    onFilesChange(updated.map(f => f.file))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      {/* Attach Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="font-mono text-xs text-relic-silver hover:text-relic-slate dark:text-relic-ghost dark:hover:text-white transition-colors flex items-center gap-1.5"
        title="Attach files"
      >
        <span>📎</span>
        <span>attach</span>
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.docx"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Drag & Drop Overlay (shows when dragging) */}
      {isDragging && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-relic-void/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="border-2 border-dashed border-relic-ghost dark:border-white p-12">
            <p className="font-mono text-sm text-relic-ghost dark:text-white">
              drop files here
            </p>
          </div>
        </div>
      )}

      {/* Drop Zone (subtle, always visible when no files attached) */}
      {attachedFiles.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border border-dashed border-relic-mist dark:border-relic-slate/30 p-3 transition-colors hover:border-relic-slate dark:hover:border-relic-ghost"
        >
          <p className="font-mono text-[10px] text-relic-silver dark:text-relic-ghost text-center">
            drag & drop files or click attach
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-1 bg-relic-ghost dark:bg-relic-slate/30 overflow-hidden">
            <div
              className="h-full bg-relic-slate dark:bg-relic-ghost transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="font-mono text-[8px] text-relic-silver dark:text-relic-ghost">
            uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-relic-silver dark:text-relic-ghost">
            attached ({attachedFiles.length}/{maxFiles}):
          </p>

          <div className="space-y-1.5">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 border border-relic-mist dark:border-relic-slate/30 p-2 bg-white dark:bg-relic-void/30"
              >
                {/* Preview */}
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-10 h-10 object-cover border border-relic-mist dark:border-relic-slate/30"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center border border-relic-mist dark:border-relic-slate/30 bg-relic-ghost dark:bg-relic-slate/10">
                    <span className="text-base">
                      {file.type === 'pdf' ? '📄' : '📝'}
                    </span>
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-relic-slate dark:text-relic-ghost truncate">
                    {file.file.name}
                  </p>
                  <p className="font-mono text-[8px] text-relic-silver">
                    {(file.file.size / 1024).toFixed(1)} KB
                    {file.uploaded && <span className="ml-1">✓</span>}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="font-mono text-xs text-relic-silver hover:text-relic-slate dark:text-relic-ghost dark:hover:text-white transition-colors px-1"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
