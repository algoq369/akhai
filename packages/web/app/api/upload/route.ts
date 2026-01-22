import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    // Validate number of files
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          { error: `File type not supported: ${file.type}. Allowed: images, PDF, TXT, MD, DOCX` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = ALLOWED_TYPES[file.type]
      const uniqueId = crypto.randomUUID()
      const filename = `${uniqueId}${ext}`
      const filepath = path.join(uploadsDir, filename)

      // Write file to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      console.log(`File uploaded: ${filename} (${(file.size / 1024).toFixed(1)}KB)`)

      uploadedFiles.push({
        id: uniqueId,
        url: `/uploads/${filename}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/upload',
    methods: ['POST'],
    maxFileSize: '10MB',
    maxFiles: MAX_FILES,
    allowedTypes: Object.keys(ALLOWED_TYPES)
  })
}
