const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.text()
    // Safety Net: If backend says invalid user, force logout
    if (res.status === 400 && err.includes("User not found")) {
       localStorage.removeItem("user_id")
       window.location.href = "/signin"
    }
    throw new Error(err)
  }
  return res.json()
}

/* =========================
   USERS
   ========================= */

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

// 🔥 Verifies if the user exists (Used by App.jsx)
export async function getUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`)
  if (!res.ok) {
    throw new Error("User not found")
  }
  return res.json()
}

export async function updateUser(userId, payload) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

/* =========================
   PROJECTS
   ========================= */

export async function getProjects() {
  const userId = localStorage.getItem("user_id")
  if (!userId) return [] // If no user, return empty list immediately

  const res = await fetch(`${API_BASE}/projects/?user_id=${userId}`)
  return handleResponse(res)
}

export async function createProject(payload) {
  const res = await fetch(`${API_BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

/* =========================
   PROJECT PAGES & UPLOADS
   ========================= */

export async function getProjectPages(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/pages`)
  return handleResponse(res)
}

export async function uploadProjectPDF(projectId, file) {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  })
  return handleResponse(res)
}

/* =========================
   DETECTIONS
   ========================= */

export async function getPageDetections(pageId) {
  const res = await fetch(`${API_BASE}/detections/pages/${pageId}`)
  return handleResponse(res)
}

export async function createDetection(pageId, data) {
  const res = await fetch(`${API_BASE}/detections/pages/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function updateDetection(detectionId, data) {
  const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function deleteDetection(detectionId) {
  const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete")
}