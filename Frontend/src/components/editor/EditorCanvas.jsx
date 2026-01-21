import { useRef, useState, useEffect } from "react"
import { Document, Page, pdfjs } from 'react-pdf'
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function EditorCanvas({ pdfFile, onUpload, isDragging }) {
  const fileInputRef = useRef(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [containerWidth, setContainerWidth] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (pdfFile) {
      setPageNumber(1)
      setLoadError(null)
    }
  }, [pdfFile])

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setLoadError(null)
  }

  function onDocumentLoadError(error) {
    setLoadError(error.message)
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      onUpload(file)
    } else {
      alert("Please upload a valid PDF file.")
    }
  }

  if (!pdfFile) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        <div className="text-center text-zinc-400 p-4">
          <div className="text-4xl mb-4">⬆️</div>
          <p className="mb-2 text-lg font-medium">No PDF Uploaded</p>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
            Upload a PDF drawing to start detecting HVAC components
          </p>
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Upload PDF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`h-full w-full flex flex-col bg-zinc-900 relative overflow-hidden ${isDragging ? "pointer-events-none" : ""}`}
    >
      <div className="flex-1 w-full overflow-auto flex justify-center py-8 relative">
        
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-zinc-900/80">
             <div className="bg-red-900/50 p-4 rounded border border-red-500 text-red-200 max-w-md text-center">
               <p className="font-bold">Failed to load PDF</p>
               <p className="text-sm mt-1">{loadError}</p>
             </div>
          </div>
        )}

        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="text-zinc-400 mt-10">Loading Document...</div>}
        >
          {numPages && containerWidth && (
            <Page 
              pageNumber={pageNumber} 
              width={containerWidth * 0.95}
              loading={<div className="text-zinc-400 mt-10">Rendering Page...</div>}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          )}
        </Document>
      </div>

      {numPages && (
        <div className="h-14 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-4 text-white z-10 flex-shrink-0">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={previousPage}
            className="p-2 rounded hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>

          <button
            type="button"
            disabled={pageNumber >= numPages}
            onClick={nextPage}
            className="p-2 rounded hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}