'use client'

import { useState, useEffect } from 'react'

interface UploadedFileData {
  id: string
  url: string
  name: string
  size: number
  type: string
}

interface FileDropZoneProps {
  onFilesChange: (files: File[]) => void
  onUploadComplete?: (files: UploadedFileData[]) => void
  maxFiles?: number
  maxSizeMB?: number
}

export default function FileDropZone({
  onFilesChange,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [uploading, setUploading] = useState(false)

  const ALLOWED_TYPES = {
    image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    pdf: ['application/pdf'],
    document: ['text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
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

  const uploadFiles = async (files: File[]) => {
    console.log('🔄 FileDropZone: Uploading', files.length, 'files...')
    setUploading(true)

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
      console.log('✅ FileDropZone: Files uploaded successfully:', data.files.map((f: UploadedFileData) => f.url))

      // Notify parent component with uploaded file URLs
      if (onUploadComplete) {
        onUploadComplete(data.files)
      }

    } catch (error) {
      console.error('❌ FileDropZone: Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(isValidFile)

    if (validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Notify parent with File objects (for preview/display)
    onFilesChange(validFiles)

    // Upload files to server
    if (validFiles.length > 0) {
      await uploadFiles(validFiles)
    }
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount === 0) {
        setIsDragging(false)
      }
      return newCount
    })
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)
    handleFiles(e.dataTransfer?.files || null)
  }

  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => handleDragEnter(e)
    const handleWindowDragLeave = (e: DragEvent) => handleDragLeave(e)
    const handleWindowDragOver = (e: DragEvent) => handleDragOver(e)
    const handleWindowDrop = (e: DragEvent) => handleDrop(e)

    window.addEventListener('dragenter', handleWindowDragEnter as any)
    window.addEventListener('dragleave', handleWindowDragLeave as any)
    window.addEventListener('dragover', handleWindowDragOver as any)
    window.addEventListener('drop', handleWindowDrop as any)

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter as any)
      window.removeEventListener('dragleave', handleWindowDragLeave as any)
      window.removeEventListener('dragover', handleWindowDragOver as any)
      window.removeEventListener('drop', handleWindowDrop as any)
    }
  }, [])

  if (!isDragging) return null

  return (
    <div className="fixed inset-0 z-50 bg-relic-void/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        {/* File icon */}
        <div className="mb-4 flex justify-center">
          <svg
            className="w-16 h-16 text-white dark:text-relic-ghost"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* Text */}
        <p className="font-mono text-sm text-white dark:text-relic-ghost">
          drop files here to add to chat
        </p>
      </div>
    </div>
  )
}
