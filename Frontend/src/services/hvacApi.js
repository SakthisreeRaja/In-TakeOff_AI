const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res.json()
}

/* =========================
   MATERIALS
   ========================= */

export async function getMaterials() {
  const res = await fetch(`${API_BASE}/hvac/materials`)
  return handleResponse(res)
}

export async function createMaterial(payload) {
  const res = await fetch(`${API_BASE}/hvac/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

/* =========================
   MANUFACTURERS
   ========================= */

export async function getManufacturers() {
  const res = await fetch(`${API_BASE}/hvac/manufacturers`)
  return handleResponse(res)
}

export async function createManufacturer(payload) {
  const res = await fetch(`${API_BASE}/hvac/manufacturers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

/* =========================
   MODELS
   ========================= */

export async function getModels() {
  const res = await fetch(`${API_BASE}/hvac/models`)
  return handleResponse(res)
}

export async function createModel(payload) {
  const res = await fetch(`${API_BASE}/hvac/models`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

/* =========================
   HVAC COMPONENTS
   ========================= */

export async function getComponentByDetection(detectionId) {
  const res = await fetch(`${API_BASE}/hvac/detections/${detectionId}/component`)
  if (res.status === 404) {
    return null // No component exists yet
  }
  return handleResponse(res)
}

export async function createHVACComponent(payload) {
  const res = await fetch(`${API_BASE}/hvac/components`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function updateHVACComponent(componentId, payload) {
  const res = await fetch(`${API_BASE}/hvac/components/${componentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function deleteHVACComponent(componentId) {
  const res = await fetch(`${API_BASE}/hvac/components/${componentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete HVAC component")
}

export async function getProjectComponents(projectId) {
  const res = await fetch(`${API_BASE}/hvac/projects/${projectId}/components`)
  return handleResponse(res)
}
