import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker - use the worker from node_modules
// Vite will bundle this correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

console.log('PDF.js version:', pdfjsLib.version)
console.log('PDF.js worker configured for Vite')

/**
 * PDF Preview Service
 * 
 * Converts PDF to images client-side for instant preview
 * Then uploads to backend/Cloudinary in background
 */

class PDFPreviewService {
  /**
   * Convert PDF file to images (base64 data URLs)
   * @param {File} file - PDF file
   * @param {number} scale - Rendering scale (default 2 for high quality)
   * @returns {Promise<Array>} Array of page objects with preview data
   */
  async convertPDFToImages(file, scale = 2) {
    try {
      console.log('Converting PDF:', file.name, 'Size:', file.size)
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength)
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      })
      
      const pdf = await loadingTask.promise
      const pageCount = pdf.numPages
      console.log('PDF loaded successfully, pages:', pageCount)
      
      const pages = []
      
      // Convert each page to image
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        console.log(`Converting page ${pageNum}/${pageCount}...`)
        
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        
        // Create canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
        
        // Convert to base64 image
        const imageDataUrl = canvas.toDataURL('image/png')
        
        pages.push({
          pageNumber: pageNum,
          imageUrl: imageDataUrl, // Temporary local preview
          width: viewport.width / scale, // Actual page dimensions
          height: viewport.height / scale,
          blob: await this.dataURLToBlob(imageDataUrl), // For upload
        })
      }
      
      console.log('PDF conversion complete!')
      return pages
    } catch (error) {
      console.error('PDF conversion error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      // Provide more specific error messages
      if (error.name === 'PasswordException') {
        throw new Error('This PDF is password protected. Please provide an unprotected PDF.')
      } else if (error.name === 'InvalidPDFException') {
        throw new Error('Invalid PDF file. The file may be corrupted.')
      } else if (error.message?.includes('worker')) {
        throw new Error('PDF worker failed to load. Please check your internet connection.')
      } else {
        throw new Error(`Failed to process PDF: ${error.message || 'Unknown error'}`)
      }
    }
  }
  
  /**
   * Convert data URL to Blob for upload
   */
  async dataURLToBlob(dataURL) {
    const response = await fetch(dataURL)
    return await response.blob()
  }
  
  /**
   * Upload page images to backend
   * @param {string} projectId - Project ID
   * @param {Array} pages - Array of page objects with blobs
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result with page data
   */
  async uploadPagesToBackend(projectId, pages, onProgress = null) {
    const formData = new FormData()
    formData.append('project_id', projectId)
    formData.append('page_count', pages.length.toString())
    
    // Add all page blobs
    pages.forEach((page, index) => {
      formData.append(`page_${index + 1}`, page.blob, `page_${index + 1}.png`)
      formData.append(`page_${index + 1}_width`, page.width.toString())
      formData.append(`page_${index + 1}_height`, page.height.toString())
    })
    
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"
    
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/upload-pages`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Upload failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to upload pages:', error)
      throw error
    }
  }
}

export default new PDFPreviewService()
