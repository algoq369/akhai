import { readFile } from 'fs/promises'
import path from 'path'

export interface ProcessedFile {
  type: 'image' | 'text' | 'document'
  filename: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
  content?: string
  note?: string
}

export async function processFiles(fileUrls: string[]): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = []

  for (const url of fileUrls) {
    try {
      const filename = url.replace('/uploads/', '')
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename)
      const ext = path.extname(filename).toLowerCase()

      console.log('📖 file-processor: Reading file:', { url, filename, filepath, ext })

      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        // For images: read as base64 for Claude vision
        const buffer = await readFile(filepath)
        const base64 = buffer.toString('base64')

        let mimeType = 'image/jpeg'
        if (ext === '.png') mimeType = 'image/png'
        else if (ext === '.gif') mimeType = 'image/gif'
        else if (ext === '.webp') mimeType = 'image/webp'

        processedFiles.push({
          type: 'image',
          filename,
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64
          }
        })

      } else if (ext === '.pdf') {
        // For PDFs: extract text content using unpdf (Next.js compatible)
        try {
          console.log('📄 file-processor: Starting PDF extraction for:', filename)
          const buffer = await readFile(filepath)
          console.log('📄 file-processor: PDF buffer size:', buffer.length, 'bytes')
          // Use unpdf - designed for Next.js
          const { getDocumentProxy, extractText } = await import('unpdf')
          const uint8Array = new Uint8Array(buffer)
          const pdf = await getDocumentProxy(uint8Array)
          const { text } = await extractText(pdf, { mergePages: true })
          const content = text.trim()
          console.log('✅ file-processor: PDF extracted successfully, text length:', content.length, 'chars')

          processedFiles.push({
            type: 'document',
            filename,
            content: content || 'PDF file appears to be empty or contains only images'
          })
        } catch (pdfError) {
          console.error(`Error parsing PDF ${filename}:`, pdfError)
          processedFiles.push({
            type: 'document',
            filename,
            note: 'Error extracting PDF text - file may be image-based or corrupted'
          })
        }

      } else if (['.txt', '.md'].includes(ext)) {
        // For text files: read content
        const content = await readFile(filepath, 'utf-8')
        processedFiles.push({
          type: 'text',
          filename,
          content
        })

      } else if (ext === '.docx') {
        // For DOCX: note for future implementation
        processedFiles.push({
          type: 'document',
          filename,
          note: 'DOCX analysis coming soon'
        })
      }

    } catch (error) {
      console.error(`Error processing file ${url}:`, error)
      processedFiles.push({
        type: 'document',
        filename: url,
        note: 'Error reading file'
      })
    }
  }

  return processedFiles
}

export function createFileContext(files: ProcessedFile[]): string {
  if (files.length === 0) return ''

  const parts: string[] = []

  files.forEach((file, index) => {
    if ((file.type === 'text' || file.type === 'document') && file.content) {
      parts.push(`[File ${index + 1}: ${file.filename}]\n${file.content}\n`)
    } else if (file.type === 'document' && file.note) {
      parts.push(`[File ${index + 1}: ${file.filename}] - ${file.note}`)
    }
  })

  if (parts.length === 0) return ''

  return `\n\n--- Attached Files ---\n${parts.join('\n---\n')}\n--- End of Files ---\n`
}
