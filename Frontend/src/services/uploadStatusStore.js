const STORAGE_KEY = "project_upload_status_v1"
const EVENT_NAME = "project-upload-status-changed"

export function getProjectUploadStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function setProjectUploadStatus(projectId, status) {
  if (!projectId) return
  const current = getProjectUploadStatuses()
  current[projectId] = {
    ...status,
    updatedAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearProjectUploadStatus(projectId) {
  if (!projectId) return
  const current = getProjectUploadStatuses()
  if (current[projectId]) {
    delete current[projectId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

export function clearAllProjectUploadStatus() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function hasAnyUploadInProgress(statusMap = null) {
  const map = statusMap || getProjectUploadStatuses()
  return Object.values(map).some(s => s?.isUploading)
}

export function subscribeUploadStatus(callback) {
  if (typeof callback !== "function") return () => {}

  const handler = () => {
    callback(getProjectUploadStatuses())
  }

  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener("storage", handler)

  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener("storage", handler)
  }
}
