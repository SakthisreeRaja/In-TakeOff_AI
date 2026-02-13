import { getAnnotationClassLabel } from "./annotationClasses"

export function generateBOQ(detections = []) {
  const rowsMap = new Map()

  let totalItems = 0
  let manualItems = 0
  let aiItems = 0
  let editedAiItems = 0

  for (const det of detections) {
    if (!det || !det.class_name) continue

    totalItems += 1
    if (det.is_manual) {
      manualItems += 1
    } else {
      aiItems += 1
      if (det.is_edited) {
        editedAiItems += 1
      }
    }

    const className = det.class_name
    const existing = rowsMap.get(className) || {
      className,
      label: getAnnotationClassLabel(className),
      quantity: 0,
      manual: 0,
      ai: 0,
      editedAi: 0,
    }

    existing.quantity += 1
    if (det.is_manual) {
      existing.manual += 1
    } else {
      existing.ai += 1
      if (det.is_edited) {
        existing.editedAi += 1
      }
    }

    rowsMap.set(className, existing)
  }

  const rows = [...rowsMap.values()].sort((a, b) => a.label.localeCompare(b.label))

  return {
    rows,
    totals: {
      totalItems,
      totalClasses: rows.length,
      manualItems,
      aiItems,
      editedAiItems,
    },
  }
}
