import { useEffect, useState } from "react"
import {
  getPageDetections,
  createDetection,
  updateDetection,
  deleteDetection,
} from "../services/api"

export default function useDetections(pageId) {
  const [detections, setDetections] = useState([])

  const fetchDetections = async () => {
    if (!pageId) return
    const data = await getPageDetections(pageId)
    setDetections(data)
  }

  useEffect(() => {
    fetchDetections()
  }, [pageId])

  async function add(box) {
    const d = await createDetection(pageId, box)
    setDetections(v => [...v, d])
  }

  async function update(id, data) {
    const d = await updateDetection(id, data)
    setDetections(v => v.map(x => (x.id === id ? d : x)))
  }

  async function remove(id) {
    await deleteDetection(id)
    setDetections(v => v.filter(x => x.id !== id))
  }

  async function refresh() {
    await fetchDetections()
  }

  return { detections, add, update, remove, refresh }
}
