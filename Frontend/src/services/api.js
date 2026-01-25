const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

/* =========================
   USERS
   ========================= */

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

/* =========================
   PROJECTS
   ========================= */

export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects/`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

export async function createProject(payload) {
  const res = await fetch(`${API_BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

/* =========================
   PROJECT PAGES (PDF)
   ========================= */

export async function getProjectPages(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/pages`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

export async function uploadProjectPDF(projectId, file) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

/* =========================
   DETECTIONS
   ========================= */

export async function getPageDetections(pageId) {
  const res = await fetch(`${API_BASE}/detections/pages/${pageId}`)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

export async function createDetection(pageId, data) {
  const res = await fetch(`${API_BASE}/detections/pages/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

export async function updateDetection(detectionId, data) {
  const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}

export async function deleteDetection(detectionId) {
  const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
}
