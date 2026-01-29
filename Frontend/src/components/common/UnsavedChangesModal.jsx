import { useEffect } from "react"
import { FiAlertCircle, FiX } from "react-icons/fi"

/**
 * UnsavedChangesModal - Beautiful confirmation dialog
 * Shows when user tries to leave with pending sync or PDF upload
 */
export default function UnsavedChangesModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pendingCount,
  isSyncing,
  isUploading = false,
  uploadStage = null
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  // Determine what's happening
  const hasUploadInProgress = isUploading && uploadStage !== 'complete'
  const uploadMessage = uploadStage === 'converting' ? '📄 Converting PDF...' : 
                       uploadStage === 'uploading' ? '☁️ Uploading PDF to cloud...' : 
                       '📄 PDF upload in progress'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 mb-4">
          <FiAlertCircle className="text-yellow-500" size={24} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2">
          {hasUploadInProgress ? "Upload in Progress" : isSyncing ? "Changes Still Saving" : "Unsaved Changes"}
        </h3>

        {/* Message */}
        <p className="text-zinc-400 mb-6">
          {hasUploadInProgress ? (
            <>
              {uploadMessage}
              <br /><br />
              If you leave now, the PDF upload will be interrupted and may not complete successfully.
            </>
          ) : isSyncing ? (
            <>
              Your changes are currently being saved to the server. 
              If you leave now, some changes might not be saved.
            </>
          ) : (
            <>
              You have <span className="text-yellow-500 font-semibold">{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span> that {pendingCount !== 1 ? 'haven\'t' : 'hasn\'t'} been saved yet.
              <br /><br />
              We'll try to save them before you leave, but some changes might be lost.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Stay and Wait
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
          >
            Leave Anyway
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-zinc-500 mt-4 text-center">
          💡 Tip: Wait for the sync indicator to show "Synced ✓" before leaving
        </p>
      </div>
    </div>
  )
}
